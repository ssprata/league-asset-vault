import { AppSettings } from './types';

export const DDRAGON_ENDPOINTS = {
  VERSIONS: 'https://ddragon.leagueoflegends.com/api/versions.json',
  CHAMPION_DATA: (version: string) =>
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`,
  CHAMPION_FULL_DATA: (version: string) =>
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/championFull.json`,
  CHAMPION_DETAIL_DATA: (version: string, id: string) =>
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion/${id}.json`,
  ITEM_DATA: (version: string) =>
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/item.json`,
  SUMMONER_DATA: (version: string) =>
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/summoner.json`,
  CHAMPION_IMAGE: (version: string, filename: string) =>
    `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${filename}`,
  ITEM_IMAGE: (version: string, filename: string) =>
    `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${filename}`,
  SPELL_IMAGE: (version: string, filename: string) =>
    `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${filename}`,
  PASSIVE_IMAGE: (version: string, filename: string) =>
    `https://ddragon.leagueoflegends.com/cdn/${version}/img/passive/${filename}`,
};

export const IPC_CHANNELS = {
  GET_VERSIONS: 'ddragon:get-versions',
  GET_CHAMPIONS: 'ddragon:get-champions',
  GET_ITEMS: 'ddragon:get-items',
  GET_SUMMONER_SPELLS: 'ddragon:get-summoner-spells',
  GET_CHAMPION_ABILITIES: 'ddragon:get-champion-abilities',
  ENSURE_ASSET_CACHED: 'cache:ensure-asset',
  START_DRAG: 'drag:start',
  CLIPBOARD_COPY: 'clipboard:copy-image',
  UPSCALE_ASSET: 'upscale:asset',
  GENERATE_UPSCALE: 'upscale:generate',
  GET_UPSCALE_INFO: 'upscale:get-info',
  BATCH_UPSCALE: 'upscale:batch',
  CANCEL_BATCH_UPSCALE: 'upscale:cancel-batch',
  UPSCALE_PROGRESS: 'upscale:progress',
  GET_CACHE_STATS: 'cache:get-stats',
  CALCULATE_SIZE: 'cache:calculate-size',
  OPEN_CACHE_DIR: 'cache:open-dir',
  CLEAR_CACHE: 'cache:clear',
  PRECACHE_ALL: 'cache:precache-all',
  PRECACHE_PROGRESS: 'cache:precache-progress',
  GET_SETTINGS: 'settings:get',
  SAVE_SETTINGS: 'settings:save',
} as const;

export const DEFAULT_SETTINGS: AppSettings = {
  gpuId: 0,
  tileSize: 0,
  defaultDenoise: 3,
  defaultScale: '4x',
  defaultMaskShape: 'square',
};

export const DENOISE_OPTIONS = [
  { level: 0, label: 'None (0)', desc: 'Sharpest lines, preserves original grain' },
  { level: 1, label: 'Medium (1)', desc: 'Light denoising, subtle smoothing' },
  { level: 2, label: 'High (2)', desc: 'Strong denoising, removes JPEG artifacts' },
  { level: 3, label: 'Highest (3) [Recommended]', desc: 'Max noise removal, clean vector-like artwork' },
] as const;

export const CHAMPION_TAGS = [
  'All',
  'Fighter',
  'Mage',
  'Assassin',
  'Tank',
  'Marksman',
  'Support',
] as const;

export const ITEM_TAGS = [
  'All',
  'Damage',
  'SpellDamage',
  'Armor',
  'SpellBlock',
  'Health',
  'Mana',
  'AttackSpeed',
  'CriticalStrike',
  'LifeSteal',
  'Boots',
  'Consumable',
] as const;
