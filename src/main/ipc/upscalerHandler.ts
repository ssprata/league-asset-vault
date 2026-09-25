import { ipcMain, BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants';
import {
  AnyAsset,
  ResolutionScale,
  DenoiseLevel,
  MaskShape,
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
    async (
      _event,
      asset: AnyAsset,
      scale: ResolutionScale,
      noiseLevel: DenoiseLevel = 3,
      maskShape: MaskShape = 'square'
    ) => {
      const version = currentVersionGetter();
      return await upscalerService.upscaleAsset(version, asset, scale, noiseLevel, maskShape);
    }
  );

  // Dedicated generate handler with explicit scale, noiseLevel, maskShape, and frameStyle
  ipcMain.handle(
    IPC_CHANNELS.GENERATE_UPSCALE,
    async (_event, request: UpscaleGenerateRequest): Promise<UpscaleGenerateResult> => {
      const version = currentVersionGetter();
      const {
        assetId,
        assetType,
        scale,
        noiseLevel,
        maskShape = 'square',
        frameStyle = 'none',
      } = request;

      try {
        let fileName = request.imageFileName || `${assetId}.png`;
        let cdnUrl = request.cdnUrl || '';

        if (!request.cdnUrl) {
          if (assetType === 'champion') {
            const champs = await ddragonService.getChampions(version);
            const target = champs.find((c) => c.id === assetId);
            if (target) {
              fileName = target.imageFileName;
              cdnUrl = target.cdnUrl;
            }
          } else if (assetType === 'item') {
            const items = await ddragonService.getItems(version);
            const target = items.find((i) => i.id === assetId);
            if (target) {
              fileName = target.imageFileName;
              cdnUrl = target.cdnUrl;
            }
          } else if (assetType === 'summoner') {
            const spells = await ddragonService.getSummonerSpells(version);
            const target = spells.find((s) => s.id === assetId);
            if (target) {
              fileName = target.imageFileName;
              cdnUrl = target.cdnUrl;
            }
          } else if (assetType === 'rune') {
            const runes = await ddragonService.getRunes(version);
            const target = runes.find((r) => r.id === assetId);
            if (target) {
              fileName = target.imageFileName;
              cdnUrl = target.cdnUrl;
            }
          }
        }

        const isCached = cacheManager.assetExists(
          version,
          assetType,
          fileName,
          scale,
          noiseLevel,
          maskShape,
          frameStyle
        );

        const dummyAsset: AnyAsset = {
          type: assetType,
          id: assetId,
          imageFileName: fileName,
          cdnUrl,
        } as any;

        const filePath = await upscalerService.upscaleAsset(
          version,
          dummyAsset,
          scale,
          noiseLevel,
          maskShape,
          frameStyle
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

  // Query to check if a specific parameter combination is already cached on disk
  ipcMain.handle(
    IPC_CHANNELS.GET_UPSCALE_INFO,
    async (_event, request: UpscaleGenerateRequest): Promise<UpscaleGenerateResult> => {
      const version = currentVersionGetter();
      const {
        assetId,
        assetType,
        scale,
        noiseLevel,
        maskShape = 'square',
        frameStyle = 'none',
      } = request;

      const fileName = request.imageFileName || `${assetId}.png`;
      const isCached = cacheManager.assetExists(
        version,
        assetType,
        fileName,
        scale,
        noiseLevel,
        maskShape,
        frameStyle
      );

      if (isCached) {
        const filePath = cacheManager.getAssetPath(
          version,
          assetType,
          fileName,
          scale,
          noiseLevel,
          maskShape,
          frameStyle
        );
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
