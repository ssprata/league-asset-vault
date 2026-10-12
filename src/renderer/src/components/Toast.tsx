import React, { useState, useEffect } from 'react';
import { CheckCircle2, Info, AlertCircle, X } from 'lucide-react';

export interface ToastItem {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
  subMessage?: string;
}

export function showToast(message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info', subMessage?: string) {
  window.dispatchEvent(
    new CustomEvent('vault:toast', {
      detail: {
        id: `${Date.now()}_${Math.random()}`,
        type,
        message,
        subMessage,
      },
    })
  );
}

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<ToastItem>;
      if (!customEvent.detail) return;
      const newToast = customEvent.detail;

      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 3500);
    };

    window.addEventListener('vault:toast', handleToastEvent);
    return () => window.removeEventListener('vault:toast', handleToastEvent);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 48,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isWarn = toast.type === 'warning';
        const isError = toast.type === 'error';

        const borderColor = isSuccess
          ? '#10b981'
          : isWarn
          ? '#f59e0b'
          : isError
          ? '#ef4444'
          : 'var(--gold-primary)';

        const glowColor = isSuccess
          ? 'rgba(16, 185, 129, 0.25)'
          : isWarn
          ? 'rgba(245, 158, 11, 0.25)'
          : 'rgba(200, 170, 110, 0.25)';

        return (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              minWidth: 280,
              maxWidth: 400,
              background: 'rgba(5, 8, 17, 0.96)',
              border: `1px solid ${borderColor}`,
              borderRadius: 8,
              boxShadow: `0 8px 24px rgba(0, 0, 0, 0.6), 0 0 14px ${glowColor}`,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              animation: 'fadeIn 0.2s ease-in-out',
            }}
          >
            {isSuccess ? (
              <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0, marginTop: 1 }} />
            ) : isWarn ? (
              <AlertCircle size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
            ) : isError ? (
              <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
            ) : (
              <Info size={18} color="var(--gold-primary)" style={{ flexShrink: 0, marginTop: 1 }} />
            )}

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f3f4f6' }}>
                {toast.message}
              </div>
              {toast.subMessage && (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  {toast.subMessage}
                </div>
              )}
            </div>

            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
