import { describe, it, expect } from 'vitest';
import { formatBytes } from '../main/services/cacheManager';

describe('cacheManager: formatBytes', () => {
  it('formats zero and negative bytes correctly', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(-100)).toBe('0 B');
  });

  it('formats bytes into KB, MB, and GB', () => {
    expect(formatBytes(500)).toBe('500 B');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(1048576)).toBe('1 MB');
    expect(formatBytes(10485760)).toBe('10 MB');
    expect(formatBytes(1073741824)).toBe('1 GB');
  });
});

describe('cacheManager: fingerprinting rules', () => {
  function computeFingerprint(
    rawId: string,
    scale: '1x' | '2x' | '4x',
    noiseLevel: number = 3,
    maskShape: 'square' | 'circle' = 'square',
    frameStyle: 'none' | 'gold_border' | 'drop_shadow' = 'none',
    stampBadge: boolean = false
  ): string {
    const circleSuffix = maskShape === 'circle' ? '_circle' : '';
    const frameSuffix = frameStyle && frameStyle !== 'none' ? `_${frameStyle}` : '';
    const badgeSuffix = stampBadge ? '_badge' : '';

    if (scale === '1x') {
      return `${rawId}${circleSuffix}${frameSuffix}${badgeSuffix}.png`;
    }

    const scaleNum = scale === '4x' ? '4' : '2';
    return `${rawId}_scale${scaleNum}x_noise${noiseLevel}${circleSuffix}${frameSuffix}${badgeSuffix}.png`;
  }

  it('generates standard 1x filename', () => {
    expect(computeFingerprint('Ahri', '1x')).toBe('Ahri.png');
  });

  it('generates 4x UHD with noise level 3 filename', () => {
    expect(computeFingerprint('Ahri', '4x', 3)).toBe('Ahri_scale4x_noise3.png');
  });

  it('generates circular cutout with gold border and badge', () => {
    expect(
      computeFingerprint('3031', '4x', 3, 'circle', 'gold_border', true)
    ).toBe('3031_scale4x_noise3_circle_gold_border_badge.png');
  });

  it('generates 2x HD drop shadow cutout', () => {
    expect(
      computeFingerprint('Flash', '2x', 2, 'circle', 'drop_shadow', false)
    ).toBe('Flash_scale2x_noise2_circle_drop_shadow.png');
  });
});
