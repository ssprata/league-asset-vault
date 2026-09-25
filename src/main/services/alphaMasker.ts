import fs from 'fs';
import { PNG } from 'pngjs';
import { MaskShape, FrameStyle } from '../../shared/types';

export class AlphaMasker {
  /**
   * Applies an anti-aliased circular alpha cutout to a PNG image buffer.
   * Areas outside the circle become fully transparent (alpha = 0).
   */
  public static async applyCircleMask(inputBuffer: Buffer): Promise<Buffer> {
    const png = await this.decodePng(inputBuffer);
    this.maskCircleInPlace(png);
    return await this.encodePng(png);
  }

  /**
   * Applies a Hextech metallic gold border (square or circular) to a PNG buffer.
   */
  public static async applyGoldBorder(inputBuffer: Buffer, shape: MaskShape = 'square'): Promise<Buffer> {
    const png = await this.decodePng(inputBuffer);
    if (shape === 'circle') {
      this.maskCircleInPlace(png);
      this.applyCircleGoldBorderInPlace(png);
    } else {
      this.applySquareGoldBorderInPlace(png);
    }
    return await this.encodePng(png);
  }

  /**
   * Applies a soft ambient drop shadow with alpha padding to a PNG buffer.
   */
  public static async applyDropShadow(inputBuffer: Buffer, shape: MaskShape = 'square'): Promise<Buffer> {
    const srcPng = await this.decodePng(inputBuffer);
    if (shape === 'circle') {
      this.maskCircleInPlace(srcPng);
    }

    const pad = Math.max(8, Math.round(srcPng.width * 0.05));
    const shadowOffsetY = Math.max(3, Math.round(pad * 0.45));
    const outWidth = srcPng.width + pad * 2;
    const outHeight = srcPng.height + pad * 2;

    const outPng = new PNG({ width: outWidth, height: outHeight });
    // Initialize transparent
    outPng.data.fill(0);

    const shadowCenterX = outWidth / 2.0;
    const shadowCenterY = outHeight / 2.0 + shadowOffsetY;
    const radius = srcPng.width / 2.0;
    const shadowBlur = pad * 0.9;

    // Render shadow layer
    for (let y = 0; y < outHeight; y++) {
      for (let x = 0; x < outWidth; x++) {
        let shadowAlpha = 0;

        if (shape === 'circle') {
          const dx = (x + 0.5) - shadowCenterX;
          const dy = (y + 0.5) - shadowCenterY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist <= radius) {
            shadowAlpha = 150;
          } else if (dist < radius + shadowBlur) {
            const factor = 1.0 - (dist - radius) / shadowBlur;
            shadowAlpha = Math.round(150 * Math.max(0, Math.min(1, factor)));
          }
        } else {
          // Rounded rect shadow
          const minX = pad;
          const maxX = pad + srcPng.width;
          const minY = pad + shadowOffsetY;
          const maxY = pad + shadowOffsetY + srcPng.height;

          const cx = Math.max(minX, Math.min(x, maxX));
          const cy = Math.max(minY, Math.min(y, maxY));
          const dist = Math.hypot(x - cx, y - cy);

          if (dist === 0) {
            shadowAlpha = 150;
          } else if (dist < shadowBlur) {
            const factor = 1.0 - dist / shadowBlur;
            shadowAlpha = Math.round(150 * Math.max(0, Math.min(1, factor)));
          }
        }

        if (shadowAlpha > 0) {
          const outIdx = (y * outWidth + x) * 4;
          outPng.data[outIdx] = 0;
          outPng.data[outIdx + 1] = 0;
          outPng.data[outIdx + 2] = 0;
          outPng.data[outIdx + 3] = shadowAlpha;
        }
      }
    }

    // Composite source image on top of shadow in center
    for (let sy = 0; sy < srcPng.height; sy++) {
      for (let sx = 0; sx < srcPng.width; sx++) {
        const sIdx = (sy * srcPng.width + sx) * 4;
        const sAlpha = srcPng.data[sIdx + 3];
        if (sAlpha === 0) continue;

        const dx = sx + pad;
        const dy = sy + pad;
        const dIdx = (dy * outWidth + dx) * 4;

        if (sAlpha === 255) {
          outPng.data[dIdx] = srcPng.data[sIdx];
          outPng.data[dIdx + 1] = srcPng.data[sIdx + 1];
          outPng.data[dIdx + 2] = srcPng.data[sIdx + 2];
          outPng.data[dIdx + 3] = 255;
        } else {
          // Alpha blend
          const sa = sAlpha / 255.0;
          const da = (outPng.data[dIdx + 3] / 255.0) * (1.0 - sa);
          const outA = sa + da;

          if (outA > 0) {
            outPng.data[dIdx] = Math.round((srcPng.data[sIdx] * sa + outPng.data[dIdx] * da) / outA);
            outPng.data[dIdx + 1] = Math.round((srcPng.data[sIdx + 1] * sa + outPng.data[dIdx + 1] * da) / outA);
            outPng.data[dIdx + 2] = Math.round((srcPng.data[sIdx + 2] * sa + outPng.data[dIdx + 2] * da) / outA);
            outPng.data[dIdx + 3] = Math.round(outA * 255);
          }
        }
      }
    }

