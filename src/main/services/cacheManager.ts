import fs from 'fs';
import path from 'path';
import { app, shell } from 'electron';
import { AssetType, CacheStats, ResolutionScale, DenoiseLevel, MaskShape, FrameStyle } from '../../shared/types';

/**
 * Formats byte values to human-readable strings (B, KB, MB, GB).
 */
export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export class CacheManager {
  private baseCacheDir: string;

  constructor() {
    // Standard Windows AppData directory: %APPDATA%\league-asset-vault\cache
    const userData = app?.getPath
      ? app.getPath('userData')
      : path.join(process.env.APPDATA || process.cwd(), 'league-asset-vault');
    this.baseCacheDir = path.join(userData, 'cache');
    this.ensureDirExists(this.baseCacheDir);
  }

  public getBaseCacheDir(): string {
    return this.baseCacheDir;
  }

  public getVersionDir(version: string): string {
    const dir = path.join(this.baseCacheDir, version);
    this.ensureDirExists(dir);
    return dir;
  }

  public getAssetPath(
    version: string,
    type: AssetType,
    fileName: string,
    scale: ResolutionScale = '1x',
    noiseLevel: DenoiseLevel = 3,
    maskShape: MaskShape = 'square',
    frameStyle: FrameStyle = 'none'
  ): string {
    let subfolder = 'original';
    if (scale === '2x') subfolder = 'upscaled_2x';
    if (scale === '4x') subfolder = 'upscaled_4x';

    let typeFolder = 'champions';
    if (type === 'item') typeFolder = 'items';
    else if (type === 'summoner') typeFolder = 'summoners';
    else if (type === 'ability') typeFolder = 'abilities';
    else if (type === 'rune') typeFolder = 'runes';
    else if (type === 'skin') typeFolder = 'skins';

    const targetDir = path.join(this.getVersionDir(version), subfolder, typeFolder);
    this.ensureDirExists(targetDir);

    let rawId = path.basename(fileName, path.extname(fileName));
    if (rawId.includes('_scale')) {
      rawId = rawId.split('_scale')[0];
    }
    if (rawId.includes('_circle')) {
      rawId = rawId.split('_circle')[0];
    }
    if (rawId.includes('_gold_border')) {
      rawId = rawId.split('_gold_border')[0];
    }
    if (rawId.includes('_drop_shadow')) {
      rawId = rawId.split('_drop_shadow')[0];
    }

    const circleSuffix = maskShape === 'circle' ? '_circle' : '';
    const frameSuffix = frameStyle && frameStyle !== 'none' ? `_${frameStyle}` : '';

    if (scale === '1x') {
      return path.join(targetDir, `${rawId}${circleSuffix}${frameSuffix}.png`);
    }

    const scaleNum = scale === '4x' ? '4' : '2';
    const fingerprintedName = `${rawId}_scale${scaleNum}x_noise${noiseLevel}${circleSuffix}${frameSuffix}.png`;
    return path.join(targetDir, fingerprintedName);
  }

  public assetExists(
    version: string,
    type: AssetType,
    fileName: string,
    scale: ResolutionScale = '1x',
    noiseLevel: DenoiseLevel = 3,
    maskShape: MaskShape = 'square',
    frameStyle: FrameStyle = 'none'
  ): boolean {
    const filePath = this.getAssetPath(version, type, fileName, scale, noiseLevel, maskShape, frameStyle);
    return fs.existsSync(filePath) && fs.statSync(filePath).size > 0;
  }


  public async saveAsset(
    version: string,
    type: AssetType,
    fileName: string,
    data: Buffer,
    scale: ResolutionScale = '1x'
  ): Promise<string> {
    const targetPath = this.getAssetPath(version, type, fileName, scale);
    await fs.promises.writeFile(targetPath, data);
    return targetPath;
  }

  /**
   * Recursively calculates the exact on-disk size and file counts.
   * Returns human-readable formatted string (MB/GB) and detailed metrics.
   */
  public async getStats(): Promise<CacheStats> {
    let totalFiles = 0;
    let totalSizeBytes = 0;
    let originalCount = 0;
    let upscaledCount = 0;

    const walk = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        try {
          if (entry.isDirectory()) {
            walk(fullPath);
          } else if (entry.isFile()) {
            totalFiles++;
            const stat = fs.statSync(fullPath);
            totalSizeBytes += stat.size;

            if (fullPath.includes('upscaled')) {
              upscaledCount++;
            } else if (fullPath.includes('original')) {
              originalCount++;
            }
          }
        } catch (e) {
          // File might be locked or removed during scan
        }
      }
    };

    walk(this.baseCacheDir);

    return {
      cacheDir: this.baseCacheDir,
      totalFiles,
      totalSizeBytes,
      formattedSize: formatBytes(totalSizeBytes),
      upscaledCount,
      originalCount,
    };
  }

  /**
   * Safely clears all upscaled assets (upscaled_2x, upscaled_4x) across all version directories
   * while strictly preserving configuration files (versions.json, champions_manifest.json, items_manifest.json).
   */
  public async clearUpscaledCache(): Promise<CacheStats> {
    if (!fs.existsSync(this.baseCacheDir)) {
      return await this.getStats();
    }

    const clearUpscaledDirs = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          // If folder is an upscaled cache directory, purge it
          if (entry.name === 'upscaled_2x' || entry.name === 'upscaled_4x') {
            try {
              fs.rmSync(fullPath, { recursive: true, force: true });
              console.log(`[CacheManager] Removed upscaled cache directory: ${fullPath}`);
            } catch (err) {
              console.error(`[CacheManager] Failed to remove ${fullPath}:`, err);
            }
          } else {
            // Recurse into subdirectories (e.g. version folders)
            clearUpscaledDirs(fullPath);
          }
        }
      }
    };

    clearUpscaledDirs(this.baseCacheDir);
    return await this.getStats();
  }

  /**
   * Opens the AppData cache folder in Windows Explorer
   */
  public async openInExplorer(): Promise<void> {
    this.ensureDirExists(this.baseCacheDir);
    await shell.openPath(this.baseCacheDir);
  }

  private ensureDirExists(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

export const cacheManager = new CacheManager();
