export const DDRAGON_ENDPOINTS = {
  VERSIONS: 'https://ddragon.leagueoflegends.com/api/versions.json',
  CHAMPION_DATA: (version: string) => `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`,
  ITEM_DATA: (version: string) => `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/item.json`,
  CHAMPION_IMAGE: (version: string, filename: string) => `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${filename}`,
  ITEM_IMAGE: (version: string, filename: string) => `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${filename}`,
};

export const IPC_CHANNELS = {
  GET_VERSIONS: 'ddragon:get-versions',
  GET_CHAMPIONS: 'ddragon:get-champions',
  GET_ITEMS: 'ddragon:get-items',
  ENSURE_ASSET_CACHED: 'cache:ensure-asset',
  START_DRAG: 'drag:start',
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
} as const;

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
