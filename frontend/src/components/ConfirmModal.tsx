import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  isLoading = false,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onCancel} disabled={isLoading}>
            ✕
          </button>
        </div>
        
        <div className="modal-body">
          {typeof message === 'string' ? <p>{message}</p> : message}
        </div>
        
        <div className="modal-footer">
          <button 
            className="btn-ghost" 
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button 
            className={`btn-${confirmVariant}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner-small" />
                Processing...
              </>
            ) : confirmText}
          </button>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 1rem;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .confirm-modal {
          background: var(--bg-card, linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.85)));
          border: 1px solid var(--border, rgba(148, 163, 184, 0.2));
          border-radius: var(--radius-xl, 24px);
          max-width: 400px;
          width: 100%;
          box-shadow: var(--shadow-lg, 0 16px 48px rgba(0, 0, 0, 0.5));
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border);
        }

        .modal-header h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text, #f1f5f9);
        }

        .modal-close {
          background: none;
          border: none;
          color: var(--muted, #94a3b8);
          cursor: pointer;
          font-size: 1.25rem;
          padding: 0.25rem;
          transition: color 0.2s ease;
        }

        .modal-close:hover:not(:disabled) {
          color: var(--text, #f1f5f9);
        }

        .modal-close:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .modal-body {
          padding: 1.5rem;
          color: var(--text-secondary, #cbd5e1);
          font-size: 0.95rem;
          line-height: 1.6;
        }

        .modal-body p {
          margin: 0;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          border-top: 1px solid var(--border);
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          padding: 0.625rem 1.25rem;
          border-radius: var(--radius, 10px);
          border: none;
          cursor: pointer;
          background: var(--accent-gradient, linear-gradient(135deg, #0ea5e9, #6366f1));
          color: white;
          transition: all 0.2s ease;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(56, 189, 248, 0.3);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .btn-danger {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          padding: 0.625rem 1.25rem;
          border-radius: var(--radius, 10px);
          border: none;
          cursor: pointer;
          background: var(--danger, #f87171);
          color: white;
          transition: all 0.2s ease;
        }

        .btn-danger:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(248, 113, 113, 0.3);
        }

        .btn-danger:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .btn-ghost {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          border-radius: var(--radius, 10px);
          border: 1px solid var(--border);
          background: var(--bg-elevated, #1e293b);
          color: var(--text-secondary, #cbd5e1);
          padding: 0.625rem 1.25rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-ghost:hover:not(:disabled) {
          background: var(--bg-hover);
          border-color: var(--border-hover);
        }

        .btn-ghost:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner-small {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
