import React, { useState } from 'react';
import { ResolutionScale, CacheStats, MaskShape } from '@shared/types';
import {
  Sparkles,
  FolderOpen,
  RefreshCw,
  Zap,
  Trash2,
  Check,
  X,
  Settings,
  Bookmark,
  Circle,
  Square,
} from 'lucide-react';

interface HeaderProps {
  versions: string[];
  currentVersion: string;
  onVersionChange: (version: string) => void;
  scale: ResolutionScale;
  onScaleChange: (scale: ResolutionScale) => void;
  maskShape: MaskShape;
  onMaskShapeChange: (shape: MaskShape) => void;
  cacheStats: CacheStats | null;
  onOpenCacheDir: () => void;
  onClearCache: () => Promise<void>;
  onBatchUpscale: () => void;
  isBatchProcessing: boolean;
  totalFilteredCount: number;
  onOpenSettings: () => void;
  pinnedCount: number;
  isQuickBinOpen: boolean;
  onToggleQuickBin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  versions,
  currentVersion,
  onVersionChange,
  scale,
  onScaleChange,
  maskShape,
  onMaskShapeChange,
  cacheStats,
  onOpenCacheDir,
  onClearCache,
  onBatchUpscale,
  isBatchProcessing,
  totalFilteredCount,
  onOpenSettings,
  pinnedCount,
  isQuickBinOpen,
  onToggleQuickBin,
}) => {
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);

  const displayCacheSize = cacheStats?.formattedSize || '0 B';

  const handleClear = async () => {
    try {
      setClearing(true);
      await onClearCache();
      setConfirmClear(false);
    } catch (e) {
      console.error(e);
    } finally {
      setClearing(false);
    }
  };

  return (
    <header
      className="glass-panel"
      style={{
        padding: '10px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 50,
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/* Brand Logo & Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #c8aa6e 0%, #785a28 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(200, 170, 110, 0.35)',
          }}
        >
          <Sparkles size={18} color="#050811" />
        </div>
        <div>
          <h1
            className="title-hextech"
            style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, lineHeight: 1.15 }}
          >
            LEAGUE ASSET VAULT
          </h1>
          <span
            style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', letterSpacing: '0.04em' }}
          >
            WAIFU2X CU-NET &bull; CF_HDROP DRAG &bull; RAW CLIPBOARD BITMAP
          </span>
        </div>
      </div>

      {/* Middle Controls: Version, Resolution & Shape */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Riot Patch Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700 }}>
            PATCH
          </span>
          <select
            value={currentVersion}
            onChange={(e) => onVersionChange(e.target.value)}
            style={{
              background: 'rgba(5, 8, 17, 0.8)',
              border: '1px solid var(--border-gold)',
              color: 'var(--gold-light)',
              padding: '4px 8px',
              borderRadius: 6,
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {versions.map((ver) => (
              <option key={ver} value={ver}>
                v{ver}
              </option>
            ))}
          </select>
        </div>

        {/* Resolution Scale Switcher */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(5, 8, 17, 0.8)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            padding: 2,
            gap: 2,
          }}
        >
          {(['1x', '2x', '4x'] as ResolutionScale[]).map((res) => {
            const active = scale === res;
            return (
              <button
                key={res}
                onClick={() => onScaleChange(res)}
                style={{
                  background: active
                    ? 'linear-gradient(135deg, rgba(200, 170, 110, 0.3) 0%, rgba(120, 90, 40, 0.4) 100%)'
                    : 'transparent',
                  border: active ? '1px solid var(--gold-primary)' : '1px solid transparent',
                  color: active ? '#ffffff' : 'var(--text-secondary)',
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: '0.76rem',
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'all 0.15s ease',
                }}
              >
                {res === '4x' && <Zap size={11} color={active ? '#c8aa6e' : '#64748b'} />}
                {res} {res === '1x' ? 'Original' : res === '2x' ? 'HD' : 'CU-Net 4x'}
              </button>
            );
          })}
        </div>

        {/* Shape Toggle: Square vs Circle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(5, 8, 17, 0.8)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            padding: 2,
            gap: 2,
          }}
        >
          <button
            onClick={() => onMaskShapeChange('square')}
            style={{
              background:
                maskShape === 'square'
                  ? 'linear-gradient(135deg, rgba(200, 170, 110, 0.3) 0%, rgba(120, 90, 40, 0.4) 100%)'
                  : 'transparent',
              border: maskShape === 'square' ? '1px solid var(--gold-primary)' : '1px solid transparent',
              color: maskShape === 'square' ? '#fff' : 'var(--text-secondary)',
              padding: '4px 8px',
              borderRadius: 6,
              fontSize: '0.72rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
            title="Standard square icon borders"
          >
            <Square size={11} /> Square
          </button>
          <button
            onClick={() => onMaskShapeChange('circle')}
            style={{
              background:
                maskShape === 'circle'
                  ? 'linear-gradient(135deg, rgba(200, 170, 110, 0.3) 0%, rgba(120, 90, 40, 0.4) 100%)'
                  : 'transparent',
              border: maskShape === 'circle' ? '1px solid var(--gold-primary)' : '1px solid transparent',
              color: maskShape === 'circle' ? '#fff' : 'var(--text-secondary)',
              padding: '4px 8px',
              borderRadius: 6,
              fontSize: '0.72rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
            title="Transparent circular alpha cutout (PNG)"
          >
            <Circle size={11} /> Circle
          </button>
        </div>
      </div>

      {/* Right Controls: QuickBin, Batch, Cache, Settings */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* QuickBin Toggle */}
        <button
          onClick={onToggleQuickBin}
          className="btn-hextech"
          style={{
            fontSize: '0.75rem',
            padding: '5px 10px',
            borderColor: isQuickBinOpen ? 'var(--gold-primary)' : undefined,
          }}
          title="Toggle Project Quick Bin tray"
        >
          <Bookmark size={13} fill={pinnedCount > 0 ? 'currentColor' : 'none'} />
          <span>Bin ({pinnedCount})</span>
        </button>

        {/* Batch Upscale */}
        {scale !== '1x' && (
          <button
            className="btn-hextech btn-blue"
            onClick={onBatchUpscale}
            disabled={isBatchProcessing}
            style={{ fontSize: '0.75rem', padding: '5px 10px' }}
            title="Pre-upscale currently filtered assets with waifu2x for instant drag-and-drop"
          >
            {isBatchProcessing ? (
              <RefreshCw size={13} className="animate-pulse-glow" />
            ) : (
              <Zap size={13} />
            )}
            {isBatchProcessing ? 'Upscaling...' : `Upscale (${totalFilteredCount})`}
          </button>
        )}

        {/* Composite Cache Management Control */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(5, 8, 17, 0.85)',
            border: '1px solid var(--border-gold)',
            borderRadius: 6,
            overflow: 'hidden',
          }}
        >
          <button
            onClick={onOpenCacheDir}
            style={{
              background: 'transparent',
              border: 'none',
              borderRight: '1px solid var(--border-subtle)',
              color: 'var(--gold-light)',
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              fontSize: '0.75rem',
              padding: '5px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              transition: 'background 0.15s ease',
            }}
            title="Open AppData cache directory in Windows Explorer"
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(200, 170, 110, 0.15)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <FolderOpen size={13} color="var(--gold-primary)" />
            <span>{displayCacheSize}</span>
          </button>

          {confirmClear ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                padding: '2px 4px',
                background: 'rgba(239, 68, 68, 0.15)',
              }}
            >
              <button
                onClick={handleClear}
                disabled={clearing}
                style={{
                  background: '#ef4444',
                  border: 'none',
                  color: '#fff',
                  borderRadius: 4,
                  padding: '2px 5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                }}
                title="Confirm deletion of upscaled cache"
              >
                <Check size={11} />
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  borderRadius: 4,
                  padding: '2px 5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '0.68rem',
                }}
                title="Cancel"
              >
                <X size={11} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClear(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                padding: '5px 7px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              title="Clear upscaled cache files"
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ef4444';
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="btn-hextech"
          style={{ padding: '5px 8px', fontSize: '0.75rem' }}
          title="App & GPU Engine Preferences"
        >
          <Settings size={14} />
        </button>
      </div>
    </header>
  );
};
