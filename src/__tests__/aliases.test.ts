import { describe, it, expect } from 'vitest';
import { matchAssetWithAliases, matchChampionLane, CHAMPION_LANES } from '../shared/aliases';
import { ChampionAsset, ItemAsset, SummonerSpellAsset } from '../shared/types';

describe('aliases: matchChampionLane', () => {
  it('correctly maps single lane champions', () => {
    expect(matchChampionLane('Darius', 'Top')).toBe(true);
    expect(matchChampionLane('Darius', 'Mid')).toBe(false);
    expect(matchChampionLane('Graves', 'Jungle')).toBe(true);
    expect(matchChampionLane('Jinx', 'ADC')).toBe(true);
    expect(matchChampionLane('Jinx', 'Bot / ADC')).toBe(true);
    expect(matchChampionLane('Thresh', 'Support')).toBe(true);
  });

  it('correctly maps multi-lane flex champions', () => {
    expect(matchChampionLane('Lux', 'Mid')).toBe(true);
    expect(matchChampionLane('Lux', 'Support')).toBe(true);
    expect(matchChampionLane('Lux', 'Top')).toBe(false);

    expect(matchChampionLane('Yasuo', 'Mid')).toBe(true);
    expect(matchChampionLane('Yasuo', 'Top')).toBe(true);
    expect(matchChampionLane('Yasuo', 'Bot / ADC')).toBe(true);
  });

  it('handles "All" tag gracefully', () => {
    expect(matchChampionLane('Aatrox', 'All')).toBe(true);
    expect(matchChampionLane('UnknownChampion', 'All')).toBe(true);
  });

  it('handles unknown champions safely', () => {
    expect(matchChampionLane('NonExistentChamp', 'Top')).toBe(false);
  });
});

describe('aliases: matchAssetWithAliases', () => {
  const dummyChampion: ChampionAsset = {
    type: 'champion',
    id: 'MissFortune',
    name: 'Miss Fortune',
    title: 'the Bounty Hunter',
    key: '21',
    tags: ['Marksman'],
    imageFileName: 'MissFortune.png',
    cdnUrl: 'https://ddragon.leagueoflegends.com/cdn/img/champion/MissFortune.png',
  };

  const dummyItem: ItemAsset = {
    type: 'item',
    id: '3031',
    name: 'Infinity Edge',
    plaintext: 'Massively increases Critical Strike Damage',
    description: 'Stats & Crit',
    goldTotal: 3400,
    tags: ['CriticalStrike', 'Damage'],
    imageFileName: '3031.png',
    cdnUrl: 'https://ddragon.leagueoflegends.com/cdn/img/item/3031.png',
  };

  const dummyBork: ItemAsset = {
    type: 'item',
    id: '3153',
    name: 'Blade of the Ruined King',
    plaintext: 'Deals damage based on target current Health',
    description: 'Attack damage and lifesteal',
    goldTotal: 3200,
    tags: ['AttackSpeed', 'LifeSteal'],
    imageFileName: '3153.png',
    cdnUrl: 'https://ddragon.leagueoflegends.com/cdn/img/item/3153.png',
  };

  it('matches champion by full name or partial name', () => {
    expect(matchAssetWithAliases(dummyChampion, 'miss')).toBe(true);
    expect(matchAssetWithAliases(dummyChampion, 'fortune')).toBe(true);
    expect(matchAssetWithAliases(dummyChampion, 'bounty')).toBe(true);
  });

  it('matches champion by community acronym (MF)', () => {
    expect(matchAssetWithAliases(dummyChampion, 'mf')).toBe(true);
  });

  it('matches item by acronym (IE, BORK)', () => {
    expect(matchAssetWithAliases(dummyItem, 'ie')).toBe(true);
    expect(matchAssetWithAliases(dummyBork, 'bork')).toBe(true);
    expect(matchAssetWithAliases(dummyBork, 'botrk')).toBe(true);
  });

  it('returns false for unrelated query', () => {
    expect(matchAssetWithAliases(dummyChampion, 'darius')).toBe(false);
    expect(matchAssetWithAliases(dummyItem, 'zhonya')).toBe(false);
  });

  it('matches empty query as true', () => {
    expect(matchAssetWithAliases(dummyChampion, '')).toBe(true);
    expect(matchAssetWithAliases(dummyItem, '  ')).toBe(true);
  });
});
