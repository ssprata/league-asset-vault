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

export type ChampionLane = 'Top' | 'Jungle' | 'Mid' | 'ADC' | 'Support';

/**
 * Curated lane positions for League champions.
 * Flex picks are listed across multiple relevant lanes (e.g. Sion in Top, Lux in Mid & Support).
 */
export const CHAMPION_LANES: Record<string, ChampionLane[]> = {
  // Top Lane
  Aatrox: ['Top'],
  Camille: ['Top', 'Support'],
  ChoGath: ['Top', 'Mid'],
  Darius: ['Top'],
  DrMundo: ['Top', 'Jungle'],
  Fiora: ['Top'],
  Gangplank: ['Top', 'Mid'],
  Garen: ['Top', 'Mid'],
  Gnar: ['Top'],
  Gwen: ['Top', 'Jungle'],
  Illaoi: ['Top'],
  Irelia: ['Top', 'Mid'],
  Jax: ['Top', 'Jungle'],
  Jayce: ['Top', 'Mid'],
  KSante: ['Top'],
  Kayle: ['Top', 'Mid'],
  Kennen: ['Top'],
  Kled: ['Top', 'Mid'],
  Malphite: ['Top', 'Mid', 'Support'],
  Mordekaiser: ['Top', 'Jungle'],
  Nasus: ['Top'],
  Olaf: ['Top', 'Jungle'],
  Ornn: ['Top'],
  Pantheon: ['Top', 'Mid', 'Support'],
  Poppy: ['Top', 'Jungle', 'Support'],
  Quinn: ['Top'],
  Renekton: ['Top', 'Mid'],
  Riven: ['Top', 'Mid'],
  Rumble: ['Top', 'Mid', 'Jungle'],
  Sett: ['Top', 'Mid', 'Support'],
  Shen: ['Top', 'Support'],
  Singed: ['Top'],
  Sion: ['Top', 'Mid'],
  TahmKench: ['Top', 'Support'],
  Teemo: ['Top', 'Support'],
  Trundle: ['Top', 'Jungle'],
  Tryndamere: ['Top', 'Mid'],
  Urgot: ['Top'],
  Volibear: ['Top', 'Jungle'],
  Warwick: ['Top', 'Jungle'],
  Wukong: ['Top', 'Jungle'],
  Yorick: ['Top'],

  // Jungle
  Amumu: ['Jungle', 'Support'],
  Belveth: ['Jungle'],
  Briar: ['Jungle', 'Top'],
  Diana: ['Jungle', 'Mid'],
  Ekko: ['Jungle', 'Mid'],
  Elise: ['Jungle', 'Support'],
  Evelynn: ['Jungle'],
  Fiddlesticks: ['Jungle', 'Support'],
  Gragas: ['Jungle', 'Top', 'Mid'],
  Graves: ['Jungle'],
  Hecarim: ['Jungle'],
  Ivern: ['Jungle'],
  JarvanIV: ['Jungle'],
  Karthus: ['Jungle', 'ADC'],
  Kayn: ['Jungle'],
  KhaZix: ['Jungle'],
  Kindred: ['Jungle'],
  LeeSin: ['Jungle'],
  Lillia: ['Jungle', 'Top'],
  MasterYi: ['Jungle'],
  Nidalee: ['Jungle'],
  Nocturne: ['Jungle'],
  Nunu: ['Jungle', 'Mid'],
  Rammus: ['Jungle'],
  RekSai: ['Jungle', 'Top'],
  Rengar: ['Jungle', 'Top'],
  Sejuani: ['Jungle', 'Top'],
  Shaco: ['Jungle', 'Support'],
  Shyvana: ['Jungle', 'Top'],
  Skarner: ['Jungle', 'Top'],
  Taliyah: ['Jungle', 'Mid'],
  Udyr: ['Jungle', 'Top'],
  Vi: ['Jungle'],
  Viego: ['Jungle', 'Mid'],
  XinZhao: ['Jungle'],
  Zac: ['Jungle', 'Top', 'Support'],

  // Mid Lane
  Ahri: ['Mid'],
  Akali: ['Mid', 'Top'],
  Akshan: ['Mid', 'Top'],
  Anivia: ['Mid'],
  Annie: ['Mid', 'Support'],
  AurelionSol: ['Mid'],
  Azir: ['Mid'],
  Cassiopeia: ['Mid', 'Top'],
  Corki: ['Mid', 'ADC'],
  Fizz: ['Mid'],
  Galio: ['Mid', 'Support'],
  Heimerdinger: ['Mid', 'Top', 'Support'],
  Hwei: ['Mid', 'Support'],
  Kassadin: ['Mid'],
  Katarina: ['Mid'],
  LeBlanc: ['Mid'],
  Lissandra: ['Mid'],
  Lux: ['Mid', 'Support'],
  Malzahar: ['Mid'],
  Naafiri: ['Mid', 'Top'],
  Neeko: ['Mid', 'Support'],
  Orianna: ['Mid'],
  Qiyana: ['Mid', 'Jungle'],
  Ryze: ['Mid', 'Top'],
  Swain: ['Mid', 'Support', 'ADC'],
  Sylas: ['Mid', 'Top', 'Jungle'],
  Syndra: ['Mid'],
  Talon: ['Mid', 'Jungle'],
  TwistedFate: ['Mid', 'ADC'],
  Veigar: ['Mid', 'ADC'],
  Velkoz: ['Mid', 'Support'],
  Vex: ['Mid'],
  Viktor: ['Mid'],
  Vladimir: ['Mid', 'Top'],
  Xerath: ['Mid', 'Support'],
  Yasuo: ['Mid', 'Top', 'ADC'],
  Yone: ['Mid', 'Top'],
  Zed: ['Mid', 'Jungle'],
  Ziggs: ['Mid', 'ADC'],
  Zoe: ['Mid', 'Support'],

  // Bot / ADC
  Aphelios: ['ADC'],
  Ashe: ['ADC', 'Support'],
  Caitlyn: ['ADC'],
  Draven: ['ADC'],
  Ezreal: ['ADC'],
  Jhin: ['ADC'],
  Jinx: ['ADC'],
  Kaisa: ['ADC'],
  Kalista: ['ADC'],
  KogMaw: ['ADC'],
  Lucian: ['ADC', 'Mid'],
  MissFortune: ['ADC', 'Support'],
  Nilah: ['ADC'],
  Samira: ['ADC'],
  Sivir: ['ADC'],
  Smolder: ['ADC', 'Mid', 'Top'],
  Tristana: ['ADC', 'Mid'],
  Twitch: ['ADC', 'Support'],
  Varus: ['ADC', 'Mid'],
  Vayne: ['ADC', 'Top'],
  Xayah: ['ADC'],
  Zeri: ['ADC'],

  // Support
  Alistar: ['Support'],
  Bard: ['Support'],
  Blitzcrank: ['Support'],
  Brand: ['Support', 'Mid', 'Jungle'],
  Braum: ['Support'],
  Janna: ['Support'],
  Karma: ['Support', 'Mid'],
  Leona: ['Support'],
  Lulu: ['Support'],
  Milio: ['Support'],
  Morgana: ['Support', 'Jungle', 'Mid'],
  Nami: ['Support'],
  Nautilus: ['Support'],
  Pyke: ['Support', 'Mid'],
  Rakan: ['Support'],
  Rell: ['Support'],
  Renata: ['Support'],
  Senna: ['Support', 'ADC'],
  Seraphine: ['Support', 'ADC', 'Mid'],
  Sona: ['Support'],
  Soraka: ['Support'],
  Taric: ['Support'],
  Thresh: ['Support'],
  Yuumi: ['Support'],
  Zilean: ['Support', 'Mid'],
  Zyra: ['Support', 'Jungle', 'Mid'],
};

/**
 * Checks if a champion matches the selected lane filter.
 */
export function matchChampionLane(championId: string, laneTag: string): boolean {
  if (laneTag === 'All') return true;
  const targetLane = (laneTag === 'Bot / ADC' || laneTag === 'ADC') ? 'ADC' : laneTag;
  const lanes = CHAMPION_LANES[championId];
  if (!lanes) return false;
  return lanes.includes(targetLane as ChampionLane);
}
