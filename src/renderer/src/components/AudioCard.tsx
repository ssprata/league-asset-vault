import React, { useState, useRef, useEffect } from 'react';
import { AudioAsset } from '@shared/types';
import { Play, Pause, Move, Volume2, Sparkles, Check, DownloadCloud, Disc3 } from 'lucide-react';

interface AudioCardProps {
  asset: AudioAsset;
  volume?: number;
}

export const AudioCard: React.FC<AudioCardProps> = ({ asset, volume = 0.30 }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [isCached, setIsCached] = useState(!!asset.cachedPath);
  const [downloading, setDownloading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // Sync volume with global master volume in real-time
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, volume));
    }
  }, [volume]);

  // Listen to instantaneous global volume events across all playing cards
  useEffect(() => {
    const handleVolumeEvent = (e: any) => {
      if (audioRef.current && typeof e.detail === 'number') {
        audioRef.current.volume = Math.max(0, Math.min(1, e.detail));
      }
    };
    window.addEventListener('vault:volume-change', handleVolumeEvent);
    return () => window.removeEventListener('vault:volume-change', handleVolumeEvent);
  }, []);

  // Pause when another audio starts playing
  useEffect(() => {
    const handleOtherPlay = (e: any) => {
      if (e.detail !== asset.id && isPlaying) {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        setIsPlaying(false);
        setProgress(0);
      }
    };
    window.addEventListener('vault:audio-play', handleOtherPlay);
    return () => window.removeEventListener('vault:audio-play', handleOtherPlay);
  }, [asset.id, isPlaying]);

  const handlePlayToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
      return;
    }

    try {
      window.dispatchEvent(new CustomEvent('vault:audio-play', { detail: asset.id }));

      let playSrc = asset.playUrl || (asset.cdnUrl?.startsWith('data:') ? asset.cdnUrl : null);
      if (!playSrc) {
        playSrc = await window.electronAPI.getAudioPlayUrl(asset);
      }

      if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.volume = Math.max(0, Math.min(1, volume));

        audioRef.current.ontimeupdate = () => {
          if (audioRef.current && audioRef.current.duration) {
            const current = audioRef.current.currentTime;
            const dur = audioRef.current.duration;
            setProgress((current / dur) * 100);

            const mins = Math.floor(current / 60);
            const secs = Math.floor(current % 60);
            setCurrentTime(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
          }
        };

        audioRef.current.onended = () => {
          setIsPlaying(false);
          setProgress(0);
          setCurrentTime('0:00');
        };

        audioRef.current.onerror = (err) => {
          console.error('Audio playback error:', err);
          setIsPlaying(false);
        };
      }

      if (audioRef.current.src !== playSrc) {
        audioRef.current.src = playSrc;
      }

      audioRef.current.volume = Math.max(0, Math.min(1, volume));
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (err) {
      console.error('Playback failed:', err);
      setIsPlaying(false);
    }
  };

  const handleDragStart = async (e: React.DragEvent) => {
    e.preventDefault();
    try {
      setDownloading(true);
      // Ensure audio is cached locally before drag initiation
      await window.electronAPI.ensureAudioCached(asset);
      setIsCached(true);

      // Trigger OS native CF_HDROP drag
      await window.electronAPI.startDrag({
        assetId: asset.id,
        assetType: 'audio',
        imageFileName: asset.fileName,
        cdnUrl: asset.cdnUrl,
      });
    } catch (err) {
      console.error('Drag error:', err);
    } finally {
      setDownloading(false);
    }
  };

  const getCategoryBadge = () => {
    switch (asset.category) {
      case 'spell':
        return { label: 'Summoner SFX', color: '#0ac8b9', bg: 'rgba(10, 200, 185, 0.15)', border: 'rgba(10, 200, 185, 0.3)' };
      case 'item':
        return { label: 'Item Active', color: '#c8aa6e', bg: 'rgba(200, 170, 110, 0.15)', border: 'rgba(200, 170, 110, 0.3)' };
      case 'ping':
        return { label: 'Smart Ping', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)' };
      case 'announcer':
        return { label: 'Announcer', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)', border: 'rgba(236, 72, 153, 0.3)' };
      case 'champion_vo':
        return { label: 'Voice Line', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)' };
      case 'champion_sfx':
        return { label: 'Stinger SFX', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.3)' };
      default:
        return { label: 'Game Audio', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)', border: 'rgba(148, 163, 184, 0.3)' };
    }
  };

  const badge = getCategoryBadge();

  return (
    <div
      className="glass-panel"
      style={{
        borderRadius: 10,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        background: isPlaying
          ? 'linear-gradient(135deg, rgba(15, 25, 48, 0.95) 0%, rgba(8, 14, 28, 0.95) 100%)'
          : 'rgba(10, 17, 34, 0.85)',
        border: isPlaying ? '1px solid var(--gold-primary)' : '1px solid var(--border-subtle)',
        boxShadow: isPlaying ? '0 0 20px rgba(200, 170, 110, 0.25)' : 'none',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Top Header: Badge, Title & Format */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span
              style={{
                fontSize: '0.64rem',
                fontWeight: 800,
                color: badge.color,
                background: badge.bg,
                border: `1px solid ${badge.border}`,
                borderRadius: 4,
                padding: '1px 6px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {badge.label}
            </span>
            <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
              {asset.fileName.endsWith('.wav') ? 'PCM WAV' : 'OGG VORBIS'}
            </span>
          </div>

          <h3
            style={{
              fontSize: '0.90rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={asset.name}
          >
            {asset.name}
          </h3>

          {asset.championName && (
            <span style={{ fontSize: '0.70rem', color: 'var(--gold-light)', fontWeight: 600 }}>
              {asset.championName}
            </span>
          )}
        </div>

        {/* Audio Wave Icon */}
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 6,
            background: 'rgba(200, 170, 110, 0.1)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Disc3
            size={16}
            color="var(--gold-primary)"
            style={{
              animation: isPlaying ? 'spin 3s linear infinite' : 'none',
            }}
          />
        </div>
      </div>

      {/* Waveform / Visualizer Animation Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          height: 28,
          background: 'rgba(5, 8, 17, 0.8)',
          borderRadius: 6,
          padding: '0 8px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* Animated frequency bars */}
        {Array.from({ length: 22 }).map((_, idx) => {
          const barHeight = isPlaying
            ? Math.max(15, Math.sin(idx * 0.7 + Date.now() / 200) * 100)
            : ((idx % 5) + 2) * 14;
          return (
            <div
              key={idx}
              style={{
                flex: 1,
                height: `${Math.min(95, Math.max(15, barHeight))}%`,
                background:
                  progress > (idx / 22) * 100
                    ? 'var(--gold-primary)'
                    : isPlaying
                    ? 'var(--hextech-blue)'
                    : 'rgba(255, 255, 255, 0.15)',
                borderRadius: 2,
                transition: 'height 0.15s ease, background 0.15s ease',
              }}
            />
          );
        })}
      </div>

      {/* Progress & Duration */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
        <span>{isPlaying ? currentTime : '0:00'}</span>
        <span>{asset.duration || '0:02'}</span>
      </div>

      {/* Control Actions: Play / Pause + Native Drag Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
        {/* Play / Pause Button */}
        <button
          onClick={handlePlayToggle}
          style={{
            flex: 1,
            background: isPlaying
              ? 'linear-gradient(135deg, rgba(200, 170, 110, 0.3) 0%, rgba(120, 90, 40, 0.4) 100%)'
              : 'rgba(15, 23, 42, 0.8)',
            border: isPlaying ? '1px solid var(--gold-primary)' : '1px solid var(--border-gold)',
            color: isPlaying ? '#ffffff' : 'var(--gold-light)',
            padding: '7px 12px',
            borderRadius: 6,
            fontSize: '0.76rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            transition: 'all 0.15s ease',
          }}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          {isPlaying ? 'Pause' : 'Play SFX'}
        </button>

        {/* Win32 CF_HDROP Native Drag Handle */}
        <div
          draggable
          onDragStart={handleDragStart}
          className="btn-hextech"
          style={{
            padding: '7px 12px',
            fontSize: '0.74rem',
            cursor: downloading ? 'wait' : 'grab',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            borderColor: isCached ? '#10b981' : undefined,
          }}
          title="Drag and drop this audio file directly onto Premiere Pro, DaVinci Resolve, or Windows Explorer"
        >
          <Move size={13} />
          <span>Drag Audio</span>
        </div>
      </div>
    </div>
  );
};
