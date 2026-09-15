import React from 'react';
import { AssetType } from '@shared/types';
import { CHAMPION_TAGS, ITEM_TAGS } from '@shared/constants';
import { Search, X, Users, Package } from 'lucide-react';

interface SearchFilterProps {
  activeTab: AssetType;
  onTabChange: (tab: AssetType) => void;
  championCount: number;
  itemCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedTag: string;
  onTagSelect: (tag: string) => void;
  filteredCount: number;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
  activeTab,
  onTabChange,
  championCount,
  itemCount,
  searchQuery,
  onSearchChange,
  selectedTag,
  onTagSelect,
  filteredCount,
}) => {
  const currentTags = activeTab === 'champion' ? CHAMPION_TAGS : ITEM_TAGS;

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
        {/* Main Tab Toggle: Champions vs Items */}
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
          <button
            onClick={() => {
              onTabChange('champion');
              onTagSelect('All');
            }}
            style={{
              background: activeTab === 'champion'
                ? 'linear-gradient(135deg, rgba(200, 170, 110, 0.25) 0%, rgba(120, 90, 40, 0.35) 100%)'
                : 'transparent',
              border: activeTab === 'champion' ? '1px solid var(--gold-primary)' : '1px solid transparent',
              color: activeTab === 'champion' ? '#ffffff' : 'var(--text-secondary)',
              padding: '6px 16px',
              borderRadius: 6,
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.15s ease',
            }}
          >
            <Users size={16} color={activeTab === 'champion' ? '#c8aa6e' : '#64748b'} />
            Champions ({championCount})
          </button>

          <button
            onClick={() => {
              onTabChange('item');
              onTagSelect('All');
            }}
            style={{
              background: activeTab === 'item'
                ? 'linear-gradient(135deg, rgba(200, 170, 110, 0.25) 0%, rgba(120, 90, 40, 0.35) 100%)'
                : 'transparent',
              border: activeTab === 'item' ? '1px solid var(--gold-primary)' : '1px solid transparent',
              color: activeTab === 'item' ? '#ffffff' : 'var(--text-secondary)',
              padding: '6px 16px',
              borderRadius: 6,
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.15s ease',
            }}
          >
            <Package size={16} color={activeTab === 'item' ? '#c8aa6e' : '#64748b'} />
            Items ({itemCount})
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
            placeholder={`Search ${activeTab === 'champion' ? 'champion names, titles (e.g. Yasuo, Blade)' : 'item names, stats (e.g. Infinity, Boots)'}...`}
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

      {/* Bottom row: Filter Tag Pills */}
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
    </div>
  );
};
