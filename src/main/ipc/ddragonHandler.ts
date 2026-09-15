import { ipcMain, BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants';
import { AnyAsset, ResolutionScale, AppSettings, PrecacheProgressPayload } from '../../shared/types';
import { ddragonService } from '../services/ddragonService';
import { cacheManager } from '../services/cacheManager';
import { upscalerService } from '../services/upscalerService';
import { settingsManager } from '../services/settingsManager';

export function registerDDragonHandler(
  currentVersionGetter: () => string,
  currentVersionSetter: (v: string) => void,
  getMainWindow?: () => BrowserWindow | null
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

  ipcMain.handle(IPC_CHANNELS.GET_SUMMONER_SPELLS, async (_event, version: string) => {
    currentVersionSetter(version);
    return await ddragonService.getSummonerSpells(version);
  });

  ipcMain.handle(
    IPC_CHANNELS.GET_CHAMPION_ABILITIES,
    async (_event, version: string, championId: string) => {
      currentVersionSetter(version);
      return await ddragonService.getChampionAbilities(version, championId);
    }
  );

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

  // Cache stats and maintenance
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

  // Offline pre-caching
  ipcMain.handle(IPC_CHANNELS.PRECACHE_ALL, async (event, version: string) => {
    const targetVersion = version || currentVersionGetter();
    const win = getMainWindow ? getMainWindow() : null;

    await ddragonService.precacheAllAssets(targetVersion, (payload: PrecacheProgressPayload) => {
      if (win && !win.isDestroyed()) {
        win.webContents.send(IPC_CHANNELS.PRECACHE_PROGRESS, payload);
      } else if (event?.sender && !event.sender.isDestroyed()) {
        event.sender.send(IPC_CHANNELS.PRECACHE_PROGRESS, payload);
      }
    });
  });

  // Settings handlers
  ipcMain.handle(IPC_CHANNELS.GET_SETTINGS, async () => {
    return settingsManager.getSettings();
  });

  ipcMain.handle(IPC_CHANNELS.SAVE_SETTINGS, async (_event, settings: AppSettings) => {
    await settingsManager.saveSettings(settings);
    return { success: true };
  });
}
