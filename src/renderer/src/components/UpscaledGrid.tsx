import React, { useState, useMemo } from 'react';
import { UpscaledAssetInfo } from '@shared/types';
import {
  Download,
  Trash2,
  Copy,
  Check,
  Move,
  Sparkles,
  Zap,
  FolderArchive,
  Image as ImageIcon,
  CheckSquare,
  Square,
  AlertTriangle,
} from 'lucide-react';
import { showToast } from './Toast';

interface UpscaledGridProps {
  assets: UpscaledAssetInfo[];
  onRefresh: () => void;
  searchQuery: string;
  selectedTag: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export const UpscaledGrid: React.FC<UpscaledGridProps> = ({
  assets,
  onRefresh,
  searchQuery,
  selectedTag,
}) => {
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [exportedPath, setExportedPath] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);
  const [batchExportNotice, setBatchExportNotice] = useState<{ count: number; dir: string } | null>(null);

  // Filter assets based on search query and tag
  const filteredAssets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return assets.filter((item) => {
      // Tag filter
      if (selectedTag !== 'All') {
        if (selectedTag === '4x UHD' && item.scale !== '4x') return false;
        if (selectedTag === '2x HD' && item.scale !== '2x') return false;
        if (selectedTag === 'Champions' && item.assetType !== 'champion') return false;
        if (selectedTag === 'Skins' && item.assetType !== 'skin') return false;
        if (selectedTag === 'Renders' && item.assetType !== 'render') return false;
        if (selectedTag === 'Items' && item.assetType !== 'item') return false;
        if (selectedTag === 'Runes' && item.assetType !== 'rune') return false;
        if (selectedTag === 'Spells' && item.assetType !== 'summoner') return false;
      }

      // Search query
      if (!q) return true;
      const nameMatch = (item.name || '').toLowerCase().includes(q);
      const fileMatch = item.fileName.toLowerCase().includes(q);
      const typeMatch = item.assetType.toLowerCase().includes(q);
      return nameMatch || fileMatch || typeMatch;
    });
  }, [assets, searchQuery, selectedTag]);

  const totalFilteredSize = useMemo(() => {
    return filteredAssets.reduce((sum, item) => sum + item.fileSizeBytes, 0);
  }, [filteredAssets]);

  const allSelected = filteredAssets.length > 0 && filteredAssets.every((a) => selectedPaths.has(a.filePath));
  const someSelected = selectedPaths.size > 0;

  const handleToggleSelect = (filePath: string) => {
    setSelectedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(filePath)) {
        next.delete(filePath);
      } else {
        next.add(filePath);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedPaths(new Set());
    } else {
      setSelectedPaths(new Set(filteredAssets.map((a) => a.filePath)));
    }
  };

  const handleCopy = async (filePath: string) => {
    try {
      const res = await window.electronAPI.copyImageToClipboard(filePath);
      if (res.success) {
        setCopiedPath(filePath);
        showToast('Copied to clipboard', 'success');
        setTimeout(() => setCopiedPath(null), 2000);
      }
    } catch (err) {
      console.error('Copy to clipboard failed:', err);
    }
  };

  const handleExportSingle = async (filePath: string, fileName: string) => {
    try {
      const res = await window.electronAPI.exportAsset(filePath, fileName);
      if (res.success) {
        setExportedPath(filePath);
        showToast('Saved to disk', 'success', res.savedPath || fileName);
        setTimeout(() => setExportedPath(null), 2000);
      }
    } catch (err) {
      console.error('Export asset failed:', err);
    }
  };

  const handleBatchExport = async () => {
    const pathsToExport = selectedPaths.size > 0
      ? Array.from(selectedPaths)
      : filteredAssets.map((a) => a.filePath);

    if (pathsToExport.length === 0) return;

    setIsExporting(true);
    try {
      const res = await window.electronAPI.batchExport(pathsToExport);
      if (res.success && res.count && res.exportDir) {
        setBatchExportNotice({ count: res.count, dir: res.exportDir });
        setTimeout(() => setBatchExportNotice(null), 5000);
      }
    } catch (err) {
      console.error('Batch export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (selectedPaths.size === 0) return;
    setIsDeleting(true);
    try {
      const pathsToDelete = Array.from(selectedPaths);
      const res = await window.electronAPI.deleteCachedFiles(pathsToDelete);
      if (res.success) {
        setSelectedPaths(new Set());
        setShowConfirmDelete(false);
        onRefresh();
      }
    } catch (err) {
      console.error('Delete selected failed:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteSingle = async (filePath: string) => {
    try {
      const res = await window.electronAPI.deleteCachedFiles([filePath]);
      if (res.success) {
        setSelectedPaths((prev) => {
          const next = new Set(prev);
          next.delete(filePath);
          return next;
        });
        onRefresh();
      }
    } catch (err) {
      console.error('Delete single file failed:', err);
    }
  };

  const handleDragStart = (e: React.DragEvent, item: UpscaledAssetInfo) => {
    e.preventDefault();
    window.electronAPI.startDrag({
      assetId: item.fileName,
      assetType: item.assetType,
      filePath: item.filePath,
    });
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Batch Export Success Notification Banner */}
      {batchExportNotice && (
        <div
          style={{
            background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.15) 100%)',
            borderBottom: '1px solid #10b981',
            color: '#a7f3d0',
            padding: '8px 24px',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            animation: 'fadeIn 0.2s ease-in-out',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Check size={16} color="#10b981" />
            <span>
              Successfully exported <strong>{batchExportNotice.count}</strong> files to:
              <span style={{ color: '#ffffff', marginLeft: 6, fontFamily: 'monospace', fontSize: '0.78rem' }}>
                {batchExportNotice.dir}
              </span>
            </span>
          </div>
          <button
            onClick={() => setBatchExportNotice(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#a7f3d0',
              cursor: 'pointer',
              fontSize: '0.9rem',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Bulk Action Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 24px',
          background: 'rgba(5, 8, 17, 0.95)',
          borderBottom: '1px solid var(--border-subtle)',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Select All Checkbox Button */}
          <button
            onClick={handleSelectAll}
            disabled={filteredAssets.length === 0}
            className="btn-hextech"
            style={{
              padding: '6px 12px',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {allSelected ? <CheckSquare size={15} color="var(--gold-primary)" /> : <Square size={15} />}
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>

          {/* Stats indicator */}
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Showing <strong style={{ color: 'var(--gold-light)' }}>{filteredAssets.length}</strong> upscaled files
            {' '}({formatBytes(totalFilteredSize)})
            {selectedPaths.size > 0 && (
              <span style={{ marginLeft: 8, color: 'var(--gold-primary)', fontWeight: 700 }}>
                • {selectedPaths.size} selected
              </span>
            )}
          </span>
        </div>

        {/* Bulk Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Export Selected / Export All to Folder */}
          <button
            onClick={handleBatchExport}
            disabled={isExporting || filteredAssets.length === 0}
            className="btn-hextech"
            style={{
              padding: '6px 14px',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'linear-gradient(135deg, rgba(200, 170, 110, 0.2) 0%, rgba(120, 90, 40, 0.3) 100%)',
              borderColor: 'var(--gold-primary)',
              color: '#ffffff',
            }}
            title="Export selected assets (or all filtered) to a destination folder on your computer"
          >
            <FolderArchive size={14} color="var(--gold-primary)" />
            {isExporting
              ? 'Exporting...'
              : selectedPaths.size > 0
              ? `Export Selected (${selectedPaths.size}) to Folder...`
              : 'Export All Filtered to Folder...'}
          </button>

          {/* Delete Selected (Frees Disk Space) */}
          {selectedPaths.size > 0 && (
            <button
              onClick={() => setShowConfirmDelete(true)}
              disabled={isDeleting}
              className="btn-hextech"
              style={{
                padding: '6px 14px',
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                borderColor: '#ef4444',
                color: '#f87171',
                background: 'rgba(239, 68, 68, 0.15)',
              }}
              title="Delete selected upscaled files from disk cache to free storage space"
            >
              <Trash2 size={14} />
              Delete Selected ({selectedPaths.size})
            </button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Alert Modal */}
      {showConfirmDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={() => setShowConfirmDelete(false)}
        >
          <div
            className="glass-panel"
            style={{
              width: 440,
              padding: 24,
              borderRadius: 12,
              border: '1px solid #ef4444',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              background: '#0a0f1d',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#f87171' }}>
              <AlertTriangle size={24} />
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Delete Selected Files?</h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Are you sure you want to permanently delete{' '}
              <strong style={{ color: '#ffffff' }}>{selectedPaths.size}</strong> upscaled asset file(s) from your disk cache?
              This will free up disk storage space. You can always re-generate them at any time.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="btn-hextech"
                style={{ fontSize: '0.82rem', padding: '6px 14px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirmed}
                disabled={isDeleting}
                className="btn-hextech"
                style={{
                  fontSize: '0.82rem',
                  padding: '6px 16px',
                  background: '#ef4444',
                  borderColor: '#dc2626',
                  color: '#ffffff',
                  fontWeight: 700,
                }}
              >
                {isDeleting ? 'Deleting...' : 'Delete Files'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid View or Empty State */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {filteredAssets.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: 320,
              gap: 16,
              textAlign: 'center',
              color: 'var(--text-secondary)',
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'rgba(200, 170, 110, 0.1)',
                border: '1px solid rgba(200, 170, 110, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Zap size={36} color="var(--gold-primary)" />
            </div>
            <div style={{ maxWidth: 440 }}>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--gold-light)', margin: '0 0 6px 0', fontWeight: 800 }}>
                {assets.length === 0 ? 'No Upscaled Assets Yet' : 'No Matching Upscaled Assets'}
              </h3>
              <p style={{ fontSize: '0.84rem', margin: 0, lineHeight: 1.5 }}>
                {assets.length === 0
                  ? 'Click "Generate 2x / 4x" on any Champion, Skin, Chroma, or Item to create ultra-sharp HD/UHD assets. They will be saved here in your library for instant drag-and-drop into your video timeline!'
                  : 'Try selecting a different filter chip (e.g. All, 4x UHD, 2x HD) or clearing your search query.'}
              </p>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
              gap: 16,
            }}
          >
            {filteredAssets.map((item) => {
              const isSelected = selectedPaths.has(item.filePath);
              const is4x = item.scale === '4x';
              const isCopied = copiedPath === item.filePath;
              const isExported = exportedPath === item.filePath;

              return (
                <div
                  key={item.filePath}
                  className="glass-panel"
                  style={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 10,
                    overflow: 'hidden',
                    border: isSelected
                      ? '1px solid var(--gold-primary)'
                      : '1px solid var(--border-subtle)',
                    boxShadow: isSelected
                      ? '0 0 15px rgba(200, 170, 110, 0.25)'
                      : 'none',
                    background: 'rgba(10, 15, 29, 0.85)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Card Header: Checkbox & Scale Badge */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      background: 'rgba(5, 8, 17, 0.6)',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <button
                      onClick={() => handleToggleSelect(item.filePath)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        color: isSelected ? 'var(--gold-primary)' : 'var(--text-muted)',
                      }}
                      title={isSelected ? 'Deselect item' : 'Select item'}
                    >
                      {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {/* Asset Type badge */}
                      <span
                        style={{
                          fontSize: '0.62rem',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          color: 'var(--text-muted)',
                          background: 'rgba(255, 255, 255, 0.06)',
                          padding: '2px 6px',
                          borderRadius: 4,
                        }}
                      >
                        {item.assetType}
                      </span>

                      {/* Scale Badge */}
                      <span
                        style={{
                          fontSize: '0.64rem',
                          fontWeight: 800,
                          padding: '2px 7px',
                          borderRadius: 4,
                          background: is4x
                            ? 'linear-gradient(135deg, rgba(200, 170, 110, 0.3) 0%, rgba(120, 90, 40, 0.5) 100%)'
                            : 'linear-gradient(135deg, rgba(6, 182, 212, 0.3) 0%, rgba(14, 116, 144, 0.5) 100%)',
                          color: is4x ? '#ffffff' : '#67e8f9',
                          border: is4x
                            ? '1px solid var(--gold-primary)'
                            : '1px solid #06b6d4',
                        }}
                      >
                        {item.scale.toUpperCase()} {is4x ? 'UHD' : 'HD'}
                      </span>
                    </div>
                  </div>

                  {/* Thumbnail Preview Area */}
                  <div
                    style={{
                      height: 150,
                      width: '100%',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'repeating-conic-gradient(#111827 0% 25%, #0b0f19 0% 50%) 50% / 16px 16px',
                      overflow: 'hidden',
                    }}
                  >
                    {item.dataUrl ? (
                      <img
                        src={item.dataUrl}
                        alt={item.fileName}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 6,
                          color: 'var(--text-muted)',
                        }}
                      >
                        <ImageIcon size={32} style={{ opacity: 0.4 }} />
                        <span style={{ fontSize: '0.70rem' }}>Upscaled Image</span>
                      </div>
                    )}
                  </div>

                  {/* File Metadata */}
                  <div
                    style={{
                      padding: '8px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 3,
                      borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={item.fileName}
                    >
                      {item.fileName}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      {formatBytes(item.fileSizeBytes)}
                    </span>
                  </div>

                  {/* Action Toolbar on Card */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.2fr 1fr 1fr 0.6fr',
                      gap: 4,
                      padding: '6px 8px 8px 8px',
                      background: 'rgba(5, 8, 17, 0.6)',
                      borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    {/* Native Drag Handle */}
                    <div
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, item)}
                      className="btn-hextech"
                      style={{
                        padding: '5px 6px',
                        fontSize: '0.70rem',
                        cursor: 'grab',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                        background: 'linear-gradient(135deg, rgba(200, 170, 110, 0.2) 0%, rgba(120, 90, 40, 0.3) 100%)',
                        borderColor: 'var(--gold-primary)',
                        color: 'var(--gold-light)',
                        fontWeight: 700,
                      }}
                      title="Drag directly into Premiere Pro, DaVinci Resolve, or Photoshop timeline"
                    >
                      <Move size={12} />
                      Drag
                    </div>

                    {/* Copy to Clipboard */}
                    <button
                      onClick={() => handleCopy(item.filePath)}
                      className="btn-hextech"
                      style={{
                        padding: '5px 6px',
                        fontSize: '0.70rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 3,
                        borderColor: isCopied ? '#10b981' : undefined,
                        color: isCopied ? '#10b981' : undefined,
                      }}
                      title="Copy bitmap to clipboard (Ctrl+C)"
                    >
                      {isCopied ? <Check size={12} /> : <Copy size={12} />}
                      {isCopied ? 'Done' : 'Copy'}
                    </button>

                    {/* Save As... */}
                    <button
                      onClick={() => handleExportSingle(item.filePath, item.fileName)}
                      className="btn-hextech"
                      style={{
                        padding: '5px 6px',
                        fontSize: '0.70rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 3,
                        borderColor: isExported ? '#10b981' : undefined,
                        color: isExported ? '#10b981' : undefined,
                      }}
                      title="Export / Save As file"
                    >
                      {isExported ? <Check size={12} /> : <Download size={12} />}
                      {isExported ? 'Saved' : 'Save'}
                    </button>

                    {/* Delete Single File */}
                    <button
                      onClick={() => handleDeleteSingle(item.filePath)}
                      className="btn-hextech"
                      style={{
                        padding: '5px 6px',
                        fontSize: '0.70rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#f87171',
                        borderColor: 'rgba(239, 68, 68, 0.3)',
                      }}
                      title="Delete this upscaled file from disk"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
