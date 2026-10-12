import fs from 'fs';
import path from 'path';
import { ipcMain, BrowserWindow, dialog } from 'electron';
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

  ipcMain.handle(IPC_CHANNELS.GET_RUNES, async (_event, version: string) => {
    currentVersionSetter(version);
    return await ddragonService.getRunes(version);
  });

  ipcMain.handle(
    IPC_CHANNELS.GET_CHAMPION_ABILITIES,
    async (_event, version: string, championId: string) => {
      currentVersionSetter(version);
      return await ddragonService.getChampionAbilities(version, championId);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.GET_CHAMPION_SKINS,
    async (_event, version: string, championId: string) => {
      currentVersionSetter(version);
      return await ddragonService.getChampionSkins(version, championId);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.GET_CHAMPION_RENDERS,
    async (_event, version: string, championId: string) => {
      currentVersionSetter(version);
      return await ddragonService.getChampionRenders(version, championId);
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

  // Upscaled Assets Library
  ipcMain.handle(IPC_CHANNELS.GET_UPSCALED_ASSETS, async (_event, version?: string) => {
    const targetVersion = version || currentVersionGetter();
    return await cacheManager.getUpscaledAssets(targetVersion);
  });

  // Selective Cache File Deletion
  ipcMain.handle(IPC_CHANNELS.DELETE_CACHED_FILES, async (_event, filePaths: string[]) => {
    return await cacheManager.deleteCachedFiles(filePaths);
  });

  // Save Single Asset Dialog
  ipcMain.handle(
    IPC_CHANNELS.SAVE_ASSET_DIALOG,
    async (_event, filePath: string, defaultName?: string) => {
      const win = getMainWindow ? getMainWindow() : null;
      const ext = path.extname(filePath) || '.png';
      const baseName = defaultName || path.basename(filePath);

      const result = await dialog.showSaveDialog(win || (undefined as any), {
        defaultPath: baseName,
        filters: [
          { name: 'Images', extensions: [ext.replace('.', '')] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });

      if (result.canceled || !result.filePath) {
        return { success: false, canceled: true };
      }

      await fs.promises.copyFile(filePath, result.filePath);
      return { success: true, savedPath: result.filePath };
    }
  );

  // Batch Export to Folder Dialog
  ipcMain.handle(IPC_CHANNELS.BATCH_EXPORT_DIALOG, async (_event, filePaths: string[]) => {
    const win = getMainWindow ? getMainWindow() : null;
    const result = await dialog.showOpenDialog(win || (undefined as any), {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select Destination Folder for Export',
    });

    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    const targetDir = result.filePaths[0];
    let count = 0;
    for (const src of filePaths) {
      if (fs.existsSync(src)) {
        const dest = path.join(targetDir, path.basename(src));
        await fs.promises.copyFile(src, dest);
        count++;
      }
    }

    return { success: true, exportDir: targetDir, count };
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
