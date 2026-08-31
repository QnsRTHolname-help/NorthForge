// Subtle animated clay background blobs — violet / pink / blue, low opacity.
// Sits behind content (z-0). Respects prefers-reduced-motion (hidden via CSS).
export function ClayBlobs({ variant = 'app' }: { variant?: 'app' | 'marketing' }) {
  const marketing = variant === 'marketing';
  return (
    <div className="clay-blobs" aria-hidden>
      <div
        className="blob animate-blob-1"
        style={{
          width: marketing ? 560 : 420, height: marketing ? 560 : 420,
          top: marketing ? '-8%' : '-12%', left: marketing ? '-6%' : '-8%',
          background: 'var(--blob-a)',
        }}
      />
      <div
        className="blob animate-blob-2"
        style={{
          width: marketing ? 480 : 360, height: marketing ? 480 : 360,
          top: marketing ? '30%' : '20%', right: marketing ? '-8%' : '-10%',
          background: 'var(--blob-b)',
        }}
      />
      <div
        className="blob animate-blob-3"
        style={{
          width: marketing ? 520 : 380, height: marketing ? 520 : 380,
          bottom: marketing ? '-10%' : '-14%', left: marketing ? '25%' : '30%',
          background: 'var(--blob-c)',
        }}
      />
    </div>
  );
}
