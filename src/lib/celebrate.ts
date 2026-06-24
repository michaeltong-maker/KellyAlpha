// Signature "filing" moment — a stamp settles onto the page (a dossier being
// filed). One gesture for every commit-to-action: commissioning an analyst,
// filing a run, publishing a build. (Confetti has been removed — the stamp
// alone keeps the moment calm and on-brand.)
export function celebrateFiling(label: string): void {
  if (typeof document === 'undefined') return;

  const overlay = document.createElement('div');
  overlay.setAttribute('aria-hidden', 'true');
  Object.assign(overlay.style, {
    position: 'fixed', inset: '0', display: 'grid', placeItems: 'center',
    pointerEvents: 'none', zIndex: '9999',
  } as Partial<CSSStyleDeclaration>);

  const stamp = document.createElement('div');
  stamp.textContent = label;
  Object.assign(stamp.style, {
    fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
    textTransform: 'uppercase', letterSpacing: '0.22em', fontWeight: '600',
    fontSize: '15px',
    color: 'oklch(0.52 0.165 278)',
    border: '2px solid oklch(0.52 0.165 278)',
    borderRadius: '6px',
    padding: '12px 22px',
    background: 'oklch(0.99 0.004 290 / 0.92)',
    boxShadow: '0 18px 50px -22px oklch(0.52 0.165 278 / 0.6)',
  } as Partial<CSSStyleDeclaration>);

  overlay.appendChild(stamp);
  document.body.appendChild(overlay);

  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const anim = stamp.animate(
    reduce
      ? [{ opacity: 0 }, { opacity: 1 }]
      : [
          { opacity: 0, transform: 'rotate(-16deg) scale(1.6)' },
          { opacity: 1, transform: 'rotate(-6deg) scale(1)', offset: 0.28 },
          { opacity: 1, transform: 'rotate(-6deg) scale(1)', offset: 0.78 },
          { opacity: 0, transform: 'rotate(-5deg) scale(1.04)' },
        ],
    { duration: 1400, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
  );
  anim.onfinish = () => overlay.remove();
}
