import fs from 'fs';
import { PNG } from 'pngjs';
import { MaskShape, FrameStyle } from '../../shared/types';
const BITMAP_FONT: Record<string, string[]> = {
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00110', '01000', '10000', '11111'],
  '3': ['01110', '10001', '00001', '00110', '00001', '10001', '01110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['01110', '10000', '11110', '10001', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00001', '01110'],
  'A': ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  'B': ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  'C': ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  'D': ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  'E': ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  'F': ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  'G': ['01110', '10001', '10000', '10111', '10001', '10001', '01110'],
  'H': ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  'I': ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
  'J': ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
  'K': ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  'L': ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  'M': ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  'N': ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  'O': ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  'P': ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  'Q': ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  'R': ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  'S': ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  'T': ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  'U': ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  'V': ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  'W': ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  'X': ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  'Y': ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  'Z': ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  'g': ['00000', '01110', '10001', '10001', '01111', '00001', '01110'],
  'k': ['10000', '10000', '10010', '10100', '11000', '10100', '10010'],
  '+': ['00000', '00100', '00100', '11111', '00100', '00100', '00000'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
};

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
   * Processes a PNG buffer with the requested mask shape, frame styling, and optional badge stamp.
   */
  public static async processImage(
    inputBuffer: Buffer,
    shape: MaskShape = 'square',
    frameStyle: FrameStyle = 'none',
    badgeText?: string
  ): Promise<Buffer> {
    if (frameStyle === 'drop_shadow') {
      const png = await this.decodePng(inputBuffer);
      if (shape === 'circle') {
        this.maskCircleInPlace(png);
      }
      if (badgeText) {
        this.stampBadgeInPlace(png, badgeText, shape);
      }
      const stagedBuffer = await this.encodePng(png);
      return await this.applyDropShadow(stagedBuffer, shape);
    }

    const png = await this.decodePng(inputBuffer);

    if (shape === 'circle') {
      this.maskCircleInPlace(png);
    }

    if (badgeText) {
      this.stampBadgeInPlace(png, badgeText, shape);
    }

    if (frameStyle === 'gold_border') {
      if (shape === 'circle') {
        this.applyCircleGoldBorderInPlace(png);
      } else {
        this.applySquareGoldBorderInPlace(png);
      }
    }

    return await this.encodePng(png);
  }

  /**
   * Reads a PNG file on disk, processes shape, framing, and badge, and writes to target path.
   */
  public static async processFileToDisk(
    inputPath: string,
    outputPath: string,
    shape: MaskShape = 'square',
    frameStyle: FrameStyle = 'none',
    badgeText?: string
  ): Promise<string> {
    const buffer = await fs.promises.readFile(inputPath);
    const result = await this.processImage(buffer, shape, frameStyle, badgeText);
    await fs.promises.writeFile(outputPath, result);
    return outputPath;
  }

  /**
   * Legacy method for backward compatibility
   */
  public static async maskFileToDisk(inputPath: string, outputPath: string): Promise<string> {
    return await this.processFileToDisk(inputPath, outputPath, 'circle', 'none');
  }

  /**
   * Stamps a sleek Hextech dark pill badge with gold border and custom text
   * (e.g. "Q", "W", "E", "R", "P", "3000g") directly onto the PNG buffer.
   */
  private static stampBadgeInPlace(png: PNG, text: string, shape: MaskShape): void {
    if (!text || text.trim() === '') return;
    const cleanText = text.trim();
    const width = png.width;
    const height = png.height;
    const data = png.data;

    // Font scaling: 1x on 64px, 2x on 120px, 4x on 256px, 8x on 512px
    const scale = Math.max(1, Math.round(width / 58));
    const charW = 5 * scale;
    const charH = 7 * scale;
    const spacing = Math.max(1, Math.round(scale * 0.8));

    const textWidth = cleanText.length * charW + (cleanText.length - 1) * spacing;
    const textHeight = charH;

    const padX = Math.max(3, Math.round(scale * 2.2));
    const padY = Math.max(2, Math.round(scale * 1.6));
    const pillW = textWidth + padX * 2;
    const pillH = textHeight + padY * 2;
    const radius = Math.max(2, Math.round(scale * 1.8));

    let badgeX: number;
    let badgeY: number;

    if (shape === 'circle') {
      const cx = width / 2;
      const cy = height / 2;
      const circleR = width / 2 - 2;
      // Position neatly inside the bottom-right curve of circular mask
      badgeX = Math.round(cx + (circleR - pillW) * 0.58);
      badgeY = Math.round(cy + (circleR - pillH) * 0.58);
    } else {
      const margin = Math.max(2, Math.round(width * 0.035));
      badgeX = width - pillW - margin;
      badgeY = height - pillH - margin;
    }

    badgeX = Math.max(0, Math.min(width - pillW, badgeX));
    badgeY = Math.max(0, Math.min(height - pillH, badgeY));

    const isGoldCost = cleanText.toLowerCase().endsWith('g') || /^\d+$/.test(cleanText);
    const borderR = 200, borderG = 170, borderB = 110;
    const textR = isGoldCost ? 255 : 255;
    const textG = isGoldCost ? 220 : 255;
    const textB = isGoldCost ? 80 : 255;

    // 1. Draw rounded badge pill
    for (let py = 0; py < pillH; py++) {
      for (let px = 0; px < pillW; px++) {
        const x = badgeX + px;
        const y = badgeY + py;
        if (x < 0 || x >= width || y < 0 || y >= height) continue;

        let isInside = true;
        let isBorder = false;

        const leftDist = px;
        const rightDist = pillW - 1 - px;
        const topDist = py;
        const bottomDist = pillH - 1 - py;

        if (leftDist < radius && topDist < radius) {
          const d = Math.hypot(radius - leftDist, radius - topDist);
          if (d > radius) isInside = false;
          else if (d > radius - 1.2) isBorder = true;
        } else if (rightDist < radius && topDist < radius) {
          const d = Math.hypot(radius - rightDist, radius - topDist);
          if (d > radius) isInside = false;
          else if (d > radius - 1.2) isBorder = true;
        } else if (leftDist < radius && bottomDist < radius) {
          const d = Math.hypot(radius - leftDist, radius - bottomDist);
          if (d > radius) isInside = false;
          else if (d > radius - 1.2) isBorder = true;
        } else if (rightDist < radius && bottomDist < radius) {
          const d = Math.hypot(radius - rightDist, radius - bottomDist);
          if (d > radius) isInside = false;
          else if (d > radius - 1.2) isBorder = true;
        }

        if (leftDist === 0 || rightDist === 0 || topDist === 0 || bottomDist === 0) {
          isBorder = true;
        }

        if (!isInside) continue;

        const idx = (y * width + x) * 4;
        if (isBorder) {
          data[idx] = borderR;
          data[idx + 1] = borderG;
          data[idx + 2] = borderB;
          data[idx + 3] = 245;
        } else {
          // Dark background pill with 90% opacity
          const sa = 0.90;
          const da = (data[idx + 3] / 255.0) * (1.0 - sa);
          const outA = sa + da;
          data[idx] = Math.round((10 * sa + data[idx] * da) / outA);
          data[idx + 1] = Math.round((15 * sa + data[idx + 1] * da) / outA);
          data[idx + 2] = Math.round((24 * sa + data[idx + 2] * da) / outA);
          data[idx + 3] = Math.round(outA * 255);
        }
      }
    }

    // 2. Draw text glyphs with 1px drop shadow
    let currentX = badgeX + padX;
    const currentY = badgeY + padY;

    for (let c = 0; c < cleanText.length; c++) {
      const char = cleanText[c];
      const glyph = BITMAP_FONT[char] || BITMAP_FONT[char.toUpperCase()] || BITMAP_FONT[' '];

      for (let row = 0; row < 7; row++) {
        for (let col = 0; col < 5; col++) {
          if (glyph[row][col] === '1') {
            // Shadow offset by 1px
            const shadowX = currentX + col * scale + 1;
            const shadowY = currentY + row * scale + 1;
            for (let sy = 0; sy < scale; sy++) {
              for (let sx = 0; sx < scale; sx++) {
                const sxCoord = shadowX + sx;
                const syCoord = shadowY + sy;
                if (sxCoord >= 0 && sxCoord < width && syCoord >= 0 && syCoord < height) {
                  const sIdx = (syCoord * width + sxCoord) * 4;
                  data[sIdx] = Math.round(data[sIdx] * 0.3);
                  data[sIdx + 1] = Math.round(data[sIdx + 1] * 0.3);
                  data[sIdx + 2] = Math.round(data[sIdx + 2] * 0.3);
                }
              }
            }

            // Foreground glyph
            for (let sy = 0; sy < scale; sy++) {
              for (let sx = 0; sx < scale; sx++) {
                const gx = currentX + col * scale + sx;
                const gy = currentY + row * scale + sy;
                if (gx >= 0 && gx < width && gy >= 0 && gy < height) {
                  const gIdx = (gy * width + gx) * 4;
                  data[gIdx] = textR;
                  data[gIdx + 1] = textG;
                  data[gIdx + 2] = textB;
                  data[gIdx + 3] = 255;
                }
              }
            }
          }
        }
      }
      currentX += charW + spacing;
    }
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
