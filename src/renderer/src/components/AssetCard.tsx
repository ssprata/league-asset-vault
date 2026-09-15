import React, { useState } from 'react';
import { AnyAsset, ResolutionScale } from '@shared/types';
import { Zap, Eye, Move } from 'lucide-react';

interface AssetCardProps {
  asset: AnyAsset;
  scale: ResolutionScale;
  onPreview: (asset: AnyAsset) => void;
  onQuickUpscale?: (asset: AnyAsset) => void;
}

export const AssetCard: React.FC<AssetCardProps> = ({
  asset,
  scale,
  onPreview,
  onQuickUpscale,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  const isChamp = asset.type === 'champion';
  const displayName = asset.name;
  const subtitle = isChamp ? asset.title : `${asset.goldTotal}g`;

  const handleDragStart = (e: React.DragEvent) => {
    // Crucial for native OS file drag: prevent browser default HTML dragging
    e.preventDefault();

    // Trigger Electron main process startDrag with Win32 CF_HDROP payload
    window.electronAPI.startDrag({
      assetId: asset.id,
      assetType: asset.type,
      scale,
    });
  };

  return (
    <div
      className="glass-panel card-draggable"
      draggable="true"
      onDragStart={handleDragStart}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 8,
        padding: 8,
        background: isHovered ? 'var(--bg-card-hover)' : 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Resolution Badge */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 10,
          background: scale === '4x' ? 'rgba(200, 170, 110, 0.9)' : 'rgba(10, 17, 32, 0.85)',
          color: scale === '4x' ? '#050811' : 'var(--gold-light)',
          border: '1px solid rgba(200, 170, 110, 0.3)',
          borderRadius: 4,
          padding: '1px 5px',
          fontSize: '0.65rem',
          fontWeight: 800,
          letterSpacing: '0.02em',
          backdropFilter: 'blur(4px)',
        }}
      >
        {scale}
      </div>

      {/* Image Container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1/1',
          borderRadius: 6,
          overflow: 'hidden',
          backgroundColor: '#050811',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(200, 170, 110, 0.1)',
        }}
      >
        {!imgError ? (
          <img
            src={asset.cdnUrl}
            alt={displayName}
            loading="lazy"
            onError={() => setImgError(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.3s ease',
              transform: isHovered ? 'scale(1.08)' : 'scale(1)',
              pointerEvents: 'none',
            }}
          />
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center', padding: 8 }}>
            {displayName}
          </div>
        )}

        {/* Hover Overlay with Drag Cue & Quick Actions */}
        {isHovered && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(5, 8, 17, 0.65)',
              backdropFilter: 'blur(3px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              zIndex: 20,
              animation: 'fadeIn 0.15s ease',
            }}
          >
            {/* Drag to Premiere Callout */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                color: 'var(--gold-light)',
                fontSize: '0.70rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                background: 'rgba(200, 170, 110, 0.25)',
                border: '1px solid var(--gold-primary)',
                padding: '3px 8px',
                borderRadius: 4,
                boxShadow: '0 0 10px rgba(200, 170, 110, 0.3)',
              }}
            >
              <Move size={12} />
              Drag to App
            </div>

            {/* Quick Action Buttons */}
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview(asset);
                }}
                className="btn-hextech"
                style={{ padding: '3px 8px', fontSize: '0.68rem' }}
                title="Preview full resolution comparison"
              >
                <Eye size={12} /> Zoom
              </button>

              {scale !== '1x' && onQuickUpscale && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickUpscale(asset);
                  }}
                  className="btn-hextech btn-blue"
                  style={{ padding: '3px 8px', fontSize: '0.68rem' }}
                  title="Upscale now"
                >
                  <Zap size={12} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Card Info Footer */}
      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div
          title={displayName}
          style={{
            fontSize: '0.80rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {displayName}
        </div>
        <div
          title={subtitle}
          style={{
            fontSize: '0.68rem',
            color: 'var(--text-muted)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textTransform: isChamp ? 'capitalize' : 'uppercase',
          }}
        >
          {subtitle}
        </div>
      </div>
    </div>
  );
};
