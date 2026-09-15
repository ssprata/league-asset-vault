import React, { useState } from 'react';
import { ResolutionScale, CacheStats } from '@shared/types';
import { Sparkles, FolderOpen, RefreshCw, Zap, Trash2, Check, X } from 'lucide-react';

interface HeaderProps {
  versions: string[];
  currentVersion: string;
  onVersionChange: (version: string) => void;
  scale: ResolutionScale;
  onScaleChange: (scale: ResolutionScale) => void;
  cacheStats: CacheStats | null;
  onOpenCacheDir: () => void;
  onClearCache: () => Promise<void>;
  onBatchUpscale: () => void;
  isBatchProcessing: boolean;
  totalFilteredCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  versions,
  currentVersion,
  onVersionChange,
  scale,
  onScaleChange,
  cacheStats,
  onOpenCacheDir,
  onClearCache,
  onBatchUpscale,
  isBatchProcessing,
  totalFilteredCount,
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
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 50,
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/* Brand Logo & Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #c8aa6e 0%, #785a28 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(200, 170, 110, 0.35)',
          }}
        >
          <Sparkles size={20} color="#050811" />
        </div>
        <div>
          <h1
            className="title-hextech"
            style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, lineHeight: 1.2 }}
          >
            LEAGUE ASSET VAULT
          </h1>
          <span
            style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', letterSpacing: '0.04em' }}
          >
            WAIFU2X CU-NET &bull; CF_HDROP DRAG FOR PREMIERE PRO &bull; RESOLVE &bull; PHOTOSHOP
          </span>
        </div>
      </div>

      {/* Middle Controls: Version & Resolution */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Riot Patch Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            PATCH
          </span>
          <select
            value={currentVersion}
            onChange={(e) => onVersionChange(e.target.value)}
            style={{
              background: 'rgba(5, 8, 17, 0.8)',
              border: '1px solid var(--border-gold)',
              color: 'var(--gold-light)',
              padding: '5px 10px',
              borderRadius: 6,
              fontSize: '0.82rem',
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
            padding: 3,
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
                  padding: '4px 12px',
                  borderRadius: 6,
                  fontSize: '0.78rem',
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'all 0.15s ease',
                }}
              >
                {res === '4x' && <Zap size={12} color={active ? '#c8aa6e' : '#64748b'} />}
                {res} {res === '1x' ? 'Original' : res === '2x' ? 'HD (2x)' : 'UHD (CU-Net 4x)'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Controls: Batch Upscale & Composite Cache Control */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {scale !== '1x' && (
          <button
            className="btn-hextech btn-blue"
            onClick={onBatchUpscale}
            disabled={isBatchProcessing}
            style={{ fontSize: '0.78rem' }}
            title="Pre-upscale currently filtered assets with waifu2x for instant drag-and-drop"
          >
            {isBatchProcessing ? (
              <RefreshCw size={14} className="animate-pulse-glow" />
            ) : (
              <Zap size={14} />
            )}
            {isBatchProcessing ? 'Upscaling...' : `Upscale ${totalFilteredCount} to ${scale}`}
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
          {/* Main button: Click to open folder */}
          <button
            onClick={onOpenCacheDir}
            style={{
              background: 'transparent',
              border: 'none',
              borderRight: '1px solid var(--border-subtle)',
              color: 'var(--gold-light)',
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              fontSize: '0.78rem',
              padding: '6px 10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'background 0.15s ease',
            }}
            title="Open AppData cache directory in Windows Explorer"
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(200, 170, 110, 0.15)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <FolderOpen size={14} color="var(--gold-primary)" />
            <span>Cache: {displayCacheSize}</span>
          </button>

          {/* Trash / Clear Cache Button with inline confirmation */}
          {confirmClear ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                padding: '2px 6px',
                background: 'rgba(239, 68, 68, 0.15)',
              }}
            >
              <span style={{ fontSize: '0.70rem', color: '#f87171', fontWeight: 600, paddingRight: 4 }}>
                Purge upscales?
              </span>
              <button
                onClick={handleClear}
                disabled={clearing}
                style={{
                  background: '#ef4444',
                  border: 'none',
                  color: '#fff',
                  borderRadius: 4,
                  padding: '2px 6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '0.70rem',
                  fontWeight: 700,
                }}
                title="Confirm deletion of upscaled cache"
              >
                <Check size={12} />
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  borderRadius: 4,
                  padding: '2px 6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '0.70rem',
                }}
                title="Cancel"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClear(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                padding: '6px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              title="Clear all upscaled cache files (preserves manifests & configs)"
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ef4444';
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
