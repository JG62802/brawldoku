import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  subtitle?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  /** Footer content, or a render function that receives the animated close handler. */
  footer?: React.ReactNode | ((close: () => void) => React.ReactNode);
  /** When false, the backdrop, Escape key and close icon are disabled. */
  dismissible?: boolean;
  /** Center-aligns the header title and subtitle while pinning the close button to the upper-right corner. */
  centerHeader?: boolean;
  size?: 'sm' | 'md' | 'lg';
  /** Align to top (for the search dialog so the list has room to grow). */
  align?: 'center' | 'top';
}

const SIZE = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' };
const EXIT_MS = 140;

/**
 * Shared Brawl Stars-inspired game dialog shell: vivid blue color-blocked header,
 * thick dark navy outline, hard-edged shadow, clean surface interior, and accessible focus/scroll management.
 */
export const Modal: React.FC<ModalProps> = ({
  title,
  subtitle,
  onClose,
  children,
  footer,
  dismissible = true,
  centerHeader = false,
  size = 'md',
  align = 'center',
}) => {
  const [closing, setClosing] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useRef(`modal-title-${Math.random().toString(36).slice(2)}`).current;

  const requestClose = useCallback(() => {
    setClosing(true);
    window.setTimeout(onClose, EXIT_MS);
  }, [onClose]);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  useEffect(() => {
    if (!dismissible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dismissible, requestClose]);

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center bg-brawl-navy/65 backdrop-blur-[2px] p-3 sm:p-6 transition-opacity duration-150 ${
        align === 'top' ? 'items-start pt-[5vh]' : 'items-center'
      } ${closing ? 'opacity-0' : 'animate-fade-in'}`}
      onMouseDown={(e) => {
        if (dismissible && e.target === e.currentTarget) requestClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative flex w-full ${SIZE[size]} max-h-[calc(100dvh-24px)] sm:max-h-[calc(100dvh-48px)] flex-col overflow-hidden rounded-2xl border-[3px] border-brawl-navy bg-white shadow-modal outline-none transition-all duration-150 ${
          closing ? 'translate-y-2 opacity-0' : 'animate-modal-in'
        }`}
      >
        {centerHeader ? (
          <div className="relative border-b-[3px] border-brawl-navy bg-brawl-blue px-12 py-4 text-center text-white sm:px-14 sm:py-4">
            <h2 id={titleId} className="font-display text-xl sm:text-2xl uppercase tracking-[0.03em] text-white text-outline-sm category-label">
              {title}
            </h2>
            {subtitle && <div className="mt-1 text-xs sm:text-sm font-extrabold italic text-white/95">{subtitle}</div>}
            {dismissible && (
              <button
                type="button"
                onClick={requestClose}
                aria-label="Close"
                className="absolute right-3.5 top-3.5 inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border-2 border-brawl-navy bg-brawl-red text-white shadow-brawl-xs transition-transform hover:bg-brawl-red-dark active:translate-y-[1px] active:shadow-none"
              >
                <X className="h-4 w-4 stroke-[3]" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-start justify-between gap-4 border-b-[3px] border-brawl-navy bg-brawl-blue px-5 sm:px-6 py-4 text-white">
            <div className="min-w-0">
              <h2 id={titleId} className="font-display text-xl sm:text-2xl uppercase tracking-[0.03em] text-white text-outline-sm category-label">
                {title}
              </h2>
              {subtitle && <div className="mt-1 text-xs sm:text-sm font-extrabold text-white/90">{subtitle}</div>}
            </div>
            {dismissible && (
              <button
                type="button"
                onClick={requestClose}
                aria-label="Close"
                className="-mr-1 -mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-brawl-navy bg-brawl-red text-white shadow-brawl-xs transition-transform hover:bg-brawl-red-dark active:translate-y-[1px] active:shadow-none"
              >
                <X className="h-4 w-4 stroke-[3]" />
              </button>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-4 sm:py-5">{children}</div>

        {footer && (
          <div className="border-t-[3px] border-brawl-navy bg-brawl-blue-sky px-4 sm:px-6 py-3.5 sm:py-4">
            {typeof footer === 'function' ? footer(requestClose) : footer}
          </div>
        )}
      </div>
    </div>
  );
};
