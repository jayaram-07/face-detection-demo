import type { ReactNode } from 'react';

interface CropFrameProps {
  children: ReactNode;
  /** small caption slug shown top-left, e.g. "FRAME 01" */
  slug?: string;
  /** right-hand caption, e.g. "ƒ / vision" */
  note?: string;
  className?: string;
  tone?: 'ink' | 'grease' | 'ultra';
}

const tickColor: Record<NonNullable<CropFrameProps['tone']>, string> = {
  ink: 'border-ink',
  grease: 'border-grease',
  ultra: 'border-ultra',
};

/**
 * The signature element: a printer's crop-mark frame. Four right-angle ticks
 * sit *outside* the corners (registration marks), and an optional caption slug
 * rides the top edge like a contact-sheet frame number.
 */
export function CropFrame({ children, slug, note, className = '', tone = 'ink' }: CropFrameProps) {
  const c = tickColor[tone];
  return (
    <div className={`relative ${className}`}>
      {/* crop ticks, offset outside the corners */}
      <span className={`absolute -top-2 -left-2 h-4 w-4 border-t-2 border-l-2 ${c}`} />
      <span className={`absolute -top-2 -right-2 h-4 w-4 border-t-2 border-r-2 ${c}`} />
      <span className={`absolute -bottom-2 -left-2 h-4 w-4 border-b-2 border-l-2 ${c}`} />
      <span className={`absolute -bottom-2 -right-2 h-4 w-4 border-b-2 border-r-2 ${c}`} />

      {(slug || note) && (
        <div className="absolute -top-3 left-3 right-3 flex items-center justify-between">
          {slug && (
            <span className="label-caption bg-ink px-2 py-0.5 text-[10px] leading-none text-paper">
              {slug}
            </span>
          )}
          {note && (
            <span className="label-caption bg-paper px-1 text-[10px] leading-none text-graphite">
              {note}
            </span>
          )}
        </div>
      )}

      {children}
    </div>
  );
}
