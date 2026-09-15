import React, { useEffect, useState } from 'react';
import { AnyAsset, ResolutionScale, DenoiseLevel } from '@shared/types';
import { DENOISE_OPTIONS } from '@shared/constants';
import { X, Zap, Move, CheckCircle2, ShieldCheck, Sparkles, Loader2, Info } from 'lucide-react';

interface PreviewModalProps {
  asset: AnyAsset | null;
  onClose: () => void;
  scale: ResolutionScale;
  onUpscaleDone?: () => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  asset,
  onClose,
  scale,
  onUpscaleDone,
}) => {
  const [selectedDenoise, setSelectedDenoise] = useState<DenoiseLevel>(3);
  const [loading, setLoading] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);

  const effectiveScale: ResolutionScale = scale === '1x' ? '4x' : scale;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Check if the currently selected scale & denoise level exists on disk
  useEffect(() => {
    if (!asset) return;
    let active = true;

    async function checkExistingUpscale() {
      try {
        const res = await window.electronAPI.getUpscaleInfo({
          assetId: asset!.id,
          assetType: asset!.type,
          scale: effectiveScale,
          noiseLevel: selectedDenoise,
        });

        if (!active) return;
        if (res.success && res.dataUrl) {
          setPreviewDataUrl(res.dataUrl);
          setIsCached(true);
        } else {
          setPreviewDataUrl(null);
          setIsCached(false);
        }
      } catch (err) {
        console.error('Failed checking upscale cache:', err);
      }
    }

    checkExistingUpscale();
    return () => {
      active = false;
    };
  }, [asset, selectedDenoise, effectiveScale]);

  if (!asset) return null;

  const isChamp = asset.type === 'champion';
  const origDims = isChamp ? '128 × 128 px' : '64 × 64 px';
  const targetMultiplier = effectiveScale === '4x' ? 4 : 2;
  const baseDim = isChamp ? 128 : 64;
  const upscaledDims = `${baseDim * targetMultiplier} × ${baseDim * targetMultiplier} px (${effectiveScale} UHD)`;

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await window.electronAPI.generateUpscale({
        assetId: asset.id,
        assetType: asset.type,
        scale: effectiveScale,
        noiseLevel: selectedDenoise,
      });

      if (res.success && res.dataUrl) {
        setPreviewDataUrl(res.dataUrl);
        setIsCached(true);
        if (onUpscaleDone) {
          onUpscaleDone();
        }
      }
    } catch (err) {
      console.error('Upscale generation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDragFromModal = (e: React.DragEvent) => {
    e.preventDefault();
    window.electronAPI.startDrag({
      assetId: asset.id,
      assetType: asset.type,
      scale: effectiveScale,
      noiseLevel: selectedDenoise,
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 6, 12, 0.88)',
        backdropFilter: 'blur(12px)',
        zIndex: 100,
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
          maxWidth: 720,
          borderRadius: 12,
          padding: 24,
          border: '1px solid var(--gold-primary)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.85), 0 0 30px rgba(200, 170, 110, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 className="title-hextech" style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                {asset.name}
              </h2>
              {/* Locked Model Style Badge */}
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'rgba(200, 170, 110, 0.15)',
                  border: '1px solid var(--border-gold)',
                  borderRadius: 6,
                  padding: '2px 8px',
                  fontSize: '0.68rem',
                  color: 'var(--gold-light)',
                  fontWeight: 700,
                }}
                title="Model permanently locked to models-cunet for vector illustration line clarity"
              >
                <ShieldCheck size={12} color="var(--gold-primary)" />
                Artwork CU-Net (Locked)
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
              {isChamp ? asset.title : `Item Cost: ${asset.goldTotal} Gold`}
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

        {/* Side-by-Side Comparison */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* 1x Original CDN Asset */}
          <div
            style={{
              background: 'rgba(5, 8, 17, 0.8)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>
              ORIGINAL CDN ({origDims})
            </span>
            <div
              style={{
                width: 150,
                height: 150,
                borderRadius: 8,
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#020408',
              }}
            >
              <img
                src={asset.cdnUrl}
                alt="Original"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              Standard compression artifacts
            </span>
          </div>

          {/* Waifu2x Super-Resolution Result */}
          <div
            style={{
              background: 'rgba(10, 18, 36, 0.85)',
              border: isCached ? '1px solid var(--gold-primary)' : '1px solid var(--border-subtle)',
              borderRadius: 8,
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              boxShadow: isCached ? '0 0 20px rgba(200, 170, 110, 0.15)' : 'none',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--gold-primary)', fontWeight: 800 }}>
                WAIFU2X CU-NET ({upscaledDims})
              </span>
              {isCached && (
                <span
                  style={{
                    background: '#10b981',
                    color: '#050811',
                    borderRadius: 4,
                    padding: '1px 5px',
                    fontSize: '0.62rem',
                    fontWeight: 800,
                  }}
                >
                  READY
                </span>
              )}
            </div>

            <div
              style={{
                width: 150,
                height: 150,
                borderRadius: 8,
                overflow: 'hidden',
                border: isCached ? '1px solid var(--gold-primary)' : '1px dashed rgba(200,170,110,0.3)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#020408',
                position: 'relative',
              }}
            >
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <Loader2 size={24} color="var(--gold-primary)" className="animate-spin" />
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                    Inferring CU-Net...
                  </span>
                </div>
              ) : previewDataUrl ? (
                <img
                  src={previewDataUrl}
                  alt="Waifu2x Upscaled"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                <div
                  style={{
                    padding: 12,
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.70rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Sparkles size={20} color="var(--gold-primary)" />
                  <span>Noise {selectedDenoise} not yet rendered</span>
                </div>
              )}
            </div>

            <span style={{ fontSize: '0.68rem', color: isCached ? 'var(--gold-light)' : 'var(--text-muted)' }}>
              {isCached ? 'Neural vector smoothing applied' : 'Click Generate below to process'}
            </span>
          </div>
        </div>

        {/* Denoise Level Selector */}
        <div
          style={{
            background: 'rgba(5, 8, 17, 0.7)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            padding: '10px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--gold-light)' }}>
              NOISE REDUCTION LEVEL:
            </span>
            <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>
              Higher values eliminate JPEG artifacts from small icons
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {DENOISE_OPTIONS.map((opt) => {
              const active = selectedDenoise === opt.level;
              return (
                <button
                  key={opt.level}
                  onClick={() => setSelectedDenoise(opt.level as DenoiseLevel)}
                  disabled={loading}
                  style={{
                    background: active
                      ? 'linear-gradient(135deg, rgba(200, 170, 110, 0.3) 0%, rgba(120, 90, 40, 0.4) 100%)'
                      : 'rgba(15, 23, 42, 0.6)',
                    border: active ? '1px solid var(--gold-primary)' : '1px solid rgba(255, 255, 255, 0.08)',
                    color: active ? '#ffffff' : 'var(--text-secondary)',
                    borderRadius: 6,
                    padding: '8px 10px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ fontSize: '0.78rem', fontWeight: active ? 800 : 600 }}>
                    {opt.label}
                  </span>
                  <span style={{ fontSize: '0.64rem', color: active ? 'var(--gold-light)' : 'var(--text-muted)', textAlign: 'center' }}>
                    {opt.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Controls & Drag Callout */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 8,
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <div
            draggable={isCached}
            onDragStart={handleDragFromModal}
            className="btn-hextech"
            style={{
              padding: '8px 18px',
              fontSize: '0.85rem',
              cursor: isCached ? 'grab' : 'not-allowed',
              opacity: isCached ? 1 : 0.5,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              border: isCached ? '1px solid var(--gold-primary)' : '1px solid var(--border-subtle)',
            }}
            title={
              isCached
                ? 'Click and drag directly into Premiere Pro, Photoshop, or DaVinci'
                : 'Please generate this noise level first before dragging'
            }
          >
            <Move size={16} />
            Drag {effectiveScale} (Noise {selectedDenoise}) to Timeline
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="btn-hextech btn-blue"
              style={{ fontSize: '0.82rem', padding: '8px 16px' }}
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Zap size={14} />
              )}
              {loading
                ? 'Processing waifu2x...'
                : isCached
                ? `Re-generate (${effectiveScale} / Noise ${selectedDenoise})`
                : `Generate ${effectiveScale} UHD (Noise: ${selectedDenoise})`}
            </button>

            <button onClick={onClose} className="btn-hextech" style={{ fontSize: '0.80rem' }}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
