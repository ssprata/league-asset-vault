import React from 'react';
import { UpscaleProgressPayload } from '@shared/types';
import { RefreshCw, XCircle, CheckCircle, Database } from 'lucide-react';

interface StatusBarProps {
  progress: UpscaleProgressPayload | null;
  onCancelBatch: () => void;
  activeVersion: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  progress,
  onCancelBatch,
  activeVersion,
}) => {
  const isProcessing = progress?.status === 'processing';
  const percent = progress && progress.total > 0
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;

  return (
    <footer
      className="glass-panel"
      style={{
        padding: '6px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTop: '1px solid var(--border-subtle)',
        fontSize: '0.74rem',
        color: 'var(--text-secondary)',
        minHeight: 34,
        zIndex: 40,
      }}
    >
      {/* Left: System state & DDragon Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 6px #10b981',
            }}
          />
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
            CDN v{activeVersion}
          </span>
        </div>

        <span style={{ color: 'var(--text-muted)' }}>&bull;</span>

        <span style={{ color: 'var(--gold-light)' }}>
          Win32 CF_HDROP: <strong style={{ color: '#10b981' }}>Active</strong>
        </span>

        <span style={{ color: 'var(--text-muted)' }}>&bull;</span>

        <span>Target: Premiere Pro, DaVinci Resolve, Photoshop</span>
      </div>

      {/* Right: Worker Pipeline Progress */}
      {isProcessing ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <RefreshCw size={12} className="animate-pulse-glow" color="var(--hextech-blue)" />
          <span>
            Upscaling: <strong style={{ color: '#ffffff' }}>{progress.currentName}</strong> ({progress.completed}/{progress.total})
          </span>

          {/* Progress bar */}
          <div
            style={{
              width: 140,
              height: 6,
              background: 'rgba(5, 8, 17, 0.8)',
              borderRadius: 3,
              overflow: 'hidden',
              border: '1px solid rgba(10, 200, 185, 0.3)',
            }}
          >
            <div
              style={{
                width: `${percent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #0ac8b9, #c8aa6e)',
                transition: 'width 0.2s ease',
              }}
            />
          </div>

          <span style={{ fontWeight: 700, color: 'var(--hextech-blue)', minWidth: 32 }}>
            {percent}%
          </span>

          <button
            onClick={onCancelBatch}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ef4444',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: '0.72rem',
              fontWeight: 600,
            }}
          >
            <XCircle size={13} /> Cancel
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
          <CheckCircle size={12} color="#10b981" />
          <span>Upscaling Engine Ready</span>
        </div>
      )}
    </footer>
  );
};
