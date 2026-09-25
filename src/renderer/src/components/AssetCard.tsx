import React, { useState } from 'react';
import { AnyAsset, ResolutionScale, MaskShape, SummonerSpellAsset, AbilityAsset, RuneAsset } from '@shared/types';
import { Zap, Eye, Move, Bookmark, Copy, Check } from 'lucide-react';

interface AssetCardProps {
  asset: AnyAsset;
  scale: ResolutionScale;
  maskShape?: MaskShape;
  isPinned?: boolean;
  onTogglePin?: (asset: AnyAsset) => void;
  onPreview: (asset: AnyAsset) => void;
  onQuickUpscale?: (asset: AnyAsset) => void;
}

export const AssetCard: React.FC<AssetCardProps> = ({
  asset,
  scale,
  maskShape = 'square',
  isPinned = false,
  onTogglePin,
  onPreview,
  onQuickUpscale,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [copied, setCopied] = useState(false);

  const displayName = asset.name;

  const getSubtitle = () => {
    if (asset.type === 'champion') return asset.title;
    if (asset.type === 'item') return `${asset.goldTotal}g`;
    if (asset.type === 'summoner') {
      const spell = asset as SummonerSpellAsset;
      return spell.cooldown > 0 ? `${spell.cooldown}s CD` : 'Spell';
    }
    if (asset.type === 'ability') {
      const ability = asset as AbilityAsset;
      return `[${ability.slot}] Ability`;
    }
    if (asset.type === 'rune') {
      const rune = asset as RuneAsset;
      return rune.slotType === 'keystone' ? `Keystone · ${rune.treeName}` : rune.treeName;
    }
    return '';
  };

  const handleDragStart = (e: React.DragEvent) => {
    // Crucial for native OS file drag: prevent browser default HTML dragging
    e.preventDefault();

    // Trigger Electron main process startDrag with Win32 CF_HDROP payload
    window.electronAPI.startDrag({
      assetId: asset.id,
      assetType: asset.type,
      scale,
      maskShape,
      imageFileName: asset.imageFileName,
      cdnUrl: asset.cdnUrl,
    });
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // Ensure file exists / generate upscale
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
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        }
      }
    } catch (err) {
      console.error('Copy to clipboard failed:', err);
    }
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
        border: isPinned ? '1px solid var(--gold-primary)' : '1px solid var(--border-subtle)',
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Top Left: Pin / Favorite Button */}
      {onTogglePin && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin(asset);
          }}
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            zIndex: 15,
            background: isPinned ? 'var(--gold-primary)' : 'rgba(10, 17, 32, 0.8)',
            color: isPinned ? '#050811' : 'var(--gold-light)',
            border: '1px solid rgba(200, 170, 110, 0.3)',
            borderRadius: 4,
            padding: 3,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isPinned || isHovered ? 1 : 0,
            transition: 'opacity 0.15s ease',
          }}
          title={isPinned ? 'Unpin from Quick Bin' : 'Pin to Project Quick Bin'}
        >
          <Bookmark size={12} fill={isPinned ? 'currentColor' : 'none'} />
        </button>
      )}

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
          borderRadius: maskShape === 'circle' ? '50%' : 6,
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
          <div
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
              textAlign: 'center',
              padding: 8,
            }}
          >
            {displayName}
          </div>
        )}

        {/* Hover Overlay with Drag Cue & Quick Actions */}
        {isHovered && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(5, 8, 17, 0.72)',
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
                fontSize: '0.68rem',
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
            <div style={{ display: 'flex', gap: 5 }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview(asset);
                }}
                className="btn-hextech"
                style={{ padding: '3px 7px', fontSize: '0.66rem' }}
                title="Preview comparison & options"
              >
                <Eye size={12} />
              </button>

              <button
                onClick={handleCopy}
                className="btn-hextech"
                style={{
                  padding: '3px 7px',
                  fontSize: '0.66rem',
                  borderColor: copied ? '#10b981' : undefined,
                  color: copied ? '#10b981' : undefined,
                }}
                title="Copy bitmap directly to OS clipboard (Ctrl+C)"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
              </button>

              {scale !== '1x' && onQuickUpscale && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickUpscale(asset);
                  }}
                  className="btn-hextech btn-blue"
                  style={{ padding: '3px 7px', fontSize: '0.66rem' }}
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
          title={getSubtitle()}
          style={{
            fontSize: '0.68rem',
            color: 'var(--text-muted)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {getSubtitle()}
        </div>
      </div>
    </div>
  );
};
