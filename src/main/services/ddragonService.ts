import fs from 'fs';
import path from 'path';
import { DDRAGON_ENDPOINTS } from '../../shared/constants';
import { ChampionAsset, ItemAsset, AnyAsset, ResolutionScale } from '../../shared/types';
import { cacheManager } from './cacheManager';

export class DDragonService {
  private cachedVersions: string[] | null = null;

  /**
   * Fetches the latest game versions from Riot Data Dragon.
   * Caches in-memory and on-disk for offline readiness.
   */
  public async getVersions(): Promise<string[]> {
    if (this.cachedVersions && this.cachedVersions.length > 0) {
      return this.cachedVersions;
    }

    const versionsCacheFile = path.join(cacheManager.getBaseCacheDir(), 'versions.json');

    try {
      const response = await fetch(DDRAGON_ENDPOINTS.VERSIONS);
      if (!response.ok) {
        throw new Error(`Failed to fetch versions: ${response.statusText}`);
      }
      const versions = (await response.json()) as string[];
      this.cachedVersions = versions;
      // Persist offline copy
      await fs.promises.writeFile(versionsCacheFile, JSON.stringify(versions, null, 2));
      return versions;
    } catch (err) {
      console.warn('[DDragonService] Network fetch failed for versions, checking disk cache...', err);
      if (fs.existsSync(versionsCacheFile)) {
        const raw = await fs.promises.readFile(versionsCacheFile, 'utf-8');
        this.cachedVersions = JSON.parse(raw);
        return this.cachedVersions!;
      }
      // Ultimate fallback to recent known stable version if network & disk unavailable
      return ['14.24.1', '14.23.1'];
    }
  }

  /**
   * Fetches all Champions for a given game version, returning structured ChampionAsset objects.
   */
  public async getChampions(version: string): Promise<ChampionAsset[]> {
    const versionDir = cacheManager.getVersionDir(version);
    const manifestPath = path.join(versionDir, 'champions_manifest.json');

    let rawData: any = null;

    if (fs.existsSync(manifestPath)) {
      try {
        const fileContent = await fs.promises.readFile(manifestPath, 'utf-8');
        rawData = JSON.parse(fileContent);
      } catch (e) {
        console.warn('[DDragonService] Corrupted local champion manifest, re-fetching...');
      }
    }

    if (!rawData) {
      const res = await fetch(DDRAGON_ENDPOINTS.CHAMPION_DATA(version));
      if (!res.ok) {
        throw new Error(`Failed to fetch champion data: ${res.statusText}`);
      }
      rawData = await res.json();
      await fs.promises.writeFile(manifestPath, JSON.stringify(rawData, null, 2));
    }

    const championsMap = rawData.data as Record<string, any>;
    const assets: ChampionAsset[] = [];

    for (const [id, champ] of Object.entries(championsMap)) {
      const imageFileName = champ.image?.full || `${id}.png`;
      const originalCached = cacheManager.assetExists(version, 'champion', imageFileName, '1x');
      const upscaled4xCached = cacheManager.assetExists(version, 'champion', imageFileName, '4x');

      assets.push({
        type: 'champion',
        id: champ.id,
        key: champ.key,
        name: champ.name,
        title: champ.title,
        tags: champ.tags || [],
        imageFileName,
        cdnUrl: DDRAGON_ENDPOINTS.CHAMPION_IMAGE(version, imageFileName),
        cachedOriginalPath: originalCached
          ? cacheManager.getAssetPath(version, 'champion', imageFileName, '1x')
          : undefined,
        cachedUpscaledPath: upscaled4xCached
          ? cacheManager.getAssetPath(version, 'champion', imageFileName, '4x')
          : undefined,
        upscaleStatus: upscaled4xCached ? 'ready' : 'none',
      });
    }

    // Sort alphabetically by name
    return assets.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Fetches all Items for a given game version, returning structured ItemAsset objects.
   */
  public async getItems(version: string): Promise<ItemAsset[]> {
    const versionDir = cacheManager.getVersionDir(version);
    const manifestPath = path.join(versionDir, 'items_manifest.json');

    let rawData: any = null;

    if (fs.existsSync(manifestPath)) {
      try {
        const fileContent = await fs.promises.readFile(manifestPath, 'utf-8');
        rawData = JSON.parse(fileContent);
      } catch (e) {
        console.warn('[DDragonService] Corrupted local item manifest, re-fetching...');
      }
    }

    if (!rawData) {
      const res = await fetch(DDRAGON_ENDPOINTS.ITEM_DATA(version));
      if (!res.ok) {
        throw new Error(`Failed to fetch item data: ${res.statusText}`);
      }
      rawData = await res.json();
      await fs.promises.writeFile(manifestPath, JSON.stringify(rawData, null, 2));
    }

    const itemsMap = rawData.data as Record<string, any>;
    const assets: ItemAsset[] = [];

    for (const [id, item] of Object.entries(itemsMap)) {
      // Filter out special test/deprecated items without names
      if (!item.name || item.name.trim() === '') continue;

      const imageFileName = item.image?.full || `${id}.png`;
      const originalCached = cacheManager.assetExists(version, 'item', imageFileName, '1x');
      const upscaled4xCached = cacheManager.assetExists(version, 'item', imageFileName, '4x');

      assets.push({
        type: 'item',
        id,
        name: item.name,
        plaintext: item.plaintext || '',
        description: item.description || '',
        goldTotal: item.gold?.total || 0,
        purchasable: item.gold?.purchasable ?? true,
        tags: item.tags || [],
        imageFileName,
        cdnUrl: DDRAGON_ENDPOINTS.ITEM_IMAGE(version, imageFileName),
        cachedOriginalPath: originalCached
          ? cacheManager.getAssetPath(version, 'item', imageFileName, '1x')
          : undefined,
        cachedUpscaledPath: upscaled4xCached
          ? cacheManager.getAssetPath(version, 'item', imageFileName, '4x')
          : undefined,
        upscaleStatus: upscaled4xCached ? 'ready' : 'none',
      });
    }

    // Sort items by gold cost descending, then name
    return assets.sort((a, b) => {
      if (b.goldTotal !== a.goldTotal) {
        return b.goldTotal - a.goldTotal;
      }
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Ensures the original asset file is downloaded and cached locally on disk.
   */
  public async ensureOriginalCached(version: string, asset: AnyAsset): Promise<string> {
    const existingPath = cacheManager.getAssetPath(version, asset.type, asset.imageFileName, '1x');
    if (fs.existsSync(existingPath) && fs.statSync(existingPath).size > 0) {
      return existingPath;
    }

    // Download from CDN
    const response = await fetch(asset.cdnUrl);
    if (!response.ok) {
      throw new Error(`Failed to download asset from ${asset.cdnUrl}: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return await cacheManager.saveAsset(version, asset.type, asset.imageFileName, buffer, '1x');
  }
}

export const ddragonService = new DDragonService();
