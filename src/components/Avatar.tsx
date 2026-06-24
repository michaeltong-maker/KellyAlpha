import { monogram, tileBg, authorInk, animalKey, animalColorway } from '../lib/avatars';
import { animalArt } from '../lib/animalArt';

interface Props { seed: string; name?: string; size?: number; className?: string; ring?: boolean; ink?: boolean }

export function Avatar({ seed, name, size = 40, className = '', ring, ink }: Props) {
  // Animal crest (`animal:tiger`) — a hand-drawn emblem on its editorial
  // colorway, finished with a faint stamped-seal ring.
  const animal = animalKey(seed);
  if (animal) {
    const pen = animalColorway(animal);
    const inner =
      `<circle cx="50" cy="50" r="50" fill="${pen.tile}"/>` +
      animalArt(animal, pen.tile, pen.ink) +
      `<circle cx="50" cy="50" r="48.5" fill="none" stroke="${pen.ink}" stroke-opacity="0.14" stroke-width="1.5"/>`;
    return (
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className={`rounded-full shrink-0 ${ring ? 'ring-1 ring-ink-200' : ''} ${className}`}
        style={{ width: size, height: size }}
        aria-label="avatar"
        dangerouslySetInnerHTML={{ __html: inner }}
      />
    );
  }

  // User-uploaded photo (blob:/data:/http URL) — render as an img directly.
  const isCustomUrl = seed.startsWith('blob:') || seed.startsWith('data:') || seed.startsWith('http');
  if (isCustomUrl) {
    return (
      <img
        src={seed}
        width={size}
        height={size}
        alt=""
        className={`rounded-full shrink-0 bg-ink-100 object-cover grayscale ${ring ? 'ring-1 ring-ink-200' : ''} ${className}`}
        style={{ width: size, height: size }}
        loading="lazy"
      />
    );
  }

  // Editorial serif monogram. Default: a quiet monochrome stone tile. When
  // `ink` is set (columnist contexts), the agent's stable author-ink colorway
  // tints the tile and the initial — a printed crest with personality.
  const label = monogram(name, seed);
  const fontSize = Math.max(11, Math.round(size * (label.length > 1 ? 0.38 : 0.44)));
  const pen = ink ? authorInk(seed) : null;
  return (
    <div
      className={`rounded-full shrink-0 flex items-center justify-center select-none overflow-hidden ${pen ? '' : 'text-ink-900'} ${ring ? 'ring-1 ring-ink-200' : ''} ${className}`}
      style={{ width: size, height: size, backgroundColor: pen ? pen.tile : tileBg(seed), color: pen ? pen.ink : undefined }}
      aria-label="avatar"
    >
      <span className="font-display font-medium leading-none" style={{ fontSize }}>{label}</span>
    </div>
  );
}
