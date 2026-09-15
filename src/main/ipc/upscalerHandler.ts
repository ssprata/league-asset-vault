import { ipcMain, BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants';
import {
  AnyAsset,
  ResolutionScale,
  DenoiseLevel,
  UpscaleGenerateRequest,
  UpscaleGenerateResult,
  UpscaleProgressPayload,
} from '../../shared/types';
import { upscalerService } from '../services/upscalerService';
import { cacheManager } from '../services/cacheManager';
import { ddragonService } from '../services/ddragonService';

export function registerUpscalerHandler(
  currentVersionGetter: () => string,
  getMainWindow: () => BrowserWindow | null
): void {
  // Legacy or quick single-asset upscale
  ipcMain.handle(
    IPC_CHANNELS.UPSCALE_ASSET,
    async (_event, asset: AnyAsset, scale: ResolutionScale, noiseLevel: DenoiseLevel = 3) => {
      const version = currentVersionGetter();
      return await upscalerService.upscaleAsset(version, asset, scale, noiseLevel);
    }
  );

  // Dedicated generate handler with explicit scale and noiseLevel
  ipcMain.handle(
    IPC_CHANNELS.GENERATE_UPSCALE,
    async (_event, request: UpscaleGenerateRequest): Promise<UpscaleGenerateResult> => {
      const version = currentVersionGetter();
      const { assetId, assetType, scale, noiseLevel } = request;

      try {
        let targetAsset: AnyAsset | undefined;
        if (assetType === 'champion') {
          const champs = await ddragonService.getChampions(version);
          targetAsset = champs.find((c) => c.id === assetId);
        } else {
          const items = await ddragonService.getItems(version);
          targetAsset = items.find((i) => i.id === assetId);
        }

        if (!targetAsset) {
          return {
            success: false,
            filePath: '',
            fromCache: false,
            dataUrl: null,
            error: `Asset ${assetId} not found in version ${version}`,
          };
        }

        const isCached = cacheManager.assetExists(
          version,
          assetType,
          targetAsset.imageFileName,
          scale,
          noiseLevel
        );

        const filePath = await upscalerService.upscaleAsset(
          version,
          targetAsset,
          scale,
          noiseLevel
        );

        const dataUrl = await upscalerService.getFileDataUrl(filePath);

        return {
          success: true,
          filePath,
          fromCache: isCached,
          dataUrl,
        };
      } catch (err: any) {
        console.error('[UpscalerHandler] Error in GENERATE_UPSCALE:', err);
        return {
          success: false,
          filePath: '',
          fromCache: false,
          dataUrl: null,
          error: err.message || 'Unknown upscaling error',
        };
      }
    }
  );

  // Inspector query to check if a specific parameter combination is already cached on disk
  ipcMain.handle(
    IPC_CHANNELS.GET_UPSCALE_INFO,
    async (_event, request: UpscaleGenerateRequest): Promise<UpscaleGenerateResult> => {
      const version = currentVersionGetter();
      const { assetId, assetType, scale, noiseLevel } = request;

      const fileName = `${assetId}.png`;
      const isCached = cacheManager.assetExists(version, assetType, fileName, scale, noiseLevel);

      if (isCached) {
        const filePath = cacheManager.getAssetPath(version, assetType, fileName, scale, noiseLevel);
        const dataUrl = await upscalerService.getFileDataUrl(filePath);
        return {
          success: true,
          filePath,
          fromCache: true,
          dataUrl,
        };
      }

      return {
        success: false,
        filePath: '',
        fromCache: false,
        dataUrl: null,
      };
    }
  );

  // Batch upscale
  ipcMain.handle(
    IPC_CHANNELS.BATCH_UPSCALE,
    async (_event, assets: AnyAsset[], scale: ResolutionScale) => {
      const version = currentVersionGetter();
      const win = getMainWindow();

      await upscalerService.batchUpscale(version, assets, scale, (payload: UpscaleProgressPayload) => {
        if (win && !win.isDestroyed()) {
          win.webContents.send(IPC_CHANNELS.UPSCALE_PROGRESS, payload);
        }
      });
    }
  );

  ipcMain.handle(IPC_CHANNELS.CANCEL_BATCH_UPSCALE, async () => {
    upscalerService.cancelBatch();
  });
}
