import fs from 'fs';
import { AnyAsset, ResolutionScale, DenoiseLevel, UpscaleProgressPayload } from '../../shared/types';
import { cacheManager } from './cacheManager';
import { ddragonService } from './ddragonService';
import { runWaifu2x } from '../upscaler';
import { ImageResampler } from './imageResampler';

export class UpscalerService {
  private isBatchCancelled = false;
  private isProcessingBatch = false;

  /**
   * Upscales a single asset to the target scale and noise level, caching it on disk.
   */
  public async upscaleAsset(
    version: string,
    asset: AnyAsset,
    scale: ResolutionScale,
    noiseLevel: DenoiseLevel = 3
  ): Promise<string> {
    if (scale === '1x') {
      return await ddragonService.ensureOriginalCached(version, asset);
    }

    const cachedUpscaled = cacheManager.getAssetPath(
      version,
      asset.type,
      asset.imageFileName,
      scale,
      noiseLevel
    );

    if (fs.existsSync(cachedUpscaled) && fs.statSync(cachedUpscaled).size > 0) {
      return cachedUpscaled;
    }

    // Ensure 1x original is downloaded and cached
    const originalPath = await ddragonService.ensureOriginalCached(version, asset);
    const scaleNum = scale === '4x' ? 4 : 2;

    try {
      // Primary: Native waifu2x-ncnn-vulkan with models-cunet and explicit noise reduction
      await runWaifu2x(originalPath, cachedUpscaled, {
        scale: scaleNum,
        denoise: noiseLevel,
        modelName: 'models-cunet',
      });
      return cachedUpscaled;
    } catch (err) {
      console.warn('[UpscalerService] waifu2x-ncnn-vulkan failed, falling back to Lanczos-3 resampler:', err);
      // Fallback: Mathematical Lanczos-3 Resampler
      const inputBuffer = await fs.promises.readFile(originalPath);
      const upscaledBuffer = await ImageResampler.resample(inputBuffer, scaleNum);
      await fs.promises.writeFile(cachedUpscaled, upscaledBuffer);
      return cachedUpscaled;
    }
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
