import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants';
import { AnyAsset, ResolutionScale } from '../../shared/types';
import { ddragonService } from '../services/ddragonService';
import { cacheManager } from '../services/cacheManager';
import { upscalerService } from '../services/upscalerService';

export function registerDDragonHandler(
  currentVersionGetter: () => string,
  currentVersionSetter: (v: string) => void
): void {
  ipcMain.handle(IPC_CHANNELS.GET_VERSIONS, async () => {
    return await ddragonService.getVersions();
  });

  ipcMain.handle(IPC_CHANNELS.GET_CHAMPIONS, async (_event, version: string) => {
    currentVersionSetter(version);
    return await ddragonService.getChampions(version);
  });

  ipcMain.handle(IPC_CHANNELS.GET_ITEMS, async (_event, version: string) => {
    currentVersionSetter(version);
    return await ddragonService.getItems(version);
  });

  ipcMain.handle(
    IPC_CHANNELS.ENSURE_ASSET_CACHED,
    async (_event, asset: AnyAsset, scale: ResolutionScale) => {
      const version = currentVersionGetter();
      if (scale === '1x') {
        return await ddragonService.ensureOriginalCached(version, asset);
      } else {
        return await upscalerService.upscaleAsset(version, asset, scale);
      }
    }
  );

  ipcMain.handle(IPC_CHANNELS.GET_CACHE_STATS, async () => {
    return await cacheManager.getStats();
  });

  ipcMain.handle(IPC_CHANNELS.CALCULATE_SIZE, async () => {
    return await cacheManager.getStats();
  });

  ipcMain.handle(IPC_CHANNELS.OPEN_CACHE_DIR, async () => {
    await cacheManager.openInExplorer();
  });

  ipcMain.handle(IPC_CHANNELS.CLEAR_CACHE, async () => {
    const updatedStats = await cacheManager.clearUpscaledCache();
    return { success: true, stats: updatedStats };
  });
}
