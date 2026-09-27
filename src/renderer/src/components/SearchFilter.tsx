import React, { useState } from 'react';
import { AssetType } from '@shared/types';
import { CHAMPION_TAGS, ITEM_TAGS, RUNE_TAGS, AUDIO_TAGS } from '@shared/constants';
import { Search, X, Users, Package, Wand2, Sparkles, Volume2, Volume1, VolumeX } from 'lucide-react';

const SUMMONER_TAGS = ['All', 'CLASSIC', 'ARAM', 'CHERRY', 'URF'] as const;

interface SearchFilterProps {
  activeTab: AssetType;
  onTabChange: (tab: AssetType) => void;
  championCount: number;
  itemCount: number;
  summonerCount: number;
  runeCount?: number;
  audioCount?: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedTag: string;
  onTagSelect: (tag: string) => void;
  filteredCount: number;
  masterVolume?: number;
  onMasterVolumeChange?: (vol: number) => void;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
  activeTab,
  onTabChange,
  championCount,
  itemCount,
  summonerCount,
  runeCount = 0,
  audioCount = 0,
  searchQuery,
  onSearchChange,
  selectedTag,
  onTagSelect,
  filteredCount,
  masterVolume = 0.30,
  onMasterVolumeChange,
}) => {
  const [prevVolume, setPrevVolume] = useState<number>(masterVolume > 0 ? masterVolume : 0.30);

  const handleToggleMute = () => {
    if (!onMasterVolumeChange) return;
    if (masterVolume > 0) {
      setPrevVolume(masterVolume);
      onMasterVolumeChange(0);
    } else {
      onMasterVolumeChange(prevVolume > 0 ? prevVolume : 0.30);
    }
  };
  const currentTags =
    activeTab === 'champion'
      ? CHAMPION_TAGS
      : activeTab === 'item'
      ? ITEM_TAGS
      : activeTab === 'rune'
      ? RUNE_TAGS
      : activeTab === 'audio'
      ? AUDIO_TAGS
      : SUMMONER_TAGS;

  const getPlaceholder = () => {
    if (activeTab === 'champion') return 'Search champions, titles (e.g. Yasuo, Blade, ASol)...';
    if (activeTab === 'item') return 'Search items, slang (e.g. BORK, IE, Tabis)...';
    if (activeTab === 'rune') return 'Search runes, keystones (e.g. Conq, PTA, First Strike)...';
    if (activeTab === 'audio') return 'Search sound effects, voice lines (e.g. Flash, Zhonya, Missing ping, Ace)...';
    return 'Search summoner spells (e.g. Flash, Ignite, Smite)...';
  };

  return (
    <div
      className="glass-panel"
      style={{
        padding: '12px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/* Top row: Tab Switcher & Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        {/* Main Tab Toggle: Champions vs Items vs Summoner Spells vs Runes */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(5, 8, 17, 0.9)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            padding: 3,
            gap: 4,
          }}
        >
          {/* Champions */}
          <button
            onClick={() => {
              onTabChange('champion');
              onTagSelect('All');
            }}
            style={{
              background:
                activeTab === 'champion'
                  ? 'linear-gradient(135deg, rgba(200, 170, 110, 0.25) 0%, rgba(120, 90, 40, 0.35) 100%)'
                  : 'transparent',
              border: activeTab === 'champion' ? '1px solid var(--gold-primary)' : '1px solid transparent',
              color: activeTab === 'champion' ? '#ffffff' : 'var(--text-secondary)',
              padding: '6px 14px',
              borderRadius: 6,
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              transition: 'all 0.15s ease',
            }}
          >
            <Users size={15} color={activeTab === 'champion' ? '#c8aa6e' : '#64748b'} />
            Champions ({championCount})
          </button>

          {/* Items */}
          <button
            onClick={() => {
              onTabChange('item');
              onTagSelect('All');
            }}
            style={{
              background:
                activeTab === 'item'
                  ? 'linear-gradient(135deg, rgba(200, 170, 110, 0.25) 0%, rgba(120, 90, 40, 0.35) 100%)'
                  : 'transparent',
              border: activeTab === 'item' ? '1px solid var(--gold-primary)' : '1px solid transparent',
              color: activeTab === 'item' ? '#ffffff' : 'var(--text-secondary)',
              padding: '6px 14px',
              borderRadius: 6,
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              transition: 'all 0.15s ease',
            }}
          >
            <Package size={15} color={activeTab === 'item' ? '#c8aa6e' : '#64748b'} />
            Items ({itemCount})
          </button>

          {/* Summoner Spells */}
          <button
            onClick={() => {
              onTabChange('summoner');
              onTagSelect('All');
            }}
            style={{
              background:
                activeTab === 'summoner'
                  ? 'linear-gradient(135deg, rgba(200, 170, 110, 0.25) 0%, rgba(120, 90, 40, 0.35) 100%)'
                  : 'transparent',
              border: activeTab === 'summoner' ? '1px solid var(--gold-primary)' : '1px solid transparent',
              color: activeTab === 'summoner' ? '#ffffff' : 'var(--text-secondary)',
              padding: '6px 14px',
              borderRadius: 6,
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              transition: 'all 0.15s ease',
            }}
          >
            <Wand2 size={15} color={activeTab === 'summoner' ? '#c8aa6e' : '#64748b'} />
            Spells ({summonerCount})
          </button>

          {/* Runes Reforged */}
          <button
            onClick={() => {
              onTabChange('rune');
              onTagSelect('All');
            }}
            style={{
              background:
                activeTab === 'rune'
                  ? 'linear-gradient(135deg, rgba(200, 170, 110, 0.25) 0%, rgba(120, 90, 40, 0.35) 100%)'
                  : 'transparent',
              border: activeTab === 'rune' ? '1px solid var(--gold-primary)' : '1px solid transparent',
              color: activeTab === 'rune' ? '#ffffff' : 'var(--text-secondary)',
              padding: '6px 14px',
              borderRadius: 6,
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              transition: 'all 0.15s ease',
            }}
          >
            <Sparkles size={15} color={activeTab === 'rune' ? '#c8aa6e' : '#64748b'} />
            Runes ({runeCount})
          </button>

          {/* Audio SFX */}
          <button
            onClick={() => {
              onTabChange('audio');
              onTagSelect('All');
            }}
            style={{
              background:
                activeTab === 'audio'
                  ? 'linear-gradient(135deg, rgba(200, 170, 110, 0.25) 0%, rgba(120, 90, 40, 0.35) 100%)'
                  : 'transparent',
              border: activeTab === 'audio' ? '1px solid var(--gold-primary)' : '1px solid transparent',
              color: activeTab === 'audio' ? '#ffffff' : 'var(--text-secondary)',
              padding: '6px 14px',
              borderRadius: 6,
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              transition: 'all 0.15s ease',
            }}
          >
            <Volume2 size={15} color={activeTab === 'audio' ? '#c8aa6e' : '#64748b'} />
            Audio SFX ({audioCount})
          </button>
        </div>

        {/* Instant Search Bar */}
        <div
          style={{
            position: 'relative',
            flex: 1,
            maxWidth: 420,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Search
            size={16}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: 12, pointerEvents: 'none' }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={getPlaceholder()}
            style={{
              width: '100%',
              background: 'rgba(5, 8, 17, 0.85)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              padding: '7px 36px 7px 36px',
              color: 'var(--text-primary)',
              fontSize: '0.84rem',
              outline: 'none',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--gold-primary)';
              e.currentTarget.style.boxShadow = '0 0 10px rgba(200, 170, 110, 0.25)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              style={{
                position: 'absolute',
                right: 10,
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Count Label */}
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
          <span style={{ color: 'var(--gold-light)' }}>{filteredCount}</span> assets found
        </div>
      </div>

      {/* Bottom row: Filter Tag Pills & Master Volume Slider */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600, marginRight: 4 }}>
            FILTER:
          </span>
          {currentTags.map((tag) => {
            const isSelected = selectedTag === tag;
            return (
              <button
                key={tag}
                onClick={() => onTagSelect(tag)}
                style={{
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(200, 170, 110, 0.3) 0%, rgba(120, 90, 40, 0.4) 100%)'
                    : 'rgba(15, 23, 42, 0.6)',
                  border: isSelected ? '1px solid var(--gold-primary)' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '0.72rem',
                  fontWeight: isSelected ? 700 : 500,
                  padding: '3px 10px',
                  borderRadius: 14,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tag}
              </button>
            );
          })}
        </div>

        {/* Global Master Volume Control (Controls ALL audios simultaneously) */}
        {activeTab === 'audio' && onMasterVolumeChange !== undefined && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'rgba(5, 8, 17, 0.95)',
              border: '1px solid var(--border-gold)',
              borderRadius: 8,
              padding: '4px 12px',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.4), inset 0 0 10px rgba(200, 170, 110, 0.05)',
            }}
            title="Global Master Volume: Controls playback volume for ALL audio effects simultaneously"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  color: 'var(--gold-primary)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                Master Volume
              </span>
              <button
                onClick={handleToggleMute}
                title={masterVolume === 0 ? 'Unmute All Sounds' : 'Mute All Sounds'}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: masterVolume === 0 ? '#ef4444' : 'var(--gold-light)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 2,
                  transition: 'color 0.15s ease, transform 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.15)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {masterVolume === 0 ? (
                  <VolumeX size={15} />
                ) : masterVolume < 0.5 ? (
                  <Volume1 size={15} />
                ) : (
                  <Volume2 size={15} />
                )}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="range"
                className="hextech-slider"
                min="0"
                max="100"
                step="1"
                value={Math.round(masterVolume * 100)}
                onChange={(e) => onMasterVolumeChange(Number(e.target.value) / 100)}
                style={{
                  width: 110,
                  background: `linear-gradient(to right, var(--gold-primary) 0%, var(--gold-primary) ${masterVolume * 100}%, rgba(255, 255, 255, 0.12) ${masterVolume * 100}%, rgba(255, 255, 255, 0.12) 100%)`,
                }}
                title={`Master Volume: ${Math.round(masterVolume * 100)}%`}
              />
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: masterVolume === 0 ? '#ef4444' : 'var(--gold-light)',
                  minWidth: 32,
                  textAlign: 'right',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {masterVolume === 0 ? 'Mute' : `${Math.round(masterVolume * 100)}%`}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
