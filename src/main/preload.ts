import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/constants';
import {
  AppElectronAPI,
  AnyAsset,
  ResolutionScale,
  DenoiseLevel,
  DragStartRequest,
  UpscaleGenerateRequest,
  UpscaleProgressPayload,
} from '../shared/types';

const api: AppElectronAPI = {
  getVersions: () => ipcRenderer.invoke(IPC_CHANNELS.GET_VERSIONS),
  getChampions: (version: string) => ipcRenderer.invoke(IPC_CHANNELS.GET_CHAMPIONS, version),
  getItems: (version: string) => ipcRenderer.invoke(IPC_CHANNELS.GET_ITEMS, version),
  ensureAssetCached: (asset: AnyAsset, scale: ResolutionScale) =>
    ipcRenderer.invoke(IPC_CHANNELS.ENSURE_ASSET_CACHED, asset, scale),

  startDrag: (request: DragStartRequest) => {
    // Send asynchronous message to trigger native DoDragDrop in main process
    ipcRenderer.send(IPC_CHANNELS.START_DRAG, request);
    return Promise.resolve({ success: true });
  },

  upscaleAsset: (asset: AnyAsset, scale: ResolutionScale, noiseLevel?: DenoiseLevel) =>
    ipcRenderer.invoke(IPC_CHANNELS.UPSCALE_ASSET, asset, scale, noiseLevel),

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

  getCacheStats: () => ipcRenderer.invoke(IPC_CHANNELS.GET_CACHE_STATS),
  getCacheSize: () => ipcRenderer.invoke(IPC_CHANNELS.CALCULATE_SIZE),
  openCacheDir: () => ipcRenderer.invoke(IPC_CHANNELS.OPEN_CACHE_DIR),
  openCacheFolder: () => ipcRenderer.invoke(IPC_CHANNELS.OPEN_CACHE_DIR),
  clearCache: () => ipcRenderer.invoke(IPC_CHANNELS.CLEAR_CACHE),
};

contextBridge.exposeInMainWorld('electronAPI', api);
