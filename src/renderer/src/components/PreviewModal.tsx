import React, { useEffect, useState, useRef } from 'react';
import {
  AnyAsset,
  ResolutionScale,
  DenoiseLevel,
  MaskShape,
  FrameStyle,
  AbilityAsset,
  ChampionAsset,
  RuneAsset,
  SkinAsset,
  RenderAsset,
} from '@shared/types';
import { DENOISE_OPTIONS, FRAME_STYLES } from '@shared/constants';
import {
  X,
  Zap,
  Move,
  ShieldCheck,
  Sparkles,
  Loader2,
  Copy,
  Check,
  Circle,
  Square,
  ArrowLeft,
  Flame,
  ChevronsLeftRight,
  Columns2,
  Image as ImageIcon,
  Tag,
  Scissors,
  Search,
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

  // Champion sub-navigation: Abilities vs Skins vs Transparent Renders
  const [champTab, setChampTab] = useState<'abilities' | 'skins' | 'renders'>('abilities');
  const [abilities, setAbilities] = useState<AbilityAsset[]>([]);
  const [skins, setSkins] = useState<SkinAsset[]>([]);
  const [renders, setRenders] = useState<RenderAsset[]>([]);
  const [loadingAbilities, setLoadingAbilities] = useState(false);
  const [loadingSkins, setLoadingSkins] = useState(false);
  const [loadingRenders, setLoadingRenders] = useState(false);
  const [skinViewType, setSkinViewType] = useState<'splash' | 'loading'>('splash');

  // Scale selected inside modal (allows selecting 1x, 2x, or 4x inside the modal)
  const [selectedScale, setSelectedScale] = useState<ResolutionScale>(scale || '4x');
  const [selectedDenoise, setSelectedDenoise] = useState<DenoiseLevel>(3);
  const [maskShape, setMaskShape] = useState<MaskShape>('square');
  const [frameStyle, setFrameStyle] = useState<FrameStyle>('none');
  const [stampBadge, setStampBadge] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [cachedFilePath, setCachedFilePath] = useState<string | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Gallery search queries
  const [skinSearch, setSkinSearch] = useState('');
  const [renderSearch, setRenderSearch] = useState('');

  // Before / After Comparison mode & Split slider
  const [viewMode, setViewMode] = useState<'split' | 'side_by_side'>('split');
  const [splitPos, setSplitPos] = useState<number>(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState<boolean>(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Sync scale when modal opens
  useEffect(() => {
    if (scale) setSelectedScale(scale);
  }, [scale]);

  // Sync initial asset when modal opens
  useEffect(() => {
    setActiveAsset(asset);
    if (asset?.type === 'champion') {
      setParentChampion(asset as ChampionAsset);
      setChampTab('abilities');
    } else {
      setParentChampion(null);
    }
  }, [asset]);

  // Load champion abilities, skins, and transparent character renders
  useEffect(() => {
    const champ = parentChampion || (activeAsset?.type === 'champion' ? (activeAsset as ChampionAsset) : null);
    if (!champ) return;
    let isSubscribed = true;

    async function loadChampData() {
      setLoadingAbilities(true);
      setLoadingSkins(true);
      setLoadingRenders(true);
      try {
        const [abList, skinList, renderList] = await Promise.all([
          window.electronAPI.getChampionAbilities(currentVersion, champ!.id),
          window.electronAPI.getChampionSkins(currentVersion, champ!.id),
          window.electronAPI.getChampionRenders(currentVersion, champ!.id),
        ]);
        if (isSubscribed) {
          setAbilities(abList);
          setSkins(skinList);
          setRenders(renderList);

          // If currently focused on generic champion icon, switch activeAsset to the first sub-item
          if (activeAsset?.type === 'champion') {
            if (champTab === 'abilities' && abList.length > 0) {
              setActiveAsset(abList[0]);
            } else if (champTab === 'skins' && skinList.length > 0) {
              setActiveAsset({
                ...skinList[0],
                cdnUrl: skinViewType === 'splash' ? skinList[0].splashUrl : skinList[0].loadingUrl,
              });
            } else if (champTab === 'renders' && renderList.length > 0) {
              setActiveAsset(renderList[0]);
            }
          }
        }
      } catch (err) {
        console.error('Failed loading champion abilities, skins, or renders:', err);
      } finally {
        if (isSubscribed) {
          setLoadingAbilities(false);
          setLoadingSkins(false);
          setLoadingRenders(false);
        }
      }
    }

    loadChampData();
    return () => {
      isSubscribed = false;
    };
  }, [parentChampion, currentVersion]);

  // Sub-tab switching handler that updates activeAsset to the first item of that tab
  const handleTabChange = (newTab: 'abilities' | 'skins' | 'renders') => {
    setChampTab(newTab);
    if (newTab === 'abilities' && abilities.length > 0) {
      if (activeAsset?.type !== 'ability') {
        setActiveAsset(abilities[0]);
      }
    } else if (newTab === 'skins' && skins.length > 0) {
      if (activeAsset?.type !== 'skin') {
        const first = skins[0];
        setActiveAsset({
          ...first,
          cdnUrl: skinViewType === 'splash' ? first.splashUrl : first.loadingUrl,
        });
      }
    } else if (newTab === 'renders' && renders.length > 0) {
      if (activeAsset?.type !== 'render') {
        setActiveAsset(renders[0]);
      }
    }
  };

  // Keyboard navigation & shortcuts
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        handleCopy();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, cachedFilePath, activeAsset, selectedScale]);

  // Slider dragging handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingSlider || !sliderRef.current) return;
      const rect = sliderRef.current.getBoundingClientRect();
      const pct = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
      setSplitPos(pct);
    };

    const handleMouseUp = () => {
      setIsDraggingSlider(false);
    };

    if (isDraggingSlider) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSlider]);

  const getBadgeText = () => {
    if (!activeAsset) return undefined;
    if (activeAsset.type === 'ability') {
      const slot = (activeAsset as AbilityAsset).slot;
      return slot === 'Passive' ? 'P' : slot;
    }
    if (activeAsset.type === 'item') {
      const gold = (activeAsset as any).goldTotal;
      return gold !== undefined ? `${gold}g` : undefined;
    }
    return undefined;
  };

  // Check if current combination exists in cache on disk
  useEffect(() => {
    if (!activeAsset) return;
    let active = true;

    async function checkExistingUpscale() {
      // 1x scale without modifications is always ready
      if (selectedScale === '1x' && maskShape === 'square' && frameStyle === 'none' && !stampBadge) {
        setPreviewDataUrl(activeAsset!.cdnUrl);
        setCachedFilePath(null);
        setIsCached(true);
        return;
      }

      try {
        const res = await window.electronAPI.getUpscaleInfo({
          assetId: activeAsset!.id,
          assetType: activeAsset!.type,
          scale: selectedScale,
          noiseLevel: selectedDenoise,
          maskShape,
          frameStyle,
          stampBadge,
          badgeText: getBadgeText(),
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
  }, [activeAsset, selectedDenoise, selectedScale, maskShape, frameStyle, stampBadge]);

  if (!activeAsset) return null;

  const isChamp = activeAsset.type === 'champion';
  const isAbility = activeAsset.type === 'ability';
  const isSummoner = activeAsset.type === 'summoner';
  const isRune = activeAsset.type === 'rune';
  const isSkin = activeAsset.type === 'skin';
  const isRender = activeAsset.type === 'render';

  const isWideSplash = isSkin && skinViewType === 'splash';

  // Base dimensions calculation
  const getDims = () => {
    if (isWideSplash) {
      const orig = '1215 × 717 px';
      if (selectedScale === '1x') return { orig, upscaled: '1215 × 717 px (Original)' };
      if (selectedScale === '2x') return { orig, upscaled: '2430 × 1434 px (2x HD)' };
      return { orig, upscaled: '4860 × 2868 px (4x UHD Ready)' };
    }
    if (isSkin && skinViewType === 'loading') {
      const orig = '308 × 560 px';
      if (selectedScale === '1x') return { orig, upscaled: '308 × 560 px (Original)' };
      if (selectedScale === '2x') return { orig, upscaled: '616 × 1120 px (2x HD)' };
      return { orig, upscaled: '1232 × 2240 px (4x UHD)' };
    }
    if (isRender) {
      const orig = '270 × 303 px';
      if (selectedScale === '1x') return { orig, upscaled: '270 × 303 px (Original Cutout)' };
      if (selectedScale === '2x') return { orig, upscaled: '540 × 606 px (2x HD)' };
      return { orig, upscaled: '1080 × 1212 px (4x UHD Cutout)' };
    }
    if (isChamp) {
      const orig = '128 × 128 px';
      if (selectedScale === '1x') return { orig, upscaled: '128 × 128 px (Original)' };
      if (selectedScale === '2x') return { orig, upscaled: '256 × 256 px (2x HD)' };
      return { orig, upscaled: '512 × 512 px (4x UHD)' };
    }
    const orig = '64 × 64 px';
    if (selectedScale === '1x') return { orig, upscaled: '64 × 64 px (Original)' };
    if (selectedScale === '2x') return { orig, upscaled: '128 × 128 px (2x HD)' };
    return { orig, upscaled: '256 × 256 px (4x UHD)' };
  };

  const dims = getDims();

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await window.electronAPI.generateUpscale({
        assetId: activeAsset.id,
        assetType: activeAsset.type,
        scale: selectedScale,
        noiseLevel: selectedDenoise,
        maskShape,
        frameStyle,
        stampBadge,
        badgeText: getBadgeText(),
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
          scale: selectedScale,
          noiseLevel: selectedDenoise,
          maskShape,
          frameStyle,
          stampBadge,
          badgeText: getBadgeText(),
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

  const handleDragFromModal = (e: React.DragEvent, forceOriginal: boolean = false) => {
    e.preventDefault();
    const scaleToUse: ResolutionScale = forceOriginal || selectedScale === '1x' ? '1x' : selectedScale;
    window.electronAPI.startDrag({
      assetId: activeAsset.id,
      assetType: activeAsset.type,
      scale: scaleToUse,
      noiseLevel: selectedDenoise,
      maskShape: forceOriginal ? 'square' : maskShape,
      frameStyle: forceOriginal ? 'none' : frameStyle,
      stampBadge: forceOriginal ? false : stampBadge,
      badgeText: forceOriginal ? undefined : getBadgeText(),
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
    if (isRune) {
      const rn = activeAsset as RuneAsset;
      return `${rn.treeName} Tree &bull; ${rn.slotType === 'keystone' ? 'Keystone Perk' : 'Minor Rune'}`;
    }
    if (isSkin) {
      const sk = activeAsset as SkinAsset;
      return `${sk.championId} Skin &bull; ${skinViewType === 'splash' ? 'Full 16:9 Splash Art' : 'Loading Screen Card'}`;
    }
    if (isRender) {
      const rn = activeAsset as RenderAsset;
      return `${rn.championId} &bull; ${rn.skinName || 'Character Cutout'} &bull; Transparent Alpha PNG`;
    }
    return `Item Cost: ${(activeAsset as any).goldTotal || 0} Gold`;
  };

  // Filtered skins & renders for search inputs
  const filteredSkins = skins.filter((sk) => {
    if (!skinSearch.trim()) return true;
    return sk.name.toLowerCase().includes(skinSearch.toLowerCase());
  });

  const filteredRenders = renders.filter((rn) => {
    if (!renderSearch.trim()) return true;
    const q = renderSearch.toLowerCase();
    return (rn.skinName && rn.skinName.toLowerCase().includes(q)) || rn.name.toLowerCase().includes(q);
  });

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
          maxWidth: isWideSplash ? 940 : 880,
          maxHeight: '94vh',
          borderRadius: 12,
          padding: 20,
          border: '1px solid var(--gold-primary)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.85), 0 0 30px rgba(200, 170, 110, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          overflowY: 'auto',
          transition: 'max-width 0.2s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {(isAbility || isSkin || isRender) && parentChampion && (
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

        {/* Champion Sub-Navigation: Abilities vs Skins vs Transparent Renders */}
        {(isChamp || ((isAbility || isSkin || isRender) && parentChampion)) && (
          <div
            style={{
              background: 'rgba(5, 8, 17, 0.85)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {/* Tab switch row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => handleTabChange('abilities')}
                  style={{
                    background:
                      champTab === 'abilities'
                        ? 'linear-gradient(135deg, rgba(200, 170, 110, 0.3) 0%, rgba(120, 90, 40, 0.4) 100%)'
                        : 'rgba(15, 23, 42, 0.6)',
                    border:
                      champTab === 'abilities'
                        ? '1px solid var(--gold-primary)'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                    color: champTab === 'abilities' ? '#ffffff' : 'var(--text-secondary)',
                    borderRadius: 6,
                    padding: '4px 10px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <Flame size={13} color={champTab === 'abilities' ? 'var(--gold-primary)' : '#64748b'} />
                  Abilities (P, Q, W, E, R)
                </button>

                <button
                  onClick={() => handleTabChange('skins')}
                  style={{
                    background:
                      champTab === 'skins'
                        ? 'linear-gradient(135deg, rgba(200, 170, 110, 0.3) 0%, rgba(120, 90, 40, 0.4) 100%)'
                        : 'rgba(15, 23, 42, 0.6)',
                    border:
                      champTab === 'skins'
                        ? '1px solid var(--gold-primary)'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                    color: champTab === 'skins' ? '#ffffff' : 'var(--text-secondary)',
                    borderRadius: 6,
                    padding: '4px 10px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <ImageIcon size={13} color={champTab === 'skins' ? 'var(--gold-primary)' : '#64748b'} />
                  Skins & Splash Arts ({skins.length})
                </button>

                <button
                  onClick={() => handleTabChange('renders')}
                  style={{
                    background:
                      champTab === 'renders'
                        ? 'linear-gradient(135deg, rgba(200, 170, 110, 0.3) 0%, rgba(120, 90, 40, 0.4) 100%)'
                        : 'rgba(15, 23, 42, 0.6)',
                    border:
                      champTab === 'renders'
                        ? '1px solid var(--gold-primary)'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                    color: champTab === 'renders' ? '#ffffff' : 'var(--text-secondary)',
                    borderRadius: 6,
                    padding: '4px 10px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <Scissors size={13} color={champTab === 'renders' ? 'var(--gold-primary)' : '#64748b'} />
                  Transparent Renders ({renders.length})
                </button>
              </div>

              {champTab === 'skins' && (
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    onClick={() => {
                      setSkinViewType('splash');
                      if (activeAsset.type === 'skin') {
                        const sk = activeAsset as SkinAsset;
                        setActiveAsset({ ...sk, cdnUrl: sk.splashUrl });
                      }
                    }}
                    style={{
                      background: skinViewType === 'splash' ? 'var(--gold-primary)' : 'rgba(15, 23, 42, 0.8)',
                      color: skinViewType === 'splash' ? '#050811' : 'var(--text-secondary)',
                      border: '1px solid rgba(200, 170, 110, 0.3)',
                      borderRadius: 4,
                      padding: '2px 8px',
                      fontSize: '0.66rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    16:9 Splash Art
                  </button>
                  <button
                    onClick={() => {
                      setSkinViewType('loading');
                      if (activeAsset.type === 'skin') {
                        const sk = activeAsset as SkinAsset;
                        setActiveAsset({ ...sk, cdnUrl: sk.loadingUrl });
                      }
                    }}
                    style={{
                      background: skinViewType === 'loading' ? 'var(--gold-primary)' : 'rgba(15, 23, 42, 0.8)',
                      color: skinViewType === 'loading' ? '#050811' : 'var(--text-secondary)',
                      border: '1px solid rgba(200, 170, 110, 0.3)',
                      borderRadius: 4,
                      padding: '2px 8px',
                      fontSize: '0.66rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Loading Card
                  </button>
                </div>
              )}
            </div>

            {/* Sub-view Content: Abilities Strip, Skins Carousel, or Transparent Renders */}
            {champTab === 'abilities' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', padding: '2px 0' }}>
                {loadingAbilities ? (
                  <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>Loading ability manifests...</span>
                ) : (
                  abilities.map((ab) => {
                    const isSelected = activeAsset.id === ab.id;
                    return (
                      <button
                        key={ab.id}
                        onClick={() => setActiveAsset(ab)}
                        style={{
                          position: 'relative',
                          width: 44,
                          height: 44,
                          borderRadius: 6,
                          overflow: 'hidden',
                          padding: 0,
                          flexShrink: 0,
                          border: isSelected ? '2px solid var(--gold-primary)' : '1px solid rgba(200, 170, 110, 0.25)',
                          boxShadow: isSelected ? '0 0 10px rgba(200, 170, 110, 0.4)' : 'none',
                          cursor: 'pointer',
                          background: '#050811',
                          transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                          transition: 'transform 0.15s ease',
                        }}
                        title={`${ab.slot}: ${ab.name}`}
                      >
                        <img src={ab.cdnUrl} alt={ab.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <span
                          style={{
                            position: 'absolute',
                            bottom: 1,
                            right: 1,
                            background: 'rgba(5, 8, 17, 0.85)',
                            color: 'var(--gold-light)',
                            fontSize: '0.58rem',
                            fontWeight: 900,
                            padding: '0 3px',
                            borderRadius: 2,
                          }}
                        >
                          {ab.slot}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            ) : champTab === 'skins' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {/* Search Bar for Skins */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 6,
                      padding: '3px 8px',
                      width: 220,
                    }}
                  >
                    <Search size={12} color="var(--text-muted)" />
                    <input
                      value={skinSearch}
                      onChange={(e) => setSkinSearch(e.target.value)}
                      placeholder={`Search ${skins.length} skins...`}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#fff',
                        fontSize: '0.70rem',
                        outline: 'none',
                        width: '100%',
                      }}
                    />
                    {skinSearch && (
                      <button
                        onClick={() => setSkinSearch('')}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    Showing {filteredSkins.length} of {skins.length} skins
                  </span>
                </div>

                {/* Skins Scrollable Strip */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    overflowX: 'auto',
                    padding: '4px 2px',
                    maxHeight: 88,
                  }}
                >
                  {loadingSkins ? (
                    <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>Loading skin catalogue...</span>
                  ) : filteredSkins.length === 0 ? (
                    <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>No skins match "{skinSearch}"</span>
                  ) : (
                    filteredSkins.map((sk) => {
                      const isSelected = activeAsset.id === sk.id;
                      const targetUrl = skinViewType === 'splash' ? sk.splashUrl : sk.loadingUrl;
                      return (
                        <button
                          key={sk.id}
                          onClick={() => {
                            setActiveAsset({
                              ...sk,
                              cdnUrl: targetUrl,
                            });
                          }}
                          style={{
                            position: 'relative',
                            width: 120,
                            height: 68,
                            borderRadius: 6,
                            overflow: 'hidden',
                            padding: 0,
                            flexShrink: 0,
                            border: isSelected ? '2px solid var(--gold-primary)' : '1px solid rgba(200, 170, 110, 0.25)',
                            boxShadow: isSelected ? '0 0 12px rgba(200, 170, 110, 0.5)' : 'none',
                            cursor: 'pointer',
                            background: '#050811',
                            transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                            transition: 'all 0.15s ease',
                          }}
                          title={sk.name}
                        >
                          <img
                            src={sk.splashUrl}
                            alt={sk.name}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = sk.loadingUrl;
                            }}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'linear-gradient(to top, rgba(5, 8, 17, 0.95) 0%, rgba(5, 8, 17, 0.3) 50%, transparent 100%)',
                              pointerEvents: 'none',
                            }}
                          />
                          <span
                            style={{
                              position: 'absolute',
                              bottom: 2,
                              left: 4,
                              right: 4,
                              color: isSelected ? 'var(--gold-light)' : '#ffffff',
                              fontSize: '0.62rem',
                              fontWeight: 700,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              textAlign: 'left',
                            }}
                          >
                            {sk.name}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {/* Search Bar for Transparent Cutouts */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 6,
                      padding: '3px 8px',
                      width: 250,
                    }}
                  >
                    <Search size={12} color="var(--text-muted)" />
                    <input
                      value={renderSearch}
                      onChange={(e) => setRenderSearch(e.target.value)}
                      placeholder={`Search ${renders.length} transparent cutouts...`}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#fff',
                        fontSize: '0.70rem',
                        outline: 'none',
                        width: '100%',
                      }}
                    />
                    {renderSearch && (
                      <button
                        onClick={() => setRenderSearch('')}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    Showing {filteredRenders.length} of {renders.length} transparent renders
                  </span>
                </div>

                {/* Renders Scrollable Strip */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    overflowX: 'auto',
                    padding: '4px 2px',
                    maxHeight: 96,
                  }}
                >
                  {loadingRenders ? (
                    <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>Loading transparent cutouts...</span>
                  ) : filteredRenders.length === 0 ? (
                    <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>No transparent cutouts match "{renderSearch}"</span>
                  ) : (
                    filteredRenders.map((rn) => {
                      const isSelected = activeAsset.id === rn.id;
                      return (
                        <button
                          key={rn.id}
                          onClick={() => setActiveAsset(rn)}
                          style={{
                            position: 'relative',
                            width: 78,
                            height: 78,
                            borderRadius: 6,
                            overflow: 'hidden',
                            padding: 3,
                            flexShrink: 0,
                            border: isSelected ? '2px solid var(--gold-primary)' : '1px solid rgba(200, 170, 110, 0.25)',
                            boxShadow: isSelected ? '0 0 12px rgba(200, 170, 110, 0.5)' : 'none',
                            cursor: 'pointer',
                            background: 'repeating-conic-gradient(#1e293b 0% 25%, #0f172a 0% 50%) 50% / 10px 10px',
                            transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                            transition: 'all 0.15s ease',
                          }}
                          title={rn.skinName || rn.name}
                        >
                          <img
                            src={rn.cdnUrl}
                            alt={rn.name}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'linear-gradient(to top, rgba(5, 8, 17, 0.95) 0%, rgba(5, 8, 17, 0.1) 40%, transparent 100%)',
                              pointerEvents: 'none',
                            }}
                          />
                          <span
                            style={{
                              position: 'absolute',
                              bottom: 2,
                              left: 2,
                              right: 2,
                              color: isSelected ? 'var(--gold-light)' : '#ffffff',
                              fontSize: '0.54rem',
                              fontWeight: 700,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              textAlign: 'center',
                            }}
                          >
                            {rn.skinName || rn.name}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Comparison Header with Scale Switcher & View Mode Toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--gold-light)' }}>
              PREVIEW & RESOLUTION COMPARISON
            </span>
            {isCached && (
              <span
                style={{
                  background: '#10b981',
                  color: '#050811',
                  borderRadius: 4,
                  padding: '1px 6px',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                }}
              >
                READY ON DISK
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* In-Modal Scale Switcher */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                background: 'rgba(5, 8, 17, 0.9)',
                border: '1px solid var(--border-gold)',
                borderRadius: 6,
                padding: '2px 4px',
              }}
            >
              <span style={{ fontSize: '0.66rem', fontWeight: 800, color: 'var(--gold-primary)', padding: '0 4px' }}>
                SCALE:
              </span>
              {(['1x', '2x', '4x'] as ResolutionScale[]).map((sc) => {
                const isSel = selectedScale === sc;
                return (
                  <button
                    key={sc}
                    onClick={() => setSelectedScale(sc)}
                    style={{
                      background: isSel ? 'var(--gold-primary)' : 'transparent',
                      color: isSel ? '#050811' : 'var(--text-secondary)',
                      border: 'none',
                      borderRadius: 4,
                      padding: '2px 8px',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {sc === '1x' ? '1x (Original)' : sc === '2x' ? '2x HD' : '4x UHD'}
                  </button>
                );
              })}
            </div>

            {/* Split Lens vs Side-by-Side */}
            <div
              style={{
                display: 'flex',
                background: 'rgba(5, 8, 17, 0.8)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 6,
                padding: 2,
                gap: 2,
              }}
            >
              <button
                onClick={() => setViewMode('split')}
                style={{
                  background: viewMode === 'split' ? 'rgba(200, 170, 110, 0.25)' : 'transparent',
                  border: viewMode === 'split' ? '1px solid var(--gold-primary)' : '1px solid transparent',
                  color: viewMode === 'split' ? '#fff' : 'var(--text-muted)',
                  borderRadius: 4,
                  padding: '2px 8px',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <ChevronsLeftRight size={12} /> Split Lens
              </button>
              <button
                onClick={() => setViewMode('side_by_side')}
                style={{
                  background: viewMode === 'side_by_side' ? 'rgba(200, 170, 110, 0.25)' : 'transparent',
                  border: viewMode === 'side_by_side' ? '1px solid var(--gold-primary)' : '1px solid transparent',
                  color: viewMode === 'side_by_side' ? '#fff' : 'var(--text-muted)',
                  borderRadius: 4,
                  padding: '2px 8px',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Columns2 size={12} /> Side-by-Side
              </button>
            </div>
          </div>
        </div>

        {/* Visual Comparison Stage: Split Slider OR Side-by-Side */}
        {viewMode === 'split' ? (
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: isWideSplash ? 330 : isRender ? 300 : 250,
              background:
                isRender || (maskShape === 'circle' && !isWideSplash)
                  ? 'repeating-conic-gradient(#1e293b 0% 25%, #0f172a 0% 50%) 50% / 16px 16px'
                  : 'rgba(5, 8, 17, 0.95)',
              borderRadius: maskShape === 'circle' && !isWideSplash ? '50%' : 8,
              border: isCached ? '1px solid var(--gold-primary)' : '1px dashed var(--border-gold)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              userSelect: 'none',
              cursor: isDraggingSlider ? 'ew-resize' : 'default',
              boxShadow: isCached ? '0 0 25px rgba(200, 170, 110, 0.15)' : 'none',
            }}
            ref={sliderRef}
            onMouseDown={(e) => {
              setIsDraggingSlider(true);
              if (sliderRef.current) {
                const rect = sliderRef.current.getBoundingClientRect();
                const pct = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
                setSplitPos(pct);
              }
            }}
          >
            {/* Background Layer: 1x Original CDN Asset */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img
                src={activeAsset.cdnUrl}
                alt="Original 1x"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: isWideSplash ? 'cover' : 'contain',
                  imageRendering: 'pixelated',
                }}
              />
            </div>

            {/* Foreground Layer (Clipped at splitPos): Waifu2x Upscaled Art */}
            {previewDataUrl && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  clipPath: `inset(0 ${(100 - splitPos)}% 0 0)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor:
                    isRender || (maskShape === 'circle' && !isWideSplash)
                      ? 'transparent'
                      : 'rgba(5, 8, 17, 0.95)',
                }}
              >
                <img
                  src={previewDataUrl}
                  alt="Waifu2x Upscaled"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: isWideSplash ? 'cover' : 'contain',
                  }}
                />
              </div>
            )}

            {/* Draggable Divider Line & Handle */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${splitPos}%`,
                width: 2,
                backgroundColor: 'var(--gold-primary)',
                boxShadow: '0 0 10px rgba(200, 170, 110, 0.8)',
                cursor: 'ew-resize',
                zIndex: 25,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 24,
                  height: 32,
                  borderRadius: 6,
                  backgroundColor: 'var(--gold-primary)',
                  boxShadow: '0 0 12px rgba(200, 170, 110, 0.9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#050811',
                }}
              >
                <ChevronsLeftRight size={14} />
              </div>
            </div>

            {/* Corner Labels */}
            <div
              style={{
                position: 'absolute',
                top: 10,
                left: 12,
                background: 'rgba(5, 8, 17, 0.85)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 4,
                padding: '2px 8px',
                fontSize: '0.66rem',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                zIndex: 30,
              }}
            >
              ORIGINAL ({dims.orig})
            </div>

            <div
              style={{
                position: 'absolute',
                top: 10,
                right: 12,
                background: 'rgba(5, 8, 17, 0.85)',
                border: '1px solid var(--border-gold)',
                borderRadius: 4,
                padding: '2px 8px',
                fontSize: '0.66rem',
                fontWeight: 800,
                color: 'var(--gold-light)',
                zIndex: 30,
              }}
            >
              {previewDataUrl
                ? selectedScale === '1x'
                  ? `ORIGINAL VIEW (${dims.upscaled})`
                  : `WAIFU2X (${dims.upscaled})`
                : 'NOT GENERATED YET'}
            </div>

            {/* Center Hint if not generated */}
            {!previewDataUrl && !loading && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(5, 8, 17, 0.65)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  zIndex: 20,
                }}
              >
                <Sparkles size={24} color="var(--gold-primary)" />
                <span style={{ fontSize: '0.78rem', color: 'var(--gold-light)', fontWeight: 700 }}>
                  Click "Generate {selectedScale}" to unlock interactive split comparison
                </span>
              </div>
            )}

            {loading && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(5, 8, 17, 0.8)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  zIndex: 40,
                }}
              >
                <Loader2 size={28} color="var(--gold-primary)" className="animate-spin" />
                <span style={{ fontSize: '0.78rem', color: 'var(--gold-light)', fontWeight: 700 }}>
                  Inferring waifu2x CU-Net neural network ({selectedScale})...
                </span>
              </div>
            )}
          </div>
        ) : (
          /* Side-by-Side View */
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
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
                ORIGINAL CDN ({dims.orig})
              </span>
              <div
                style={{
                  width: isWideSplash ? '100%' : 160,
                  height: isWideSplash ? 160 : 160,
                  borderRadius: maskShape === 'circle' && !isWideSplash ? '50%' : 8,
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isRender
                    ? 'repeating-conic-gradient(#1e293b 0% 25%, #0f172a 0% 50%) 50% / 16px 16px'
                    : '#020408',
                }}
              >
                <img
                  src={activeAsset.cdnUrl}
                  alt="Original"
                  style={{ width: '100%', height: '100%', objectFit: isWideSplash ? 'cover' : 'contain', imageRendering: 'pixelated' }}
                />
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Source pixelation & artifacts</span>
            </div>

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
              }}
            >
              <span style={{ fontSize: '0.72rem', color: 'var(--gold-primary)', fontWeight: 800 }}>
                {selectedScale === '1x' ? '1X ORIGINAL' : `WAIFU2X ${selectedScale.toUpperCase()}`} ({dims.upscaled})
              </span>
              <div
                style={{
                  width: isWideSplash ? '100%' : 160,
                  height: isWideSplash ? 160 : 160,
                  borderRadius: maskShape === 'circle' && !isWideSplash ? '50%' : 8,
                  overflow: 'hidden',
                  border: isCached ? '1px solid var(--gold-primary)' : '1px dashed rgba(200,170,110,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isRender
                    ? 'repeating-conic-gradient(#1e293b 0% 25%, #0f172a 0% 50%) 50% / 16px 16px'
                    : '#020408',
                }}
              >
                {loading ? (
                  <Loader2 size={24} color="var(--gold-primary)" className="animate-spin" />
                ) : previewDataUrl ? (
                  <img
                    src={previewDataUrl}
                    alt="Upscaled Preview"
                    style={{ width: '100%', height: '100%', objectFit: isWideSplash ? 'cover' : 'contain' }}
                  />
                ) : (
                  <Sparkles size={20} color="var(--gold-primary)" />
                )}
              </div>
              <span style={{ fontSize: '0.68rem', color: isCached ? 'var(--gold-light)' : 'var(--text-muted)' }}>
                {isCached ? 'Ultra-sharp output' : 'Not rendered yet'}
              </span>
            </div>
          </div>
        )}

        {/* Controls: Shape, Framing Presets, Badge Stamping & Noise Reduction */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.15fr 1.15fr 1.3fr', gap: 8 }}>
          {/* Mask Shape */}
          <div
            style={{
              background: 'rgba(5, 8, 17, 0.7)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              padding: '8px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <span style={{ fontSize: '0.70rem', fontWeight: 700, color: 'var(--gold-light)' }}>
              OUTPUT SHAPE:
            </span>
            <div style={{ display: 'flex', gap: 5 }}>
              <button
                onClick={() => setMaskShape('square')}
                style={{
                  flex: 1,
                  background:
                    maskShape === 'square'
                      ? 'linear-gradient(135deg, rgba(200, 170, 110, 0.3) 0%, rgba(120, 90, 40, 0.4) 100%)'
                      : 'rgba(15, 23, 42, 0.6)',
                  border:
                    maskShape === 'square' ? '1px solid var(--gold-primary)' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: maskShape === 'square' ? '#fff' : 'var(--text-secondary)',
                  borderRadius: 6,
                  padding: '5px 4px',
                  fontSize: '0.68rem',
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
                    maskShape === 'circle' ? '1px solid var(--gold-primary)' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: maskShape === 'circle' ? '#fff' : 'var(--text-secondary)',
                  borderRadius: 6,
                  padding: '5px 4px',
                  fontSize: '0.68rem',
                  fontWeight: maskShape === 'circle' ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                }}
                title="Transparent circular alpha cutout"
              >
                <Circle size={12} /> Circle
              </button>
            </div>
          </div>

          {/* Framing & Border Presets */}
          <div
            style={{
              background: 'rgba(5, 8, 17, 0.7)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              padding: '8px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <span style={{ fontSize: '0.70rem', fontWeight: 700, color: 'var(--gold-light)' }}>
              FRAMING PRESET:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
              {FRAME_STYLES.map((fs) => {
                const active = frameStyle === fs.id;
                return (
                  <button
                    key={fs.id}
                    onClick={() => setFrameStyle(fs.id as FrameStyle)}
                    style={{
                      background: active
                        ? 'linear-gradient(135deg, rgba(200, 170, 110, 0.3) 0%, rgba(120, 90, 40, 0.4) 100%)'
                        : 'rgba(15, 23, 42, 0.6)',
                      border: active ? '1px solid var(--gold-primary)' : '1px solid rgba(255, 255, 255, 0.08)',
                      color: active ? '#fff' : 'var(--text-secondary)',
                      borderRadius: 6,
                      padding: '5px 3px',
                      fontSize: '0.66rem',
                      fontWeight: active ? 700 : 500,
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                    title={fs.desc}
                  >
                    {fs.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Corner Badge Overlay Stamping */}
          <div
            style={{
              background: 'rgba(5, 8, 17, 0.7)',
              border: stampBadge ? '1px solid var(--gold-primary)' : '1px solid var(--border-subtle)',
              borderRadius: 8,
              padding: '8px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              boxShadow: stampBadge ? '0 0 12px rgba(200, 170, 110, 0.15)' : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.70rem', fontWeight: 700, color: 'var(--gold-light)' }}>
                STAMP BADGE:
              </span>
              {getBadgeText() && (
                <span
                  style={{
                    fontSize: '0.60rem',
                    padding: '1px 5px',
                    borderRadius: 3,
                    background: stampBadge ? 'rgba(200, 170, 110, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                    color: stampBadge ? 'var(--gold-primary)' : 'var(--text-muted)',
                    fontWeight: 800,
                  }}
                >
                  {getBadgeText()}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 5 }}>
              <button
                onClick={() => setStampBadge(false)}
                style={{
                  flex: 1,
                  background:
                    !stampBadge
                      ? 'linear-gradient(135deg, rgba(200, 170, 110, 0.3) 0%, rgba(120, 90, 40, 0.4) 100%)'
                      : 'rgba(15, 23, 42, 0.6)',
                  border: !stampBadge ? '1px solid var(--gold-primary)' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: !stampBadge ? '#fff' : 'var(--text-secondary)',
                  borderRadius: 6,
                  padding: '5px 4px',
                  fontSize: '0.68rem',
                  fontWeight: !stampBadge ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                Off
              </button>
              <button
                onClick={() => setStampBadge(true)}
                style={{
                  flex: 1,
                  background:
                    stampBadge
                      ? 'linear-gradient(135deg, rgba(200, 170, 110, 0.3) 0%, rgba(120, 90, 40, 0.4) 100%)'
                      : 'rgba(15, 23, 42, 0.6)',
                  border: stampBadge ? '1px solid var(--gold-primary)' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: stampBadge ? '#fff' : 'var(--text-secondary)',
                  borderRadius: 6,
                  padding: '5px 4px',
                  fontSize: '0.68rem',
                  fontWeight: stampBadge ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 3,
                }}
                title={getBadgeText() ? `Stamp "${getBadgeText()}" badge into PNG` : 'Stamp corner badge overlay'}
              >
                <Tag size={11} /> On
              </button>
            </div>
          </div>

          {/* Denoise Level */}
          <div
            style={{
              background: 'rgba(5, 8, 17, 0.7)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              padding: '8px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <span style={{ fontSize: '0.70rem', fontWeight: 700, color: 'var(--gold-light)' }}>
              NOISE REDUCTION:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
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
                      padding: '5px 3px',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    <span style={{ fontSize: '0.68rem', fontWeight: active ? 800 : 600 }}>L{opt.level}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Controls: Instant Original Drag, Upscaled Drag, Copy, & Generate */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 8,
            borderTop: '1px solid var(--border-subtle)',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Instant Drag Original Button (Always Available & Grabbable) */}
            <div
              draggable={true}
              onDragStart={(e) => handleDragFromModal(e, true)}
              className="btn-hextech"
              style={{
                padding: '7px 14px',
                fontSize: '0.78rem',
                cursor: 'grab',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.25) 0%, rgba(14, 116, 144, 0.4) 100%)',
                borderColor: '#06b6d4',
                color: '#67e8f9',
                fontWeight: 700,
              }}
              title="Click and drag the original resolution asset directly into Premiere, DaVinci, or Photoshop instantly without waiting for upscaling"
            >
              <Move size={14} />
              ⚡ Drag Original (Instant)
            </div>

            {/* Drag Selected Scale Button */}
            {selectedScale !== '1x' && (
              <div
                draggable={isCached}
                onDragStart={(e) => handleDragFromModal(e, false)}
                className="btn-hextech"
                style={{
                  padding: '7px 14px',
                  fontSize: '0.78rem',
                  cursor: isCached ? 'grab' : 'not-allowed',
                  opacity: isCached ? 1 : 0.4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  border: isCached ? '1px solid var(--gold-primary)' : '1px solid var(--border-subtle)',
                }}
                title={
                  isCached
                    ? `Click and drag the ${selectedScale} upscaled asset into your timeline`
                    : `Please click "Generate ${selectedScale}" first to upscale this asset`
                }
              >
                <Sparkles size={14} color="var(--gold-primary)" />
                Drag {selectedScale} Upscaled
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {/* Copy to Clipboard */}
            <button
              onClick={handleCopy}
              disabled={loading}
              className="btn-hextech"
              style={{
                fontSize: '0.78rem',
                padding: '7px 12px',
                borderColor: copiedSuccess ? '#10b981' : undefined,
                color: copiedSuccess ? '#10b981' : undefined,
              }}
              title="Copy bitmap directly to Windows Clipboard (Ctrl+C)"
            >
              {copiedSuccess ? <Check size={14} /> : <Copy size={14} />}
              {copiedSuccess ? 'Copied!' : 'Copy to Clipboard'}
            </button>

            {/* Generate Button */}
            {selectedScale !== '1x' ? (
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="btn-hextech btn-blue"
                style={{ fontSize: '0.78rem', padding: '7px 14px' }}
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                {loading
                  ? 'Upscaling...'
                  : isCached
                  ? `Re-render ${selectedScale}`
                  : `Generate ${selectedScale}`}
              </button>
            ) : (
              (maskShape !== 'square' || frameStyle !== 'none' || stampBadge) && (
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="btn-hextech btn-blue"
                  style={{ fontSize: '0.78rem', padding: '7px 14px' }}
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                  {loading ? 'Processing...' : 'Apply Framing & Mask'}
                </button>
              )
            )}

            <button onClick={onClose} className="btn-hextech" style={{ fontSize: '0.78rem', padding: '7px 14px' }}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
