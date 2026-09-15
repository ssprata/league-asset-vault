import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/constants';
import {
  AppElectronAPI,
  AnyAsset,
  ResolutionScale,
  DenoiseLevel,
  MaskShape,
  DragStartRequest,
  UpscaleGenerateRequest,
  UpscaleProgressPayload,
  PrecacheProgressPayload,
  AppSettings,
} from '../shared/types';

const api: AppElectronAPI = {
  // Data Dragon APIs
  getVersions: () => ipcRenderer.invoke(IPC_CHANNELS.GET_VERSIONS),
  getChampions: (version: string) => ipcRenderer.invoke(IPC_CHANNELS.GET_CHAMPIONS, version),
  getItems: (version: string) => ipcRenderer.invoke(IPC_CHANNELS.GET_ITEMS, version),
  getSummonerSpells: (version: string) => ipcRenderer.invoke(IPC_CHANNELS.GET_SUMMONER_SPELLS, version),
  getChampionAbilities: (version: string, championId: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_CHAMPION_ABILITIES, version, championId),
  ensureAssetCached: (asset: AnyAsset, scale: ResolutionScale) =>
    ipcRenderer.invoke(IPC_CHANNELS.ENSURE_ASSET_CACHED, asset, scale),

  // OS Native Drag & Clipboard APIs
  startDrag: (request: DragStartRequest) => {
    ipcRenderer.send(IPC_CHANNELS.START_DRAG, request);
    return Promise.resolve({ success: true });
  },
  copyImageToClipboard: (filePath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.CLIPBOARD_COPY, filePath),

  // Upscaling APIs
  upscaleAsset: (
    asset: AnyAsset,
    scale: ResolutionScale,
    noiseLevel?: DenoiseLevel,
    maskShape?: MaskShape
  ) => ipcRenderer.invoke(IPC_CHANNELS.UPSCALE_ASSET, asset, scale, noiseLevel, maskShape),

  generateUpscale: (request: UpscaleGenerateRequest) =>
    ipcRenderer.invoke(IPC_CHANNELS.GENERATE_UPSCALE, request),

  getUpscaleInfo: (request: UpscaleGenerateRequest) =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_UPSCALE_INFO, request),

  batchUpscale: (assets: AnyAsset[], scale: ResolutionScale) =>
    ipcRenderer.invoke(IPC_CHANNELS.BATCH_UPSCALE, assets, scale),

  cancelBatchUpscale: () => ipcRenderer.invoke(IPC_CHANNELS.CANCEL_BATCH_UPSCALE),

  onUpscaleProgress: (callback: (progress: UpscaleProgressPayload) => void) => {
    const handler = (_event: any, payload: UpscaleProgressPayload) => callback(payload);
    ipcRenderer.on(IPC_CHANNELS.UPSCALE_PROGRESS, handler);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.UPSCALE_PROGRESS, handler);
    };
  },

  // Cache Management APIs
  getCacheStats: () => ipcRenderer.invoke(IPC_CHANNELS.GET_CACHE_STATS),
  getCacheSize: () => ipcRenderer.invoke(IPC_CHANNELS.CALCULATE_SIZE),
  openCacheDir: () => ipcRenderer.invoke(IPC_CHANNELS.OPEN_CACHE_DIR),
  openCacheFolder: () => ipcRenderer.invoke(IPC_CHANNELS.OPEN_CACHE_DIR),
  clearCache: () => ipcRenderer.invoke(IPC_CHANNELS.CLEAR_CACHE),

  // Offline Pre-cache
  precacheAllAssets: (version: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.PRECACHE_ALL, version),

  onPrecacheProgress: (callback: (progress: PrecacheProgressPayload) => void) => {
    const handler = (_event: any, payload: PrecacheProgressPayload) => callback(payload);
    ipcRenderer.on(IPC_CHANNELS.PRECACHE_PROGRESS, handler);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.PRECACHE_PROGRESS, handler);
    };
  },

  // Settings APIs
  getSettings: () => ipcRenderer.invoke(IPC_CHANNELS.GET_SETTINGS),
  saveSettings: (settings: AppSettings) =>
    ipcRenderer.invoke(IPC_CHANNELS.SAVE_SETTINGS, settings),
};

contextBridge.exposeInMainWorld('electronAPI', api);
