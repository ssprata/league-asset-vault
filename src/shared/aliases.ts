import { AnyAsset } from './types';

/**
 * Mapping of community acronyms, nicknames, and slang to canonical asset names / keywords.
 * All keys and values are in lowercase for case-insensitive matching.
 */
export const ASSET_ALIASES: Record<string, string[]> = {
  // Items
  'bork': ['blade of the ruined king'],
  'botrk': ['blade of the ruined king'],
  'ie': ['infinity edge'],
  'ldr': ["lord dominik's regards", 'lord dominik'],
  'tabis': ['plated steelcaps', 'ninja tabi'],
  'tabi': ['plated steelcaps', 'ninja tabi'],
  'mercs': ["mercury's treads"],
  'merc': ["mercury's treads"],
  'dcap': ["rabadon's deathcap"],
  'deathcap': ["rabadon's deathcap"],
  'rabadon': ["rabadon's deathcap"],
  'triforce': ['trinity force'],
  'trinity': ['trinity force'],
  'rfc': ['rapid firecannon'],
  'ga': ['guardian angel'],
  'zhonya': ["zhonya's hourglass"],
  'zhonyas': ["zhonya's hourglass"],
  'hourglass': ["zhonya's hourglass"],
  'nashors': ["nashor's tooth"],
  'nashor': ["nashor's tooth"],
  'mejai': ["mejai's soulstealer"],
  'mejais': ["mejai's soulstealer"],
  'bt': ['bloodthirster'],
  'kraken': ['kraken slayer'],
  'qss': ['quicksilver sash'],
  'er': ['essence reaver'],
  'pd': ['phantom dancer'],
  'warmogs': ["warmog's armor"],
  'warmog': ["warmog's armor"],
  'roa': ['rod of ages'],
  'steraks': ["sterak's gage"],
  'sterak': ["sterak's gage"],
  'sunfire': ['sunfire aegis'],
  'fon': ['force of nature'],
  'dd': ["death's dance"],
  'maw': ['maw of malmortius', 'hexdrinker'],
  'hexdrinker': ['hexdrinker', 'maw of malmortius'],
  'seraphs': ["seraph's embrace"],
  'seraph': ["seraph's embrace"],
  'manamune': ['manamune'],
  'muramana': ['muramana'],
  'rageblade': ["guinsoo's rageblade"],
  'guinsoo': ["guinsoo's rageblade"],
  'guinsoos': ["guinsoo's rageblade"],
  'morello': ['morellonomicon'],
  'void': ['void staff'],
  'stormsurge': ['stormsurge'],
  'hubris': ['hubris'],
  'malignance': ['malignance'],
  'sundered': ['sundered sky'],
  'profane': ['profane hydra'],
  'titanic': ['titanic hydra'],
  'ravenous': ['ravenous hydra'],
  'hydra': ['hydra'],
  'liandry': ["liandry's torment"],
  'liandrys': ["liandry's torment"],
  'collector': ['the collector'],

  // Champions
  'mf': ['miss fortune'],
  'tf': ['twisted fate'],
  'asol': ['aurelion sol'],
  'aurelion': ['aurelion sol'],
  'ww': ['warwick'],
  'j4': ['jarvan iv'],
  'gp': ['gangplank'],
  'tk': ['tahm kench'],
  'kench': ['tahm kench'],
  'noc': ['nocturne'],
  'yi': ['master yi'],
  'heimer': ['heimerdinger'],
  'vlad': ['vladimir'],
  'cass': ['cassiopeia'],
  'cassio': ['cassiopeia'],
  'kat': ['katarina'],
  'kata': ['katarina'],
  'tris': ['tristana'],
  'trist': ['tristana'],
  'morg': ['morgana'],
  'malz': ['malzahar'],
  'kass': ['kassadin'],
  'blitz': ['blitzcrank'],
  'renata': ['renata glasc'],
  'kog': ["kog'maw"],
  'cho': ["cho'gath"],
  'vel': ["vel'koz"],
  'kha': ["kha'zix"],
  'rek': ["rek'sai"],
  'cait': ['caitlyn'],
  'sej': ['sejuani'],
  'xin': ['xin zhao'],

  // Runes
  'conq': ['conqueror'],
  'lt': ['lethal tempo'],
  'pta': ['press the attack'],
  'fleet': ['fleet footwork'],
  'elec': ['electrocute'],
  'dh': ['dark harvest'],
  'hob': ['hail of blades'],
  'pr': ['phase rush'],
  'comet': ['arcane comet'],
  'aery': ['summon aery'],
  'grasp': ['grasp of the undying'],
  'aftershock': ['aftershock'],
  'glacial': ['glacial augment'],
  'fs': ['first strike'],
  'first strike': ['first strike'],
};

/**
 * Checks if a given asset matches the search query directly or through community aliases.
 */
export function matchAssetWithAliases(asset: AnyAsset, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const assetName = asset.name.toLowerCase();

  // 1. Direct name match
  if (assetName.includes(q)) return true;

  // 2. Direct title / description / metadata match depending on type
  if (asset.type === 'champion') {
    if (asset.title?.toLowerCase().includes(q)) return true;
  } else if (asset.type === 'item') {
    if (
      (asset.plaintext && asset.plaintext.toLowerCase().includes(q)) ||
      (asset.description && asset.description.toLowerCase().includes(q))
    ) {
      return true;
    }
  } else if (asset.type === 'summoner') {
    if (asset.description?.toLowerCase().includes(q)) return true;
  } else if (asset.type === 'rune') {
    if (
      (asset.shortDesc && asset.shortDesc.toLowerCase().includes(q)) ||
      (asset.longDesc && asset.longDesc.toLowerCase().includes(q)) ||
      (asset.treeName && asset.treeName.toLowerCase().includes(q))
    ) {
      return true;
    }
  } else if (asset.type === 'render') {
    if (
      (asset.championId && asset.championId.toLowerCase().includes(q)) ||
      (asset.skinName && asset.skinName.toLowerCase().includes(q))
    ) {
      return true;
    }
  } else if (asset.type === 'audio') {
    if (
      (asset.championName && asset.championName.toLowerCase().includes(q)) ||
      (asset.championId && asset.championId.toLowerCase().includes(q)) ||
      (asset.category && asset.category.toLowerCase().includes(q))
    ) {
      return true;
    }
  }

  // 3. Alias dictionary check
  const canonicalTargets = ASSET_ALIASES[q];
  if (canonicalTargets) {
    for (const target of canonicalTargets) {
      if (assetName.includes(target)) {
        return true;
      }
      if (asset.type === 'render' && asset.championId.toLowerCase().includes(target)) {
        return true;
      }
      if (asset.type === 'audio' && asset.championName && asset.championName.toLowerCase().includes(target)) {
        return true;
      }
    }
  }

  // Also check if any key in ASSET_ALIASES starts with q (partial alias match, e.g. "bor" -> bork)
  for (const [aliasKey, targets] of Object.entries(ASSET_ALIASES)) {
    if (aliasKey.startsWith(q)) {
      for (const target of targets) {
        if (assetName.includes(target)) {
          return true;
        }
        if (asset.type === 'render' && asset.championId.toLowerCase().includes(target)) {
          return true;
        }
        if (asset.type === 'audio' && asset.championName && asset.championName.toLowerCase().includes(target)) {
          return true;
        }
      }
    }
  }

  return false;
}
