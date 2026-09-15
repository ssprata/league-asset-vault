import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AnyAsset, ResolutionScale, MaskShape } from '@shared/types';
import { AssetCard } from './AssetCard';
import { SearchX } from 'lucide-react';

interface AssetGridProps {
  assets: AnyAsset[];
  scale: ResolutionScale;
  maskShape?: MaskShape;
  pinnedIds?: Set<string>;
  onTogglePin?: (asset: AnyAsset) => void;
  onPreview: (asset: AnyAsset) => void;
  onQuickUpscale?: (asset: AnyAsset) => void;
}

export const AssetGrid: React.FC<AssetGridProps> = ({
  assets,
  scale,
  maskShape = 'square',
  pinnedIds,
  onTogglePin,
  onPreview,
  onQuickUpscale,
}) => {
  const [renderLimit, setRenderLimit] = useState(80);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset batch limit when asset filter changes
  useEffect(() => {
    setRenderLimit(80);
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [assets]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - (scrollTop + clientHeight) < 400) {
      setRenderLimit((prev) => Math.min(assets.length, prev + 60));
    }
  };

  const visibleAssets = useMemo(() => {
    return assets.slice(0, renderLimit);
  }, [assets, renderLimit]);

  if (assets.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          color: 'var(--text-muted)',
        }}
      >
        <SearchX size={48} color="var(--border-gold)" />
        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          No matching assets found
        </div>
        <div style={{ fontSize: '0.82rem' }}>
          Try adjusting your search terms or filter tags.
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px 24px',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: 14,
        }}
      >
        {visibleAssets.map((asset) => (
          <AssetCard
            key={`${asset.type}-${asset.id}`}
            asset={asset}
            scale={scale}
            maskShape={maskShape}
            isPinned={pinnedIds?.has(asset.id)}
            onTogglePin={onTogglePin}
            onPreview={onPreview}
            onQuickUpscale={onQuickUpscale}
          />
        ))}
      </div>

      {renderLimit < assets.length && (
        <div
          style={{
            textAlign: 'center',
            padding: '24px 0 12px',
            color: 'var(--text-muted)',
            fontSize: '0.78rem',
          }}
        >
          Loading more assets ({renderLimit} of {assets.length})...
        </div>
      )}
    </div>
  );
};
