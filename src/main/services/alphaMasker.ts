import fs from 'fs';
import { PNG } from 'pngjs';

export class AlphaMasker {
  /**
   * Applies an anti-aliased circular alpha cutout to a PNG image buffer.
   * Areas outside the circle become fully transparent (alpha = 0).
   * 
   * @param inputBuffer Raw PNG buffer
   * @returns Circular masked PNG buffer
   */
  public static async applyCircleMask(inputBuffer: Buffer): Promise<Buffer> {
    const png = await this.decodePng(inputBuffer);
    const width = png.width;
    const height = png.height;
    const data = png.data;

    const centerX = width / 2.0;
    const centerY = height / 2.0;
    const radius = Math.min(centerX, centerY) - 1.5;
    const featherWidth = 1.5; // Smooth anti-aliased sub-pixel rim

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = (x + 0.5) - centerX;
        const dy = (y + 0.5) - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const idx = (y * width + x) * 4;

        if (dist >= radius + featherWidth) {
          // Outside circle: full transparency
          data[idx + 3] = 0;
        } else if (dist > radius - featherWidth) {
          // Feathered anti-aliased border
          const factor = (radius + featherWidth - dist) / (featherWidth * 2.0);
          const clamped = Math.max(0.0, Math.min(1.0, factor));
          data[idx + 3] = Math.round(data[idx + 3] * clamped);
        }
        // Inside radius - featherWidth: keep existing alpha unchanged
      }
    }

    return await this.encodePng(png);
  }

  /**
   * Reads a PNG file on disk, applies circular mask, and writes to target path
   */
  public static async maskFileToDisk(inputPath: string, outputPath: string): Promise<string> {
    const buffer = await fs.promises.readFile(inputPath);
    const masked = await this.applyCircleMask(buffer);
    await fs.promises.writeFile(outputPath, masked);
    return outputPath;
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
