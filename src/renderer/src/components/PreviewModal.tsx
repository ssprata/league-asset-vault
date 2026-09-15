import React, { useEffect, useState } from 'react';
import {
  AnyAsset,
  ResolutionScale,
  DenoiseLevel,
  MaskShape,
  AbilityAsset,
  ChampionAsset,
} from '@shared/types';
import { DENOISE_OPTIONS } from '@shared/constants';
import {
  X,
  Zap,
  Move,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Loader2,
  Copy,
  Check,
  Circle,
  Square,
  ArrowLeft,
  Flame,
} from 'lucide-react';

interface PreviewModalProps {
  asset: AnyAsset | null;
  onClose: () => void;
  scale: ResolutionScale;
  currentVersion: string;
  onUpscaleDone?: () => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  asset,
  onClose,
  scale,
  currentVersion,
  onUpscaleDone,
}) => {
  const [activeAsset, setActiveAsset] = useState<AnyAsset | null>(asset);
  const [parentChampion, setParentChampion] = useState<ChampionAsset | null>(null);
  const [abilities, setAbilities] = useState<AbilityAsset[]>([]);
  const [loadingAbilities, setLoadingAbilities] = useState(false);

  const [selectedDenoise, setSelectedDenoise] = useState<DenoiseLevel>(3);
  const [maskShape, setMaskShape] = useState<MaskShape>('square');
  const [loading, setLoading] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [cachedFilePath, setCachedFilePath] = useState<string | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  const effectiveScale: ResolutionScale = scale === '1x' ? '4x' : scale;

  // Sync initial asset when opened
  useEffect(() => {
    setActiveAsset(asset);
    if (asset?.type === 'champion') {
      setParentChampion(asset as ChampionAsset);
    } else {
      setParentChampion(null);
    }
  }, [asset]);

  // Load champion abilities when activeAsset is a champion
  useEffect(() => {
    if (!activeAsset || activeAsset.type !== 'champion') return;
    let isSubscribed = true;

    async function loadAbilities() {
      setLoadingAbilities(true);
      try {
        const list = await window.electronAPI.getChampionAbilities(
          currentVersion,
          activeAsset!.id
        );
        if (isSubscribed) {
          setAbilities(list);
        }
      } catch (err) {
        console.error('Failed loading champion abilities:', err);
      } finally {
        if (isSubscribed) setLoadingAbilities(false);
      }
    }

    loadAbilities();
    return () => {
      isSubscribed = false;
    };
  }, [activeAsset, currentVersion]);

  // Keyboard navigation & shortcuts
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        // Direct Ctrl+C to copy image to clipboard
        if (cachedFilePath) {
          e.preventDefault();
          handleCopy();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, cachedFilePath]);

  // Check if current combination exists in cache on disk
  useEffect(() => {
    if (!activeAsset) return;
    let active = true;

    async function checkExistingUpscale() {
      try {
        const res = await window.electronAPI.getUpscaleInfo({
          assetId: activeAsset!.id,
          assetType: activeAsset!.type,
          scale: effectiveScale,
          noiseLevel: selectedDenoise,
          maskShape,
          imageFileName: activeAsset!.imageFileName,
          cdnUrl: activeAsset!.cdnUrl,
        });

        if (!active) return;
        if (res.success && res.dataUrl) {
          setPreviewDataUrl(res.dataUrl);
          setCachedFilePath(res.filePath);
          setIsCached(true);
        } else {
          setPreviewDataUrl(null);
          setCachedFilePath(null);
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
  }, [activeAsset, selectedDenoise, effectiveScale, maskShape]);

  if (!activeAsset) return null;

  const isChamp = activeAsset.type === 'champion';
  const isAbility = activeAsset.type === 'ability';
  const isSummoner = activeAsset.type === 'summoner';

  const origDims = isChamp ? '128 × 128 px' : '64 × 64 px';
  const targetMultiplier = effectiveScale === '4x' ? 4 : 2;
  const baseDim = isChamp ? 128 : 64;
  const upscaledDims = `${baseDim * targetMultiplier} × ${baseDim * targetMultiplier} px (${effectiveScale} UHD)`;

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await window.electronAPI.generateUpscale({
        assetId: activeAsset.id,
        assetType: activeAsset.type,
        scale: effectiveScale,
        noiseLevel: selectedDenoise,
        maskShape,
        imageFileName: activeAsset.imageFileName,
        cdnUrl: activeAsset.cdnUrl,
      });

      if (res.success && res.dataUrl) {
        setPreviewDataUrl(res.dataUrl);
        setCachedFilePath(res.filePath);
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

  const handleCopy = async () => {
    try {
      let targetPath = cachedFilePath;
      if (!targetPath) {
        setLoading(true);
        const res = await window.electronAPI.generateUpscale({
          assetId: activeAsset.id,
          assetType: activeAsset.type,
          scale: effectiveScale,
          noiseLevel: selectedDenoise,
          maskShape,
          imageFileName: activeAsset.imageFileName,
          cdnUrl: activeAsset.cdnUrl,
        });
        targetPath = res.filePath;
        setPreviewDataUrl(res.dataUrl);
        setCachedFilePath(res.filePath);
        setIsCached(true);
        setLoading(false);
      }

      if (targetPath) {
        const result = await window.electronAPI.copyImageToClipboard(targetPath);
        if (result.success) {
          setCopiedSuccess(true);
          setTimeout(() => setCopiedSuccess(false), 2000);
        }
      }
    } catch (err) {
      console.error('Copy to clipboard failed:', err);
      setLoading(false);
    }
  };

  const handleDragFromModal = (e: React.DragEvent) => {
    e.preventDefault();
    window.electronAPI.startDrag({
      assetId: activeAsset.id,
      assetType: activeAsset.type,
      scale: effectiveScale,
      noiseLevel: selectedDenoise,
      maskShape,
      imageFileName: activeAsset.imageFileName,
      cdnUrl: activeAsset.cdnUrl,
    });
  };

  const getSubtitle = () => {
    if (isChamp) return (activeAsset as ChampionAsset).title;
    if (isAbility) {
      const ab = activeAsset as AbilityAsset;
      return `${ab.championId} &bull; [${ab.slot}] Ability`;
    }
    if (isSummoner) return 'Summoner Spell';
    return `Item Cost: ${(activeAsset as any).goldTotal || 0} Gold`;
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
          maxWidth: 780,
          maxHeight: '94vh',
          borderRadius: 12,
          padding: 22,
          border: '1px solid var(--gold-primary)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.85), 0 0 30px rgba(200, 170, 110, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {isAbility && parentChampion && (
                <button
                  onClick={() => setActiveAsset(parentChampion)}
                  className="btn-hextech"
                  style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                  title={`Return to ${parentChampion.name}`}
                >
                  <ArrowLeft size={13} /> {parentChampion.name}
                </button>
              )}

              <h2 className="title-hextech" style={{ fontSize: '1.35rem', fontWeight: 800 }}>
                {activeAsset.name}
              </h2>

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
                title="waifu2x-ncnn-vulkan models-cunet"
              >
                <ShieldCheck size={12} color="var(--gold-primary)" />
                Artwork CU-Net
              </span>
            </div>
            <div
              style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}
              dangerouslySetInnerHTML={{ __html: getSubtitle() }}
            />
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

        {/* Champion Abilities Strip (Passive, Q, W, E, R) */}
        {(isChamp || (isAbility && parentChampion)) && (
          <div
            style={{
              background: 'rgba(5, 8, 17, 0.85)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Flame size={14} color="var(--gold-primary)" />
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--gold-light)' }}>
                SPELLS & ABILITIES:
              </span>
            </div>

            {loadingAbilities ? (
              <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>
                Loading ability manifests...
              </span>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {abilities.map((ab) => {
                  const isSelected = activeAsset.id === ab.id;
                  return (
                    <button
                      key={ab.id}
                      onClick={() => setActiveAsset(ab)}
                      style={{
                        position: 'relative',
                        width: 38,
                        height: 38,
                        borderRadius: 6,
                        overflow: 'hidden',
                        padding: 0,
                        border: isSelected
                          ? '2px solid var(--gold-primary)'
                          : '1px solid rgba(200, 170, 110, 0.25)',
                        boxShadow: isSelected
                          ? '0 0 10px rgba(200, 170, 110, 0.4)'
                          : 'none',
                        cursor: 'pointer',
                        background: '#050811',
                        transition: 'transform 0.15s ease',
                        transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                      }}
                      title={`${ab.slot}: ${ab.name}`}
                    >
                      <img
                        src={ab.cdnUrl}
                        alt={ab.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          bottom: 1,
                          right: 1,
                          background: 'rgba(5, 8, 17, 0.85)',
                          color: 'var(--gold-light)',
                          fontSize: '0.55rem',
                          fontWeight: 900,
                          padding: '0 2px',
                          borderRadius: 2,
                        }}
                      >
                        {ab.slot}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Side-by-Side Comparison */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
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
                width: 140,
                height: 140,
                borderRadius: maskShape === 'circle' ? '50%' : 8,
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#020408',
                background:
                  maskShape === 'circle'
                    ? 'repeating-conic-gradient(#1e293b 0% 25%, #0f172a 0% 50%) 50% / 16px 16px'
                    : '#020408',
              }}
            >
              <img
                src={activeAsset.cdnUrl}
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
                width: 140,
                height: 140,
                borderRadius: maskShape === 'circle' ? '50%' : 8,
                overflow: 'hidden',
                border: isCached ? '1px solid var(--gold-primary)' : '1px dashed rgba(200,170,110,0.3)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background:
                  maskShape === 'circle'
                    ? 'repeating-conic-gradient(#1e293b 0% 25%, #0f172a 0% 50%) 50% / 16px 16px'
                    : '#020408',
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
                  <span>Not rendered yet</span>
                </div>
              )}
            </div>

            <span
              style={{
                fontSize: '0.68rem',
                color: isCached ? 'var(--gold-light)' : 'var(--text-muted)',
              }}
            >
              {isCached
                ? `${maskShape === 'circle' ? 'Circular transparent cutout' : 'Vector-smooth artwork'} ready`
                : 'Click Generate below to render'}
            </span>
          </div>
        </div>

        {/* Dual Controls: Shape Cutout & Denoise Level */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
          {/* Circular Cutout Switch */}
          <div
            style={{
              background: 'rgba(5, 8, 17, 0.7)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--gold-light)' }}>
              OUTPUT SHAPE:
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => setMaskShape('square')}
                style={{
                  flex: 1,
                  background:
                    maskShape === 'square'
                      ? 'linear-gradient(135deg, rgba(200, 170, 110, 0.3) 0%, rgba(120, 90, 40, 0.4) 100%)'
                      : 'rgba(15, 23, 42, 0.6)',
                  border:
                    maskShape === 'square'
                      ? '1px solid var(--gold-primary)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                  color: maskShape === 'square' ? '#fff' : 'var(--text-secondary)',
                  borderRadius: 6,
                  padding: '6px 4px',
                  fontSize: '0.72rem',
                  fontWeight: maskShape === 'square' ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                }}
              >
                <Square size={12} /> Square
              </button>

              <button
                onClick={() => setMaskShape('circle')}
                style={{
                  flex: 1,
                  background:
                    maskShape === 'circle'
                      ? 'linear-gradient(135deg, rgba(200, 170, 110, 0.3) 0%, rgba(120, 90, 40, 0.4) 100%)'
                      : 'rgba(15, 23, 42, 0.6)',
                  border:
                    maskShape === 'circle'
                      ? '1px solid var(--gold-primary)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                  color: maskShape === 'circle' ? '#fff' : 'var(--text-secondary)',
                  borderRadius: 6,
                  padding: '6px 4px',
                  fontSize: '0.72rem',
                  fontWeight: maskShape === 'circle' ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                }}
                title="Generates anti-aliased circular alpha mask with transparent background"
              >
                <Circle size={12} /> Circle
              </button>
            </div>
            <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
              {maskShape === 'circle' ? 'Transparent alpha cutout for stream overlays' : 'Original standard boundary'}
            </span>
          </div>

          {/* Denoise Level Selector */}
          <div
            style={{
              background: 'rgba(5, 8, 17, 0.7)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--gold-light)' }}>
                NOISE REDUCTION:
              </span>
              <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                Level 3 removes small icon JPEG artifacts
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
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
                      border: active
                        ? '1px solid var(--gold-primary)'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                      color: active ? '#ffffff' : 'var(--text-secondary)',
                      borderRadius: 6,
                      padding: '6px 4px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    <span style={{ fontSize: '0.72rem', fontWeight: active ? 800 : 600 }}>
                      Level {opt.level}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Controls: Clipboard Copy, Drag, & Generate */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 8,
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          {/* Drag to Timeline Callout */}
          <div
            draggable={isCached}
            onDragStart={handleDragFromModal}
            className="btn-hextech"
            style={{
              padding: '8px 16px',
              fontSize: '0.82rem',
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
                : 'Please generate this upscale first before dragging'
            }
          >
            <Move size={15} />
            Drag {effectiveScale} to Timeline
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {/* Copy to Clipboard */}
            <button
              onClick={handleCopy}
              disabled={loading}
              className="btn-hextech"
              style={{
                fontSize: '0.80rem',
                padding: '8px 14px',
                borderColor: copiedSuccess ? '#10b981' : undefined,
                color: copiedSuccess ? '#10b981' : undefined,
              }}
              title="Copy native uncompressed bitmap directly to Windows Clipboard (Ctrl+C)"
            >
              {copiedSuccess ? <Check size={14} /> : <Copy size={14} />}
              {copiedSuccess ? 'Copied to Clipboard!' : 'Copy to Clipboard (Ctrl+C)'}
            </button>

            {/* Generate / Re-generate Button */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="btn-hextech btn-blue"
              style={{ fontSize: '0.80rem', padding: '8px 16px' }}
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Zap size={14} />
              )}
              {loading
                ? 'Processing...'
                : isCached
                ? `Re-render (${maskShape})`
                : `Generate ${effectiveScale} (${maskShape})`}
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
