import fs from 'fs';
import path from 'path';
import { DDRAGON_ENDPOINTS } from '../../shared/constants';
import {
  ChampionAsset,
  ItemAsset,
  SummonerSpellAsset,
  AbilityAsset,
  AnyAsset,
  ResolutionScale,
  PrecacheProgressPayload,
} from '../../shared/types';
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

  /**
   * Fetches all Summoner Spells for a given version.
   */
  public async getSummonerSpells(version: string): Promise<SummonerSpellAsset[]> {
    const versionDir = cacheManager.getVersionDir(version);
    const manifestPath = path.join(versionDir, 'summoners_manifest.json');

    let rawData: any = null;

    if (fs.existsSync(manifestPath)) {
      try {
        const fileContent = await fs.promises.readFile(manifestPath, 'utf-8');
        rawData = JSON.parse(fileContent);
      } catch (e) {
        console.warn('[DDragonService] Corrupted local summoner manifest, re-fetching...');
      }
    }

    if (!rawData) {
      const res = await fetch(DDRAGON_ENDPOINTS.SUMMONER_DATA(version));
      if (!res.ok) {
        throw new Error(`Failed to fetch summoner spells: ${res.statusText}`);
      }
      rawData = await res.json();
      await fs.promises.writeFile(manifestPath, JSON.stringify(rawData, null, 2));
    }

    const spellsMap = rawData.data as Record<string, any>;
    const assets: SummonerSpellAsset[] = [];

    for (const [id, spell] of Object.entries(spellsMap)) {
      const imageFileName = spell.image?.full || `${id}.png`;
      const originalCached = cacheManager.assetExists(version, 'summoner', imageFileName, '1x');
      const upscaled4xCached = cacheManager.assetExists(version, 'summoner', imageFileName, '4x');

      assets.push({
        type: 'summoner',
        id: spell.id,
        key: spell.key,
        name: spell.name,
        description: spell.description || '',
        cooldown: spell.cooldownBurn ? parseFloat(spell.cooldownBurn) : (spell.cooldown?.[0] || 0),
        tags: spell.modes || [],
        imageFileName,
        cdnUrl: DDRAGON_ENDPOINTS.SPELL_IMAGE(version, imageFileName),
        cachedOriginalPath: originalCached
          ? cacheManager.getAssetPath(version, 'summoner', imageFileName, '1x')
          : undefined,
        cachedUpscaledPath: upscaled4xCached
          ? cacheManager.getAssetPath(version, 'summoner', imageFileName, '4x')
          : undefined,
        upscaleStatus: upscaled4xCached ? 'ready' : 'none',
      });
    }

    return assets.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Fetches the abilities (Passive, Q, W, E, R) for a specific champion.
   */
  public async getChampionAbilities(version: string, championId: string): Promise<AbilityAsset[]> {
    const versionDir = cacheManager.getVersionDir(version);
    const manifestPath = path.join(versionDir, `champion_${championId}.json`);

    let rawData: any = null;

    if (fs.existsSync(manifestPath)) {
      try {
        const fileContent = await fs.promises.readFile(manifestPath, 'utf-8');
        rawData = JSON.parse(fileContent);
      } catch (e) {
        console.warn(`[DDragonService] Corrupted local champion detail for ${championId}, re-fetching...`);
      }
    }

    if (!rawData) {
      // Try single champion detail endpoint first
      try {
        const res = await fetch(DDRAGON_ENDPOINTS.CHAMPION_DETAIL_DATA(version, championId));
        if (res.ok) {
          rawData = await res.json();
          await fs.promises.writeFile(manifestPath, JSON.stringify(rawData, null, 2));
        }
      } catch (err) {
        console.warn(`[DDragonService] Failed single champ fetch for ${championId}, falling back to full data:`, err);
      }

      // If single champ detail wasn't fetched, try full data
      if (!rawData) {
        const fullManifestPath = path.join(versionDir, 'championFull.json');
        let fullData: any = null;
        if (fs.existsSync(fullManifestPath)) {
          try {
            fullData = JSON.parse(await fs.promises.readFile(fullManifestPath, 'utf-8'));
          } catch (e) {}
        }
        if (!fullData) {
          const res = await fetch(DDRAGON_ENDPOINTS.CHAMPION_FULL_DATA(version));
          if (res.ok) {
            fullData = await res.json();
            await fs.promises.writeFile(fullManifestPath, JSON.stringify(fullData, null, 2));
          }
        }
        if (fullData && fullData.data && fullData.data[championId]) {
          rawData = { data: { [championId]: fullData.data[championId] } };
        }
      }
    }

    if (!rawData || !rawData.data || !rawData.data[championId]) {
      throw new Error(`Could not load ability data for champion ${championId}`);
    }

    const champData = rawData.data[championId];
    const abilities: AbilityAsset[] = [];

    // 1. Passive
    if (champData.passive) {
      const pImage = champData.passive.image?.full || `${championId}_P.png`;
      const originalCached = cacheManager.assetExists(version, 'ability', pImage, '1x');
      const upscaled4xCached = cacheManager.assetExists(version, 'ability', pImage, '4x');

      abilities.push({
        type: 'ability',
        id: `${championId}Passive`,
        championId,
        slot: 'Passive',
        name: champData.passive.name,
        description: champData.passive.description || '',
        imageFileName: pImage,
        cdnUrl: DDRAGON_ENDPOINTS.PASSIVE_IMAGE(version, pImage),
        cachedOriginalPath: originalCached
          ? cacheManager.getAssetPath(version, 'ability', pImage, '1x')
          : undefined,
        cachedUpscaledPath: upscaled4xCached
          ? cacheManager.getAssetPath(version, 'ability', pImage, '4x')
          : undefined,
        upscaleStatus: upscaled4xCached ? 'ready' : 'none',
      });
    }

    // 2. Q, W, E, R Spells
    const slots: ('Q' | 'W' | 'E' | 'R')[] = ['Q', 'W', 'E', 'R'];
    if (Array.isArray(champData.spells)) {
      champData.spells.forEach((spell: any, idx: number) => {
        const slot = slots[idx] || 'Q';
        const imageFileName = spell.image?.full || `${spell.id}.png`;
        const originalCached = cacheManager.assetExists(version, 'ability', imageFileName, '1x');
        const upscaled4xCached = cacheManager.assetExists(version, 'ability', imageFileName, '4x');

        abilities.push({
          type: 'ability',
          id: spell.id,
          championId,
          slot,
          name: spell.name,
          description: spell.description || '',
          imageFileName,
          cdnUrl: DDRAGON_ENDPOINTS.SPELL_IMAGE(version, imageFileName),
          cachedOriginalPath: originalCached
            ? cacheManager.getAssetPath(version, 'ability', imageFileName, '1x')
            : undefined,
          cachedUpscaledPath: upscaled4xCached
            ? cacheManager.getAssetPath(version, 'ability', imageFileName, '4x')
            : undefined,
          upscaleStatus: upscaled4xCached ? 'ready' : 'none',
        });
      });
    }

    return abilities;
  }

  /**
   * Pre-caches all original assets (champions, items, summoners, abilities) for offline usage.
   */
  public async precacheAllAssets(
    version: string,
    onProgress: (payload: PrecacheProgressPayload) => void
  ): Promise<void> {
    console.log(`[DDragonService] Starting full offline pre-cache for version ${version}`);

    const champions = await this.getChampions(version);
    const items = await this.getItems(version);
    const summoners = await this.getSummonerSpells(version);

    const assetQueue: AnyAsset[] = [...champions, ...items, ...summoners];

    for (const champ of champions) {
      try {
        const abilities = await this.getChampionAbilities(version, champ.id);
        assetQueue.push(...abilities);
      } catch (err) {
        console.warn(`[DDragonService] Precache abilities error for ${champ.id}:`, err);
      }
    }

    const total = assetQueue.length;
    let completed = 0;
    const concurrency = 6;

    onProgress({ completed: 0, total, currentName: 'Preparing download...', isDone: false });

    const queue = [...assetQueue];
    const workers = Array(concurrency).fill(null).map(async () => {
      while (queue.length > 0) {
        const asset = queue.shift();
        if (!asset) break;

        try {
          await this.ensureOriginalCached(version, asset);
        } catch (e) {
          console.warn(`[DDragonService] Precache error for ${asset.name}:`, e);
        }

        completed++;
        if (completed % 5 === 0 || completed === total) {
          onProgress({
            completed,
            total,
            currentName: asset.name,
            isDone: completed === total,
          });
        }
      }
    });

    await Promise.all(workers);

    onProgress({
      completed: total,
      total,
      currentName: 'Pre-caching complete',
      isDone: true,
    });
  }
}

export const ddragonService = new DDragonService();
