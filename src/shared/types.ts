export type AssetType = 'champion' | 'item';

export type ResolutionScale = '1x' | '2x' | '4x';

export type UpscaleStatus = 'none' | 'queued' | 'processing' | 'ready' | 'error';

export interface ChampionAsset {
  type: 'champion';
  id: string;          // e.g. "Aatrox"
  key: string;         // e.g. "266"
  name: string;        // e.g. "Aatrox"
  title: string;       // e.g. "the Darkin Blade"
  tags: string[];      // e.g. ["Fighter", "Tank"]
  imageFileName: string;
  cdnUrl: string;
  cachedOriginalPath?: string;
  cachedUpscaledPath?: string;
  upscaleStatus?: UpscaleStatus;
}

export interface ItemAsset {
  type: 'item';
  id: string;          // e.g. "1001"
  name: string;        // e.g. "Boots"
  plaintext: string;
  description: string;
  goldTotal: number;
  purchasable: boolean;
  tags: string[];      // e.g. ["Boots", "Speed"]
  imageFileName: string;
  cdnUrl: string;
  cachedOriginalPath?: string;
  cachedUpscaledPath?: string;
  upscaleStatus?: UpscaleStatus;
}

export type AnyAsset = ChampionAsset | ItemAsset;

export interface CacheStats {
  cacheDir: string;
  totalFiles: number;
  totalSizeBytes: number;
  formattedSize: string;
  upscaledCount: number;
  originalCount: number;
}

export interface UpscaleProgressPayload {
  currentId: string;
  currentName: string;
  completed: number;
  total: number;
  scale: ResolutionScale;
  status: 'idle' | 'processing' | 'done' | 'error';
}

export type DenoiseLevel = 0 | 1 | 2 | 3;

export interface DragStartRequest {
  assetId: string;
  assetType: AssetType;
  scale: ResolutionScale;
  noiseLevel?: DenoiseLevel;
}

export interface DragStartResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

export interface UpscaleGenerateRequest {
  assetId: string;
  assetType: AssetType;
  scale: ResolutionScale;
  noiseLevel: DenoiseLevel;
}

export interface UpscaleGenerateResult {
  success: boolean;
  filePath: string;
  fromCache: boolean;
  dataUrl: string | null;
  error?: string;
}

export interface AppElectronAPI {
  getVersions: () => Promise<string[]>;
  getChampions: (version: string) => Promise<ChampionAsset[]>;
  getItems: (version: string) => Promise<ItemAsset[]>;
  ensureAssetCached: (asset: AnyAsset, scale: ResolutionScale) => Promise<string>;
  startDrag: (request: DragStartRequest) => Promise<DragStartResult>;
  upscaleAsset: (asset: AnyAsset, scale: ResolutionScale, noiseLevel?: DenoiseLevel) => Promise<string>;
  generateUpscale: (request: UpscaleGenerateRequest) => Promise<UpscaleGenerateResult>;
  getUpscaleInfo: (request: UpscaleGenerateRequest) => Promise<UpscaleGenerateResult>;
  batchUpscale: (assets: AnyAsset[], scale: ResolutionScale) => Promise<void>;
  cancelBatchUpscale: () => Promise<void>;
  onUpscaleProgress: (callback: (progress: UpscaleProgressPayload) => void) => () => void;
  getCacheStats: () => Promise<CacheStats>;
  getCacheSize: () => Promise<CacheStats>;
  openCacheDir: () => Promise<void>;
  openCacheFolder: () => Promise<void>;
  clearCache: () => Promise<{ success: boolean; stats: CacheStats }>;
}

declare global {
  interface Window {
    electronAPI: AppElectronAPI;
  }
}
