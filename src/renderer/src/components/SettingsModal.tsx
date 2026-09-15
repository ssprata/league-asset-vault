import React, { useState, useEffect } from 'react';
import { AppSettings, CacheStats, PrecacheProgressPayload } from '@shared/types';
import { DENOISE_OPTIONS } from '@shared/constants';
import {
  X,
  Settings,
  Cpu,
  Layers,
  DownloadCloud,
  CheckCircle2,
  FolderOpen,
  Trash2,
  Save,
  Loader2,
  HardDrive,
  Circle,
  Square,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cacheStats: CacheStats | null;
  onRefreshCacheStats: () => Promise<void>;
  onOpenCacheFolder: () => void;
  onClearCache: () => Promise<void>;
  currentVersion: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  cacheStats,
  onRefreshCacheStats,
  onOpenCacheFolder,
  onClearCache,
  currentVersion,
}) => {
  const [settings, setSettings] = useState<AppSettings>({
    gpuId: 0,
    tileSize: 0,
    defaultDenoise: 3,
    defaultScale: '4x',
    defaultMaskShape: 'square',
  });
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Pre-caching state
  const [precaching, setPrecaching] = useState(false);
  const [precacheProgress, setPrecacheProgress] = useState<PrecacheProgressPayload | null>(null);

  // Cache purge confirmation
  const [clearingCache, setClearingCache] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    async function loadSettings() {
      try {
        const s = await window.electronAPI.getSettings();
        setSettings(s);
      } catch (err) {
        console.error('Failed loading settings:', err);
      }
    }
    loadSettings();
  }, [isOpen]);

  // Subscribe to offline precache progress
  useEffect(() => {
    const unsub = window.electronAPI.onPrecacheProgress((payload) => {
      setPrecacheProgress(payload);
      if (payload.isDone) {
        setPrecaching(false);
        onRefreshCacheStats();
      }
    });
    return () => unsub();
  }, [onRefreshCacheStats]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await window.electronAPI.saveSettings(settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err) {
      console.error('Failed saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleStartPrecache = async () => {
    setPrecaching(true);
    try {
      await window.electronAPI.precacheAllAssets(currentVersion);
    } catch (err) {
      console.error('Precache error:', err);
      setPrecaching(false);
    }
  };

  const handleClear = async () => {
    setClearingCache(true);
    try {
      await onClearCache();
      await onRefreshCacheStats();
    } catch (e) {
      console.error(e);
    } finally {
      setClearingCache(false);
    }
  };

  const percent = precacheProgress && precacheProgress.total > 0
    ? Math.round((precacheProgress.completed / precacheProgress.total) * 100)
    : 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 6, 12, 0.88)',
        backdropFilter: 'blur(12px)',
        zIndex: 110,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: 680,
          maxHeight: '90vh',
          borderRadius: 12,
          padding: 24,
          border: '1px solid var(--gold-primary)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.85), 0 0 30px rgba(200, 170, 110, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                background: 'linear-gradient(135deg, #c8aa6e 0%, #785a28 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Settings size={18} color="#050811" />
            </div>
            <div>
              <h2 className="title-hextech" style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                ENGINE & APP PREFERENCES
              </h2>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                Vulkan GPU Acceleration &bull; Offline Pre-Caching &bull; Default Profiles
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--text-muted)',
              borderRadius: 6,
              padding: 6,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Section 1: GPU & Hardware Acceleration */}
        <div
          style={{
            background: 'rgba(5, 8, 17, 0.75)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Cpu size={16} color="var(--gold-primary)" />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--gold-light)' }}>
              GPU ACCELERATION & VULKAN INFERENCE
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {/* GPU Device ID */}
            <div>
              <label style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                GPU Device Selection (-g)
              </label>
              <select
                value={settings.gpuId}
                onChange={(e) => setSettings({ ...settings, gpuId: parseInt(e.target.value, 10) })}
                style={{
                  width: '100%',
                  background: 'rgba(10, 17, 32, 0.9)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 6,
                  color: 'var(--text-primary)',
                  padding: '7px 10px',
                  fontSize: '0.78rem',
                  outline: 'none',
                }}
              >
                <option value={0}>Auto / Default GPU (Device 0)</option>
                <option value={1}>Secondary GPU (Device 1)</option>
                <option value={-1}>CPU Only (-1, Slow)</option>
              </select>
              <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: 3, display: 'block' }}>
                Select discrete GPU (AMD Radeon / NVIDIA GeForce).
              </span>
            </div>

            {/* Tile Size */}
            <div>
              <label style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Inference Tile Size (-t)
              </label>
              <select
                value={settings.tileSize}
                onChange={(e) => setSettings({ ...settings, tileSize: parseInt(e.target.value, 10) })}
                style={{
                  width: '100%',
                  background: 'rgba(10, 17, 32, 0.9)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 6,
                  color: 'var(--text-primary)',
                  padding: '7px 10px',
                  fontSize: '0.78rem',
                  outline: 'none',
                }}
              >
                <option value={0}>Auto (Recommended)</option>
                <option value={100}>100 (Low VRAM / 2GB)</option>
                <option value={200}>200 (Standard 4GB)</option>
                <option value={400}>400 (High Performance 8GB+)</option>
              </select>
              <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: 3, display: 'block' }}>
                Prevents GPU VRAM out-of-memory errors on older cards.
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Default Quality Profiles */}
        <div
          style={{
            background: 'rgba(5, 8, 17, 0.75)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers size={16} color="var(--gold-primary)" />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--gold-light)' }}>
              DEFAULT QUALITY PROFILES
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {/* Default Denoise */}
            <div>
              <label style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Default Denoise Level
              </label>
              <select
                value={settings.defaultDenoise}
                onChange={(e) =>
                  setSettings({ ...settings, defaultDenoise: parseInt(e.target.value, 10) as any })
                }
                style={{
                  width: '100%',
                  background: 'rgba(10, 17, 32, 0.9)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 6,
                  color: 'var(--text-primary)',
                  padding: '7px 10px',
                  fontSize: '0.78rem',
                  outline: 'none',
                }}
              >
                {DENOISE_OPTIONS.map((opt) => (
                  <option key={opt.level} value={opt.level}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Default Resolution */}
            <div>
              <label style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Default Resolution Scale
              </label>
              <select
                value={settings.defaultScale}
                onChange={(e) => setSettings({ ...settings, defaultScale: e.target.value as any })}
                style={{
                  width: '100%',
                  background: 'rgba(10, 17, 32, 0.9)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 6,
                  color: 'var(--text-primary)',
                  padding: '7px 10px',
                  fontSize: '0.78rem',
                  outline: 'none',
                }}
              >
                <option value="1x">1x (Original)</option>
                <option value="2x">2x (HD)</option>
                <option value="4x">4x (UHD CU-Net)</option>
              </select>
            </div>

            {/* Default Mask Shape */}
            <div>
              <label style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Default Cutout Shape
              </label>
              <select
                value={settings.defaultMaskShape}
                onChange={(e) => setSettings({ ...settings, defaultMaskShape: e.target.value as any })}
                style={{
                  width: '100%',
                  background: 'rgba(10, 17, 32, 0.9)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 6,
                  color: 'var(--text-primary)',
                  padding: '7px 10px',
                  fontSize: '0.78rem',
                  outline: 'none',
                }}
              >
                <option value="square">Standard Square</option>
                <option value="circle">Circular Alpha Mask</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Full Offline Pre-Caching */}
        <div
          style={{
            background: 'rgba(5, 8, 17, 0.75)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <DownloadCloud size={16} color="var(--hextech-blue)" />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#99f6e4' }}>
                FULL OFFLINE ASSET PRE-CACHE (v{currentVersion})
              </span>
            </div>

            <button
              onClick={handleStartPrecache}
              disabled={precaching}
              className="btn-hextech btn-blue"
              style={{ fontSize: '0.75rem', padding: '5px 12px' }}
            >
              {precaching ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <DownloadCloud size={13} />
              )}
              {precaching ? 'Pre-caching Assets...' : 'Download All Originals'}
            </button>
          </div>

          <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>
            Downloads every champion, item, summoner spell, and ability icon to local disk so you can work offline in Premiere Pro without network latency.
          </span>

          {/* Progress Bar */}
          {precacheProgress && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.70rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {precacheProgress.currentName}
                </span>
                <span style={{ color: 'var(--gold-light)', fontWeight: 700 }}>
                  {precacheProgress.completed} / {precacheProgress.total} ({percent}%)
                </span>
              </div>
              <div
                style={{
                  height: 6,
                  width: '100%',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: 3,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${percent}%`,
                    background: 'linear-gradient(90deg, #0ac8b9 0%, #c8aa6e 100%)',
                    transition: 'width 0.2s ease',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Section 4: Cache Management */}
        <div
          style={{
            background: 'rgba(5, 8, 17, 0.75)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <HardDrive size={18} color="var(--gold-primary)" />
            <div>
              <div style={{ fontSize: '0.80rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Disk Cache: {cacheStats?.formattedSize || '0 B'}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                {cacheStats?.originalCount || 0} originals &bull; {cacheStats?.upscaledCount || 0} upscaled
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onOpenCacheFolder}
              className="btn-hextech"
              style={{ fontSize: '0.75rem', padding: '5px 12px' }}
            >
              <FolderOpen size={13} /> Open Folder
            </button>
            <button
              onClick={handleClear}
              disabled={clearingCache}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #ef4444',
                color: '#f87171',
                padding: '5px 12px',
                borderRadius: 6,
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Trash2 size={13} /> {clearingCache ? 'Purging...' : 'Purge Upscales'}
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 8,
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            {savedSuccess && (
              <span style={{ fontSize: '0.74rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={14} /> Preferences saved successfully
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-hextech btn-blue"
              style={{ padding: '8px 18px', fontSize: '0.82rem' }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save Preferences
            </button>
            <button onClick={onClose} className="btn-hextech" style={{ fontSize: '0.82rem' }}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
