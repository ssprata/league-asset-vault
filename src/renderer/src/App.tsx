import React, { useState, useEffect, useMemo } from 'react';
import {
  AssetType,
  ResolutionScale,
  MaskShape,
  ChampionAsset,
  ItemAsset,
  SummonerSpellAsset,
  RuneAsset,
  AnyAsset,
  CacheStats,
  UpscaleProgressPayload,
} from '@shared/types';
import { Header } from './components/Header';
import { SearchFilter } from './components/SearchFilter';
import { AssetGrid } from './components/AssetGrid';
import { PreviewModal } from './components/PreviewModal';
import { StatusBar } from './components/StatusBar';
import { QuickBin } from './components/QuickBin';
import { SettingsModal } from './components/SettingsModal';
import { Loader2 } from 'lucide-react';

const QUICKBIN_STORAGE_KEY = 'league-asset-vault:quickbin';

export const App: React.FC = () => {
  const [versions, setVersions] = useState<string[]>([]);
  const [currentVersion, setCurrentVersion] = useState<string>('');
  const [champions, setChampions] = useState<ChampionAsset[]>([]);
  const [items, setItems] = useState<ItemAsset[]>([]);
  const [summoners, setSummoners] = useState<SummonerSpellAsset[]>([]);
  const [runes, setRunes] = useState<RuneAsset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [activeTab, setActiveTab] = useState<AssetType>('champion');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [scale, setScale] = useState<ResolutionScale>('1x');
  const [maskShape, setMaskShape] = useState<MaskShape>('square');

  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [progress, setProgress] = useState<UpscaleProgressPayload | null>(null);
  const [previewAsset, setPreviewAsset] = useState<AnyAsset | null>(null);

  // Settings & QuickBin modal/tray state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isQuickBinOpen, setIsQuickBinOpen] = useState(true);
  const [pinnedAssets, setPinnedAssets] = useState<AnyAsset[]>([]);

  // Load pinned items from local storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(QUICKBIN_STORAGE_KEY);
      if (stored) {
        setPinnedAssets(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed reading quickbin from localStorage:', e);
    }
  }, []);

  // Save pinned items to local storage
  const savePinnedAssets = (newList: AnyAsset[]) => {
    setPinnedAssets(newList);
    try {
      localStorage.setItem(QUICKBIN_STORAGE_KEY, JSON.stringify(newList));
    } catch (e) {
      console.warn('Failed saving quickbin to localStorage:', e);
    }
  };

  const handleTogglePin = (asset: AnyAsset) => {
    const exists = pinnedAssets.some((p) => p.id === asset.id);
    if (exists) {
      savePinnedAssets(pinnedAssets.filter((p) => p.id !== asset.id));
    } else {
      savePinnedAssets([...pinnedAssets, asset]);
    }
  };

  const handleUnpin = (assetId: string) => {
    savePinnedAssets(pinnedAssets.filter((p) => p.id !== assetId));
  };

  const handleClearQuickBin = () => {
    savePinnedAssets([]);
  };

  const pinnedIds = useMemo(() => new Set(pinnedAssets.map((p) => p.id)), [pinnedAssets]);

  // Initialize versions and settings on startup
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);

        // Load saved app preferences
        try {
          const s = await window.electronAPI.getSettings();
          if (s.defaultScale) setScale(s.defaultScale);
          if (s.defaultMaskShape) setMaskShape(s.defaultMaskShape);
        } catch (err) {
          console.warn('Could not read default settings:', err);
        }

        const vers = await window.electronAPI.getVersions();
        setVersions(vers);
        if (vers.length > 0) {
          const latest = vers[0];
          setCurrentVersion(latest);
          await loadDataForVersion(latest);
        }
      } catch (err) {
        console.error('Failed to initialize versions:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Subscribe to upscaling progress updates from backend
  useEffect(() => {
    const unsubscribe = window.electronAPI.onUpscaleProgress((payload) => {
      setProgress(payload);
      if (payload.status === 'done' || payload.status === 'idle') {
        refreshCacheStats();
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch data for active version
  const loadDataForVersion = async (ver: string) => {
    setLoading(true);
    try {
      const [champsData, itemsData, summonersData, runesData, stats] = await Promise.all([
        window.electronAPI.getChampions(ver),
        window.electronAPI.getItems(ver),
        window.electronAPI.getSummonerSpells(ver),
        window.electronAPI.getRunes(ver),
        window.electronAPI.getCacheStats(),
      ]);
      setChampions(champsData);
      setItems(itemsData);
      setSummoners(summonersData);
      setRunes(runesData);
      setCacheStats(stats);
    } catch (err) {
      console.error('Failed loading version data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVersionChange = async (ver: string) => {
    setCurrentVersion(ver);
    await loadDataForVersion(ver);
  };

  const refreshCacheStats = async () => {
    try {
      const stats = await window.electronAPI.getCacheStats();
      setCacheStats(stats);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenCacheDir = async () => {
    await window.electronAPI.openCacheDir();
  };

  // Filtered Assets Computation
  const filteredAssets = useMemo(() => {
    let rawList: AnyAsset[] = champions;
    if (activeTab === 'item') rawList = items;
    else if (activeTab === 'summoner') rawList = summoners;
    else if (activeTab === 'rune') rawList = runes;

    const query = searchQuery.trim().toLowerCase();

    return rawList.filter((asset) => {
      // Tag filter
      if (selectedTag !== 'All') {
        if (!asset.tags || !asset.tags.includes(selectedTag)) return false;
      }

      // Search query filter
      if (!query) return true;

      const nameMatch = asset.name.toLowerCase().includes(query);
      if (nameMatch) return true;

      if (asset.type === 'champion') {
        return asset.title.toLowerCase().includes(query);
      } else if (asset.type === 'item') {
        return (
          asset.plaintext.toLowerCase().includes(query) ||
          asset.description.toLowerCase().includes(query)
        );
      } else if (asset.type === 'summoner') {
        return asset.description.toLowerCase().includes(query);
      } else if (asset.type === 'rune') {
        return (
          asset.shortDesc.toLowerCase().includes(query) ||
          asset.longDesc.toLowerCase().includes(query) ||
          asset.treeName.toLowerCase().includes(query)
        );
      }
      return false;
    });
  }, [activeTab, champions, items, summoners, runes, searchQuery, selectedTag]);

  // Batch upscale currently filtered assets
  const handleBatchUpscale = async () => {
    if (filteredAssets.length === 0 || scale === '1x') return;
    try {
      await window.electronAPI.batchUpscale(filteredAssets, scale);
    } catch (err) {
      console.error('Batch upscale error:', err);
    }
  };

  const handleCancelBatch = async () => {
    await window.electronAPI.cancelBatchUpscale();
  };

  // Single asset upscale from card or modal
  const handleUpscaleSingle = async (asset: AnyAsset, targetScale: ResolutionScale) => {
    const resPath = await window.electronAPI.upscaleAsset(asset, targetScale, 3, maskShape);
    await refreshCacheStats();
    return resPath;
  };

  const handleClearCache = async () => {
    try {
      const res = await window.electronAPI.clearCache();
      if (res && res.stats) {
        setCacheStats(res.stats);
      } else {
        await refreshCacheStats();
      }
    } catch (err) {
      console.error('Failed to clear upscaled cache:', err);
    }
  };

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header
        versions={versions}
        currentVersion={currentVersion}
        onVersionChange={handleVersionChange}
        scale={scale}
        onScaleChange={setScale}
        maskShape={maskShape}
        onMaskShapeChange={setMaskShape}
        cacheStats={cacheStats}
        onOpenCacheDir={handleOpenCacheDir}
        onClearCache={handleClearCache}
        onBatchUpscale={handleBatchUpscale}
        isBatchProcessing={progress?.status === 'processing'}
        totalFilteredCount={filteredAssets.length}
        onOpenSettings={() => setIsSettingsOpen(true)}
        pinnedCount={pinnedAssets.length}
        isQuickBinOpen={isQuickBinOpen}
        onToggleQuickBin={() => setIsQuickBinOpen(!isQuickBinOpen)}
      />

      {/* Filter and Search Bar */}
      <SearchFilter
        activeTab={activeTab}
        onTabChange={setActiveTab}
        championCount={champions.length}
        itemCount={items.length}
        summonerCount={summoners.length}
        runeCount={runes.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedTag={selectedTag}
        onTagSelect={setSelectedTag}
        filteredCount={filteredAssets.length}
      />

      {/* Main Asset Grid */}
      {loading ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            color: 'var(--gold-primary)',
          }}
        >
          <Loader2 size={36} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Syncing Riot Data Dragon Catalog v{currentVersion}...
          </div>
        </div>
      ) : (
        <AssetGrid
          assets={filteredAssets}
          scale={scale}
          maskShape={maskShape}
          pinnedIds={pinnedIds}
          onTogglePin={handleTogglePin}
          onPreview={(asset) => setPreviewAsset(asset)}
          onQuickUpscale={(asset) => handleUpscaleSingle(asset, scale)}
        />
      )}

      {/* Project Quick Bin (Collapsible Dock Tray) */}
      {isQuickBinOpen && (
        <QuickBin
          pinnedAssets={pinnedAssets}
          onUnpin={handleUnpin}
          onClearAll={handleClearQuickBin}
          scale={scale}
          maskShape={maskShape}
          onPreview={(asset) => setPreviewAsset(asset)}
        />
      )}

      {/* Bottom Status Bar */}
      <StatusBar
        progress={progress}
        onCancelBatch={handleCancelBatch}
        activeVersion={currentVersion}
      />

      {/* Side-by-Side Zoom & Comparison Modal */}
      <PreviewModal
        asset={previewAsset}
        scale={scale}
        currentVersion={currentVersion}
        onClose={() => setPreviewAsset(null)}
        onUpscaleDone={refreshCacheStats}
      />

      {/* Engine & Settings Preferences Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        cacheStats={cacheStats}
        onRefreshCacheStats={refreshCacheStats}
        onOpenCacheFolder={handleOpenCacheDir}
        onClearCache={handleClearCache}
        currentVersion={currentVersion}
      />
    </div>
  );
};
