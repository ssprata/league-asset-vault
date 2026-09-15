import React, { useState } from 'react';
import { AnyAsset, ResolutionScale, MaskShape } from '@shared/types';
import { Bookmark, ChevronDown, ChevronUp, Copy, Move, Trash2, X, Check } from 'lucide-react';

interface QuickBinProps {
  pinnedAssets: AnyAsset[];
  onUnpin: (assetId: string) => void;
  onClearAll: () => void;
  scale: ResolutionScale;
  maskShape?: MaskShape;
  onPreview: (asset: AnyAsset) => void;
}

export const QuickBin: React.FC<QuickBinProps> = ({
  pinnedAssets,
  onUnpin,
  onClearAll,
  scale,
  maskShape = 'square',
  onPreview,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (pinnedAssets.length === 0) {
    return null;
  }

  const handleDragStart = (e: React.DragEvent, asset: AnyAsset) => {
    e.preventDefault();
    window.electronAPI.startDrag({
      assetId: asset.id,
      assetType: asset.type,
      scale,
      maskShape,
      imageFileName: asset.imageFileName,
      cdnUrl: asset.cdnUrl,
    });
  };

  const handleCopy = async (e: React.MouseEvent, asset: AnyAsset) => {
    e.stopPropagation();
    try {
      const res = await window.electronAPI.generateUpscale({
        assetId: asset.id,
        assetType: asset.type,
        scale,
        noiseLevel: 3,
        maskShape,
        imageFileName: asset.imageFileName,
        cdnUrl: asset.cdnUrl,
      });

      if (res.success && res.filePath) {
        const clipRes = await window.electronAPI.copyImageToClipboard(res.filePath);
        if (clipRes.success) {
          setCopiedId(asset.id);
          setTimeout(() => setCopiedId(null), 1600);
        }
      }
    } catch (err) {
      console.error('QuickBin copy failed:', err);
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'rgba(7, 12, 22, 0.95)',
        borderTop: '1px solid var(--border-gold)',
        boxShadow: '0 -8px 24px rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(16px)',
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.25s ease',
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 20px',
          background: 'rgba(10, 17, 32, 0.9)',
          borderBottom: isExpanded ? '1px solid var(--border-subtle)' : 'none',
          cursor: 'pointer',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bookmark size={15} color="var(--gold-primary)" />
          <span
            style={{
              fontSize: '0.78rem',
              fontWeight: 800,
              letterSpacing: '0.04em',
              color: 'var(--gold-light)',
            }}
          >
            PROJECT QUICK BIN
          </span>
          <span
            style={{
              background: 'rgba(200, 170, 110, 0.25)',
              border: '1px solid var(--gold-primary)',
              color: 'var(--gold-light)',
              borderRadius: 10,
              padding: '1px 7px',
              fontSize: '0.68rem',
              fontWeight: 700,
            }}
          >
            {pinnedAssets.length} pinned
          </span>
          <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>
            &bull; Drag straight into Premiere Pro, Photoshop, or DaVinci Resolve
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClearAll();
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.70rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
            title="Remove all items from project pinboard"
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <Trash2 size={12} />
            Clear Bin
          </button>

          <button
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--gold-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
      </div>

      {/* Tray Content Carousel */}
      {isExpanded && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 20px',
            overflowX: 'auto',
            minHeight: 88,
          }}
        >
          {pinnedAssets.map((asset) => {
            const isCopied = copiedId === asset.id;
            return (
              <div
                key={asset.id}
                draggable="true"
                onDragStart={(e) => handleDragStart(e, asset)}
                onClick={() => onPreview(asset)}
                className="card-draggable"
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'rgba(13, 22, 38, 0.85)',
                  border: '1px solid var(--border-gold)',
                  borderRadius: 8,
                  padding: '6px 10px',
                  cursor: 'grab',
                  userSelect: 'none',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                }}
              >
                {/* Thumbnail */}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: maskShape === 'circle' ? '50%' : 6,
                    overflow: 'hidden',
                    backgroundColor: '#050811',
                    border: '1px solid rgba(200, 170, 110, 0.25)',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={asset.cdnUrl}
                    alt={asset.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                {/* Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 110 }}>
                  <span
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {asset.name}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span
                      style={{
                        background: 'rgba(200, 170, 110, 0.2)',
                        color: 'var(--gold-light)',
                        fontSize: '0.60rem',
                        fontWeight: 700,
                        padding: '0 4px',
                        borderRadius: 3,
                      }}
                    >
                      {scale}
                    </span>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                      {maskShape === 'circle' ? 'Circle' : 'Square'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginLeft: 4 }}>
                  <button
                    onClick={(e) => handleCopy(e, asset)}
                    style={{
                      background: isCopied ? '#10b981' : 'rgba(255, 255, 255, 0.08)',
                      border: 'none',
                      color: isCopied ? '#050811' : 'var(--text-secondary)',
                      borderRadius: 4,
                      padding: 4,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Copy bitmap image directly to clipboard (Ctrl+C)"
                  >
                    {isCopied ? <Check size={11} /> : <Copy size={11} />}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnpin(asset.id);
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: 'none',
                      color: 'var(--text-muted)',
                      borderRadius: 4,
                      padding: 4,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Unpin from Quick Bin"
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >
                    <X size={11} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
