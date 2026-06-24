// Editorial monogram avatars. The old emoji avatars are gone; each agent or
// person now reads as a quiet serif monogram on a monochrome "stone" tile
// (see Avatar.tsx) — a printed crest rather than a colourful sticker, in
// keeping with the editorial system. Custom photo URLs still render as images.

function hashSeed(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
}

// A subtle, deterministic warm-bone tile so a grid of avatars isn't flat.
const TILE_BG = ['#EEEBE4', '#E9E5DC', '#E4DFD5', '#ECE8E0', '#E6E1D8', '#EAE6DD', '#E1DCD2', '#F0EDE6'];

export function tileBg(seed: string): string {
  return TILE_BG[hashSeed(seed + '|tile') % TILE_BG.length];
}

// "Author ink" colorways — each columnist gets a stable, distinct ink drawn
// from a muted editorial palette (fountain-pen tones). Hues stay in the
// cool / violet / plum arc and deliberately avoid red (~25) and green (~150)
// so a monogram can never be misread as a market gain or loss. Used only for
// agent identity, never for data.
const INK_HUES = [278, 305, 250, 222, 332, 200]; // indigo, violet, blue, teal-blue, plum, cyan-slate

export function authorInk(seed: string): { tile: string; ink: string } {
  const h = INK_HUES[hashSeed(seed + '|ink') % INK_HUES.length];
  return {
    tile: `oklch(0.95 0.035 ${h})`,
    ink: `oklch(0.47 0.13 ${h})`,
  };
}

// Derive the monogram glyph(s). Latin names → 1 initial for a single word,
// 2 initials across first/last word. CJK names → the full short name (1–2
// characters). Falls back to letters pulled from the seed.
export function monogram(name?: string, seed?: string): string {
  const src = (name ?? '').trim();
  if (src) {
    if (/[㐀-鿿぀-ヿ]/.test(src)) {
      const cjk = src.replace(/\s+/g, '');
      return cjk.slice(0, 2);
    }
    const parts = src.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].slice(0, 1).toUpperCase();
  }
  const letters = (seed ?? '').replace(/[^a-zA-Z]/g, '');
  return (letters.slice(0, 2) || '·').toUpperCase();
}

export const seedSeeds: string[] = Array.from({ length: 100 }, (_, i) => `alpha-${String(i + 1).padStart(3, '0')}`);

// Animal-crest avatars for the Create flow. Each is a hand-drawn emblem (see
// animalArt.ts) on its own stable editorial colorway — muted "stamped seal"
// tones that avoid red/green so a crest never reads as market data. The pool
// leans into power/speed (the agent strikes fast), plus bull & bear for the
// market. Stored as a seed like `animal:tiger`; the Avatar component renders
// the matching crest everywhere the agent appears.
export const ANIMAL_AVATARS: { key: string; label: string; tile: string; ink: string }[] = [
  { key: 'leopard',  label: 'Leopard',  tile: '#F1ECDD', ink: '#6E5A1E' },
  { key: 'tiger',    label: 'Tiger',    tile: '#F6E7D2', ink: '#9A5512' },
  { key: 'lion',     label: 'Lion',     tile: '#F7EFD6', ink: '#917213' },
  { key: 'cheetah',  label: 'Cheetah',  tile: '#F3ECDB', ink: '#7E6320' },
  { key: 'panther',  label: 'Panther',  tile: '#E9E9EF', ink: '#3A3A52' },
  { key: 'wolf',     label: 'Wolf',     tile: '#E9ECF1', ink: '#3E4A63' },
  { key: 'fox',      label: 'Fox',      tile: '#F6E9E2', ink: '#9A4E2A' },
  { key: 'bear',     label: 'Bear',     tile: '#EFEAE2', ink: '#5E4A36' },
  { key: 'gorilla',  label: 'Gorilla',  tile: '#EAEBED', ink: '#41434A' },
  { key: 'eagle',    label: 'Eagle',    tile: '#E6F0FB', ink: '#1C5C9E' },
  { key: 'owl',      label: 'Owl',      tile: '#F0E9F2', ink: '#6E3A78' },
  { key: 'bull',     label: 'Bull',     tile: '#F4E9EC', ink: '#7E3146' },
  { key: 'ram',      label: 'Ram',      tile: '#ECEAE3', ink: '#5A5142' },
  { key: 'stag',     label: 'Stag',     tile: '#EFE9DF', ink: '#6B5530' },
  { key: 'boar',     label: 'Boar',     tile: '#EEE9E2', ink: '#6E5640' },
  { key: 'elephant', label: 'Elephant', tile: '#ECECEF', ink: '#4A4A57' },
  { key: 'rhino',    label: 'Rhino',    tile: '#EAEDEA', ink: '#3F5147' },
  { key: 'stallion', label: 'Stallion', tile: '#F0E9E1', ink: '#6B4A2E' },
  { key: 'shark',    label: 'Shark',    tile: '#E6EEF4', ink: '#2B5366' },
  { key: 'cobra',    label: 'Cobra',    tile: '#E2F1ED', ink: '#1F7A63' },
];

export const AVATAR_PRESETS: string[] = ANIMAL_AVATARS.map((a) => `animal:${a.key}`);

// Returns the animal key if the seed encodes one (`animal:tiger` → `tiger`).
export function animalKey(seed: string): string | null {
  return seed.startsWith('animal:') ? seed.slice('animal:'.length) : null;
}

// The editorial colorway for an animal crest.
export function animalColorway(key: string): { tile: string; ink: string } {
  const found = ANIMAL_AVATARS.find((a) => a.key === key);
  return found ? { tile: found.tile, ink: found.ink } : { tile: '#ECEAF7', ink: '#463E8C' };
}
