import { describe, it, expect } from 'vitest';
import { SkinAsset } from '../shared/types';

describe('Skins filtering: chroma exclusion', () => {
  const mockRawSkins = [
    { id: '166000', num: 0, name: 'default', chromas: false },
    { id: '166001', num: 1, name: 'Cyber Pop Akshan', chromas: true },
    { id: '166002', num: 2, name: 'Cyber Pop Akshan (Ruby)', chromas: false, parentSkin: 1 },
    { id: '166003', num: 3, name: 'Cyber Pop Akshan (Catseye)', chromas: false, parentSkin: 1 },
    { id: '166004', num: 4, name: 'Cyber Pop Akshan (Emerald)', chromas: false, parentSkin: 1 },
    { id: '166010', num: 10, name: 'Crystal Rose Akshan', chromas: true },
    { id: '166011', num: 11, name: 'Crystal Rose Akshan (Ruby)', chromas: false, parentSkin: 10 },
    { id: '166020', num: 20, name: 'Three Honors Akshan', chromas: false },
    { id: '166021', num: 21, name: 'High Noon Akshan', chromas: true },
    { id: '166022', num: 22, name: 'High Noon Akshan (Ruby)', chromas: false, parentSkin: 21 },
  ];

  function filterLegitimateSkins(rawSkins: any[]) {
    return rawSkins.filter((s) => {
      if (s.parentSkin !== undefined && s.parentSkin !== null) return false;
      if (s.isChroma || s.chroma) return false;
      return true;
    });
  }

  it('filters out all 5 chromas and keeps only the 5 legitimate skins', () => {
    const legitimate = filterLegitimateSkins(mockRawSkins);
    expect(legitimate.length).toBe(5);

    const names = legitimate.map((s) => s.name);
    expect(names).toEqual([
      'default',
      'Cyber Pop Akshan',
      'Crystal Rose Akshan',
      'Three Honors Akshan',
      'High Noon Akshan',
    ]);
  });

  it('rejects any entries with parentSkin', () => {
    const legitimate = filterLegitimateSkins(mockRawSkins);
    expect(legitimate.some((s) => s.parentSkin !== undefined)).toBe(false);
    expect(legitimate.some((s) => s.name.includes('(Ruby)'))).toBe(false);
  });
});
