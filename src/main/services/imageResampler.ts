import { PNG } from 'pngjs';

/**
 * Mathematical sinc function: sin(pi*x) / (pi*x)
 */
function sinc(x: number): number {
  if (x === 0) return 1.0;
  const pix = Math.PI * x;
  return Math.sin(pix) / pix;
}

/**
 * Lanczos-3 windowed sinc kernel
 */
function lanczos3(x: number): number {
  const absX = Math.abs(x);
  if (absX >= 3.0) return 0.0;
  return sinc(x) * sinc(x / 3.0);
}

/**
 * Separable Lanczos-3 image resampler with adaptive unsharp mask
 */
export class ImageResampler {
  /**
   * Resamples a PNG buffer by a target scale factor (2 or 4)
   */
  public static async resample(inputBuffer: Buffer, scale: 2 | 4): Promise<Buffer> {
    const srcPng = await this.decodePng(inputBuffer);
    const srcW = srcPng.width;
    const srcH = srcPng.height;
    const dstW = srcW * scale;
    const dstH = srcH * scale;

    // Step 1: Horizontal pass (srcW x srcH -> dstW x srcH)
    const intermediate = new Float32Array(dstW * srcH * 4);
    const srcData = srcPng.data;

    for (let y = 0; y < srcH; y++) {
      for (let x = 0; x < dstW; x++) {
        // Map destination x to source coordinate
        const srcX = (x + 0.5) / scale - 0.5;
        const xMin = Math.max(0, Math.floor(srcX - 3));
        const xMax = Math.min(srcW - 1, Math.ceil(srcX + 3));

        let r = 0, g = 0, b = 0, a = 0;
        let weightSum = 0;

        for (let sx = xMin; sx <= xMax; sx++) {
          const weight = lanczos3(srcX - sx);
          if (weight === 0) continue;

          const srcIdx = (y * srcW + sx) * 4;
          const alpha = srcData[srcIdx + 3] / 255.0;

          // Premultiplied alpha for color integrity
          r += srcData[srcIdx] * alpha * weight;
          g += srcData[srcIdx + 1] * alpha * weight;
          b += srcData[srcIdx + 2] * alpha * weight;
          a += srcData[srcIdx + 3] * weight;
          weightSum += weight;
        }

        const dstIdx = (y * dstW + x) * 4;
        if (weightSum > 0) {
          intermediate[dstIdx] = r / weightSum;
          intermediate[dstIdx + 1] = g / weightSum;
          intermediate[dstIdx + 2] = b / weightSum;
          intermediate[dstIdx + 3] = a / weightSum;
        }
      }
    }

    // Step 2: Vertical pass (dstW x srcH -> dstW x dstH)
    const dstPng = new PNG({ width: dstW, height: dstH });
    const dstData = dstPng.data;

    for (let x = 0; x < dstW; x++) {
      for (let y = 0; y < dstH; y++) {
        const srcY = (y + 0.5) / scale - 0.5;
        const yMin = Math.max(0, Math.floor(srcY - 3));
        const yMax = Math.min(srcH - 1, Math.ceil(srcY + 3));

        let r = 0, g = 0, b = 0, a = 0;
        let weightSum = 0;

        for (let sy = yMin; sy <= yMax; sy++) {
          const weight = lanczos3(srcY - sy);
          if (weight === 0) continue;

          const interIdx = (sy * dstW + x) * 4;
          r += intermediate[interIdx] * weight;
          g += intermediate[interIdx + 1] * weight;
          b += intermediate[interIdx + 2] * weight;
          a += intermediate[interIdx + 3] * weight;
          weightSum += weight;
        }

        const outIdx = (y * dstW + x) * 4;
        if (weightSum > 0) {
          const finalA = Math.max(0, Math.min(255, a / weightSum));
          const alphaNorm = finalA > 0 ? finalA / 255.0 : 1.0;

          // Demultiply alpha
          const finalR = Math.max(0, Math.min(255, (r / weightSum) / alphaNorm));
          const finalG = Math.max(0, Math.min(255, (g / weightSum) / alphaNorm));
          const finalB = Math.max(0, Math.min(255, (b / weightSum) / alphaNorm));

          dstData[outIdx] = Math.round(finalR);
          dstData[outIdx + 1] = Math.round(finalG);
          dstData[outIdx + 2] = Math.round(finalB);
          dstData[outIdx + 3] = Math.round(finalA);
        }
      }
    }

    // Step 3: Subtle unsharp mask to restore crisp illustration edges
    this.applyUnsharpMask(dstData, dstW, dstH, 0.25);

    return this.encodePng(dstPng);
  }

  /**
   * Fast 3x3 Laplacian sharpening filter
   */
  private static applyUnsharpMask(data: Buffer, width: number, height: number, amount: number): void {
    const copy = Buffer.from(data);
    const kernelCenter = 1.0 + 4.0 * amount;
    const kernelEdge = -amount;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const alpha = copy[idx + 3];
        if (alpha < 32) continue; // Skip near-transparent borders

        for (let c = 0; c < 3; c++) {
          const center = copy[idx + c];
          const top = copy[((y - 1) * width + x) * 4 + c];
          const bottom = copy[((y + 1) * width + x) * 4 + c];
          const left = copy[(y * width + (x - 1)) * 4 + c];
          const right = copy[(y * width + (x + 1)) * 4 + c];

          const sharpened = center * kernelCenter + (top + bottom + left + right) * kernelEdge;
          data[idx + c] = Math.max(0, Math.min(255, Math.round(sharpened)));
        }
      }
    }
  }

  private static decodePng(buffer: Buffer): Promise<PNG> {
    return new Promise((resolve, reject) => {
      new PNG().parse(buffer, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }

  private static encodePng(png: PNG): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      png.pack()
        .on('data', (chunk) => chunks.push(chunk))
        .on('end', () => resolve(Buffer.concat(chunks)))
        .on('error', (err) => reject(err));
    });
  }
}
