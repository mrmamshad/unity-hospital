export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden className={className}>
      <path
        d="M16 5.1c2.2 0 3.4 1.5 3.4 3.7V12h3.2c2.2 0 3.7 1.3 3.7 3.4s-1.5 3.4-3.7 3.4h-3.2v3.2c0 2.2-1.2 3.7-3.4 3.7s-3.4-1.5-3.4-3.7v-3.2H9.4c-2.2 0-3.7-1.3-3.7-3.4S7.2 12 9.4 12h3.2V8.8c0-2.2 1.2-3.7 3.4-3.7Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Unity Hospital brand mark — sleek clinical cross */
export function UnityMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden className={className}>
      <path
        d="M16 5.1c2.2 0 3.4 1.5 3.4 3.7V12h3.2c2.2 0 3.7 1.3 3.7 3.4s-1.5 3.4-3.7 3.4h-3.2v3.2c0 2.2-1.2 3.7-3.4 3.7s-3.4-1.5-3.4-3.7v-3.2H9.4c-2.2 0-3.7-1.3-3.7-3.4S7.2 12 9.4 12h3.2V8.8c0-2.2 1.2-3.7 3.4-3.7Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Backward compatibility alias */
export const TerafabMark = UnityMark;