    return await this.encodePng(outPng);
  }

  /**
   * Processes a PNG buffer with the requested mask shape and frame styling.
   */
  public static async processImage(
    inputBuffer: Buffer,
    shape: MaskShape = 'square',
    frameStyle: FrameStyle = 'none'
  ): Promise<Buffer> {
    if (frameStyle === 'drop_shadow') {
      return await this.applyDropShadow(inputBuffer, shape);
    }

    if (frameStyle === 'gold_border') {
      return await this.applyGoldBorder(inputBuffer, shape);
    }

    if (shape === 'circle') {
      return await this.applyCircleMask(inputBuffer);
    }

    return inputBuffer;
  }

  /**
   * Reads a PNG file on disk, processes shape and framing, and writes to target path.
   */
  public static async processFileToDisk(
    inputPath: string,
    outputPath: string,
    shape: MaskShape = 'square',
    frameStyle: FrameStyle = 'none'
  ): Promise<string> {
    const buffer = await fs.promises.readFile(inputPath);
    const result = await this.processImage(buffer, shape, frameStyle);
    await fs.promises.writeFile(outputPath, result);
    return outputPath;
  }

  /**
   * Legacy method for backward compatibility
   */
  public static async maskFileToDisk(inputPath: string, outputPath: string): Promise<string> {
    return await this.processFileToDisk(inputPath, outputPath, 'circle', 'none');
  }

  private static maskCircleInPlace(png: PNG): void {
    const width = png.width;
    const height = png.height;
    const data = png.data;
    const centerX = width / 2.0;
    const centerY = height / 2.0;
    const radius = Math.min(centerX, centerY) - 1.5;
    const featherWidth = 1.5;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = (x + 0.5) - centerX;
        const dy = (y + 0.5) - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const idx = (y * width + x) * 4;

        if (dist >= radius + featherWidth) {
          data[idx + 3] = 0;
        } else if (dist > radius - featherWidth) {
          const factor = (radius + featherWidth - dist) / (featherWidth * 2.0);
          const clamped = Math.max(0.0, Math.min(1.0, factor));
          data[idx + 3] = Math.round(data[idx + 3] * clamped);
        }
      }
    }
  }

  private static applyCircleGoldBorderInPlace(png: PNG): void {
    const width = png.width;
    const height = png.height;
    const data = png.data;
    const centerX = width / 2.0;
    const centerY = height / 2.0;
    const radius = Math.min(centerX, centerY) - 1.5;
    const borderWidth = Math.max(2.5, width * 0.025);

    for (let y = 0; y < height; y++) {
      const t = y / height;
      const goldR = Math.round(200 * (1 - t) + 120 * t);
      const goldG = Math.round(170 * (1 - t) + 90 * t);
      const goldB = Math.round(110 * (1 - t) + 40 * t);

      for (let x = 0; x < width; x++) {
        const dx = (x + 0.5) - centerX;
        const dy = (y + 0.5) - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= radius && dist >= radius - borderWidth) {
          const idx = (y * width + x) * 4;
          if (data[idx + 3] > 0) {
            data[idx] = goldR;
            data[idx + 1] = goldG;
            data[idx + 2] = goldB;
          }
        }
      }
    }
  }

  private static applySquareGoldBorderInPlace(png: PNG): void {
    const width = png.width;
    const height = png.height;
    const data = png.data;
    const borderWidth = Math.max(2, Math.round(width * 0.022));

    for (let y = 0; y < height; y++) {
      const t = y / height;
      const goldR = Math.round(200 * (1 - t) + 120 * t);
      const goldG = Math.round(170 * (1 - t) + 90 * t);
      const goldB = Math.round(110 * (1 - t) + 40 * t);

      for (let x = 0; x < width; x++) {
        if (
          x < borderWidth ||
          x >= width - borderWidth ||
          y < borderWidth ||
          y >= height - borderWidth
        ) {
          const idx = (y * width + x) * 4;
          data[idx] = goldR;
          data[idx + 1] = goldG;
          data[idx + 2] = goldB;
          data[idx + 3] = 255;
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
