import React from 'react';
import { AudioAsset } from '@shared/types';
import { AudioCard } from './AudioCard';
import { VolumeX } from 'lucide-react';

interface AudioGridProps {
  assets: AudioAsset[];
  volume?: number;
}

export const AudioGrid: React.FC<AudioGridProps> = ({ assets, volume }) => {
  if (assets.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 40,
          color: 'var(--text-muted)',
          gap: 12,
        }}
      >
        <VolumeX size={44} color="var(--border-gold)" />
        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--gold-light)' }}>
          No audio sound effects match your filter
        </div>
        <div style={{ fontSize: '0.80rem', color: 'var(--text-secondary)' }}>
          Try clearing your search query or selecting "All" under the filter tags.
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 14,
        alignContent: 'start',
      }}
    >
      {assets.map((asset) => (
        <AudioCard key={asset.id} asset={asset} volume={volume} />
      ))}
    </div>
  );
};
