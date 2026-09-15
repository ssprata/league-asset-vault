import fs from 'fs';
import { AnyAsset, ResolutionScale, DenoiseLevel, MaskShape, UpscaleProgressPayload } from '../../shared/types';
import { cacheManager } from './cacheManager';
import { ddragonService } from './ddragonService';
import { runWaifu2x } from '../upscaler';
import { ImageResampler } from './imageResampler';
import { settingsManager } from './settingsManager';
import { AlphaMasker } from './alphaMasker';

export class UpscalerService {
  private isBatchCancelled = false;
  private isProcessingBatch = false;

  /**
   * Upscales a single asset to the target scale, noise level, and mask shape, caching it on disk.
   */
  public async upscaleAsset(
    version: string,
    asset: AnyAsset,
    scale: ResolutionScale,
    noiseLevel: DenoiseLevel = 3,
    maskShape: MaskShape = 'square'
  ): Promise<string> {
    const targetPath = cacheManager.getAssetPath(
      version,
      asset.type,
      asset.imageFileName,
      scale,
      noiseLevel,
      maskShape
    );

    if (fs.existsSync(targetPath) && fs.statSync(targetPath).size > 0) {
      return targetPath;
    }

    // Step 1: Ensure the square version exists
    let squarePath = cacheManager.getAssetPath(
      version,
      asset.type,
      asset.imageFileName,
      scale,
      noiseLevel,
      'square'
    );

    if (!fs.existsSync(squarePath) || fs.statSync(squarePath).size === 0) {
      if (scale === '1x') {
        squarePath = await ddragonService.ensureOriginalCached(version, asset);
      } else {
        const originalPath = await ddragonService.ensureOriginalCached(version, asset);
        const scaleNum = scale === '4x' ? 4 : 2;
        const settings = settingsManager.getSettings();

        try {
          // Primary: Native waifu2x-ncnn-vulkan with models-cunet and user settings
          await runWaifu2x(originalPath, squarePath, {
            scale: scaleNum,
            denoise: noiseLevel,
            modelName: 'models-cunet',
            gpuId: settings.gpuId,
            tileSize: settings.tileSize > 0 ? settings.tileSize : undefined,
          });
        } catch (err) {
          console.warn('[UpscalerService] waifu2x failed, falling back to Lanczos-3 resampler:', err);
          const inputBuffer = await fs.promises.readFile(originalPath);
          const upscaledBuffer = await ImageResampler.resample(inputBuffer, scaleNum);
          await fs.promises.writeFile(squarePath, upscaledBuffer);
        }
      }
    }

    // Step 2: If circle mask is requested, generate transparent circle cutout
    if (maskShape === 'circle') {
      try {
        await AlphaMasker.maskFileToDisk(squarePath, targetPath);
        return targetPath;
      } catch (maskErr) {
        console.error('[UpscalerService] Failed applying circle mask, using square:', maskErr);
        return squarePath;
      }
    }

    return squarePath;
  }

  /**
   * Converts a local file on disk into a base64 Data URL for instant Chromium preview
   */
  public async getFileDataUrl(filePath: string): Promise<string | null> {
    try {
      if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
        const buffer = await fs.promises.readFile(filePath);
        return `data:image/png;base64,${buffer.toString('base64')}`;
      }
    } catch (e) {
      console.error('[UpscalerService] Failed reading file dataUrl:', e);
    }
    return null;
  }

  /**
   * Batch upscales multiple assets concurrently with progress reporting
   */
  public async batchUpscale(
    version: string,
    assets: AnyAsset[],
    scale: ResolutionScale,
    onProgress: (payload: UpscaleProgressPayload) => void
  ): Promise<void> {
    if (this.isProcessingBatch) {
      console.warn('[UpscalerService] Batch upscale already in progress');
      return;
    }

    this.isProcessingBatch = true;
    this.isBatchCancelled = false;

    const total = assets.length;
    let completed = 0;
    const concurrencyLimit = 2; // Optimal for GPU VRAM & Vulkan queue

    onProgress({
      currentId: '',
      currentName: 'Starting batch...',
      completed: 0,
      total,
      scale,
      status: 'processing',
    });

    const queue = [...assets];
    const workers = Array(concurrencyLimit).fill(null).map(async () => {
      while (queue.length > 0 && !this.isBatchCancelled) {
        const item = queue.shift();
        if (!item) break;

        try {
          await this.upscaleAsset(version, item, scale, 3);
        } catch (err) {
          console.error(`[UpscalerService] Failed upscaling ${item.name}:`, err);
        }

        completed++;
        onProgress({
          currentId: item.id,
          currentName: item.name,
          completed,
          total,
          scale,
          status: 'processing',
        });
      }
    });

    await Promise.all(workers);

    const finalStatus = this.isBatchCancelled ? 'idle' : 'done';
    this.isProcessingBatch = false;

    onProgress({
      currentId: '',
      currentName: this.isBatchCancelled ? 'Batch cancelled' : 'Batch complete',
      completed,
      total,
      scale,
      status: finalStatus,
    });
  }

  public cancelBatch(): void {
    this.isBatchCancelled = true;
  }
}

export const upscalerService = new UpscalerService();
