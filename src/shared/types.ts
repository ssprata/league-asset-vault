export type AssetType = 'champion' | 'item' | 'summoner' | 'ability';

export type ResolutionScale = '1x' | '2x' | '4x';

export type DenoiseLevel = 0 | 1 | 2 | 3;

export type MaskShape = 'square' | 'circle';

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

export interface SummonerSpellAsset {
  type: 'summoner';
  id: string;          // e.g. "SummonerFlash"
  key: string;         // e.g. "4"
  name: string;        // e.g. "Flash"
  description: string;
  cooldown: number;
  tags: string[];
  imageFileName: string;
  cdnUrl: string;
  cachedOriginalPath?: string;
  cachedUpscaledPath?: string;
  upscaleStatus?: UpscaleStatus;
}

export interface AbilityAsset {
  type: 'ability';
  id: string;          // e.g. "AatroxQ" or "AatroxPassive"
  championId: string;  // e.g. "Aatrox"
  slot: 'Passive' | 'Q' | 'W' | 'E' | 'R';
  name: string;
  description: string;
  imageFileName: string;
  cdnUrl: string;
  cachedOriginalPath?: string;
  cachedUpscaledPath?: string;
  upscaleStatus?: UpscaleStatus;
}

export type AnyAsset = ChampionAsset | ItemAsset | SummonerSpellAsset | AbilityAsset;

export interface AppSettings {
  gpuId: number;              // -1 = CPU, 0 = Auto/Default GPU, 1 = Secondary GPU
  tileSize: number;           // 0 = Auto, 100, 200, 400
  defaultDenoise: DenoiseLevel;
  defaultScale: ResolutionScale;
  defaultMaskShape: MaskShape;
}

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

export interface PrecacheProgressPayload {
  completed: number;
  total: number;
  currentName: string;
  isDone: boolean;
}

export interface DragStartRequest {
  assetId: string;
  assetType: AssetType;
  scale: ResolutionScale;
  noiseLevel?: DenoiseLevel;
  maskShape?: MaskShape;
  imageFileName?: string;
  cdnUrl?: string;
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
  maskShape?: MaskShape;
  imageFileName?: string;
  cdnUrl?: string;
}

export interface UpscaleGenerateResult {
  success: boolean;
  filePath: string;
  fromCache: boolean;
  dataUrl: string | null;
  error?: string;
}

export interface AppElectronAPI {
  // Data Dragon APIs
  getVersions: () => Promise<string[]>;
  getChampions: (version: string) => Promise<ChampionAsset[]>;
  getItems: (version: string) => Promise<ItemAsset[]>;
  getSummonerSpells: (version: string) => Promise<SummonerSpellAsset[]>;
  getChampionAbilities: (version: string, championId: string) => Promise<AbilityAsset[]>;
  ensureAssetCached: (asset: AnyAsset, scale: ResolutionScale) => Promise<string>;

  // OS Native Drag & Clipboard APIs
  startDrag: (request: DragStartRequest) => Promise<DragStartResult>;
  copyImageToClipboard: (filePath: string) => Promise<{ success: boolean; error?: string }>;

  // Upscaling APIs
  upscaleAsset: (
    asset: AnyAsset,
    scale: ResolutionScale,
    noiseLevel?: DenoiseLevel,
    maskShape?: MaskShape
  ) => Promise<string>;
  generateUpscale: (request: UpscaleGenerateRequest) => Promise<UpscaleGenerateResult>;
  getUpscaleInfo: (request: UpscaleGenerateRequest) => Promise<UpscaleGenerateResult>;
  batchUpscale: (assets: AnyAsset[], scale: ResolutionScale) => Promise<void>;
  cancelBatchUpscale: () => Promise<void>;
  onUpscaleProgress: (callback: (progress: UpscaleProgressPayload) => void) => () => void;

  // Cache Management APIs
  getCacheStats: () => Promise<CacheStats>;
  getCacheSize: () => Promise<CacheStats>;
  openCacheDir: () => Promise<void>;
  openCacheFolder: () => Promise<void>;
  clearCache: () => Promise<{ success: boolean; stats: CacheStats }>;

  // Offline Pre-cache
  precacheAllAssets: (version: string) => Promise<void>;
  onPrecacheProgress: (callback: (progress: PrecacheProgressPayload) => void) => () => void;

  // Settings APIs
  getSettings: () => Promise<AppSettings>;
  saveSettings: (settings: AppSettings) => Promise<void>;
}

declare global {
  interface Window {
    electronAPI: AppElectronAPI;
  }
}
