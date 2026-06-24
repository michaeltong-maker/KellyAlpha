// Hand-drawn animal-crest emblems. Each returns the inner SVG markup for a
// 100×100 viewBox (the Avatar component supplies the tinted disc and the
// stamped-seal ring). Three tones give the crests depth and character:
//   ink  — the silhouette
//   mid  — secondary fills (inner ears, muzzles, fins) for dimension
//   soft — eye whites + highlights, so the gaze has life
// A catch-light and angled brows give the predators attitude.

function mix(a: string, b: string, t: number): string {
  const pa = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)];
  const pb = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)];
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}

// One characterful eye: soft sclera, ink iris, white catch-light.
function eye(cx: number, cy: number, r: number, i: string, s: string): string {
  return (
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${s}"/>` +
    `<circle cx="${cx}" cy="${(cy + r * 0.12).toFixed(1)}" r="${(r * 0.58).toFixed(1)}" fill="${i}"/>` +
    `<circle cx="${(cx - r * 0.28).toFixed(1)}" cy="${(cy - r * 0.28).toFixed(1)}" r="${(r * 0.22).toFixed(1)}" fill="#ffffff"/>`
  );
}

// A pair of eyes, optionally with fierce inward-down brows.
function eyes(lx: number, rx: number, cy: number, r: number, i: string, s: string, brow = false): string {
  let out = eye(lx, cy, r, i, s) + eye(rx, cy, r, i, s);
  if (brow) {
    out +=
      `<path d="M${lx - r - 2} ${cy - r - 3} L${lx + r} ${cy - r + 1}" stroke="${i}" stroke-width="2.6" fill="none" stroke-linecap="round"/>` +
      `<path d="M${rx + r + 2} ${cy - r - 3} L${rx - r} ${cy - r + 1}" stroke="${i}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  }
  return out;
}

export function animalArt(key: string, tile: string, ink: string): string {
  const i = ink;
  const m = mix(ink, tile, 0.5);
  const s = mix(tile, '#ffffff', 0.6);
  const nose = (cx: number, cy: number, w: number) => `<path d="M${cx} ${cy + w} l${w} -${w} h-${2 * w} z" fill="${i}"/>`;

  switch (key) {
    case 'lion': {
      const petals = [0, 40, 80, 120, 160, 200, 240, 280, 320]
        .map((a) => { const r = 25, x = 50 + r * Math.cos(a * Math.PI / 180), y = 48 + r * Math.sin(a * Math.PI / 180); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="12" fill="${i}"/>`; })
        .join('');
      const petalsM = [20, 60, 100, 140, 180, 220, 260, 300, 340]
        .map((a) => { const r = 25, x = 50 + r * Math.cos(a * Math.PI / 180), y = 48 + r * Math.sin(a * Math.PI / 180); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" fill="${m}"/>`; })
        .join('');
      return `${petalsM}${petals}<circle cx="50" cy="50" r="19" fill="${i}"/><ellipse cx="50" cy="61" rx="11" ry="7.5" fill="${m}"/>${nose(50, 56, 4)}<path d="M50 60 v5" stroke="${i}" stroke-width="1.6"/>${eyes(42, 58, 47, 4, i, s, true)}`;
    }
    case 'tiger':
      return `<circle cx="34" cy="32" r="9.5" fill="${i}"/><circle cx="66" cy="32" r="9.5" fill="${i}"/><circle cx="34" cy="33" r="4" fill="${m}"/><circle cx="66" cy="33" r="4" fill="${m}"/><ellipse cx="50" cy="53" rx="24" ry="25" fill="${i}"/>` +
        `<path d="M27 47 q4 7 3 15" stroke="${m}" stroke-width="3.2" fill="none" stroke-linecap="round"/><path d="M73 47 q-4 7 -3 15" stroke="${m}" stroke-width="3.2" fill="none" stroke-linecap="round"/><path d="M46 30 v9 M54 30 v9" stroke="${m}" stroke-width="3.2" fill="none" stroke-linecap="round"/>` +
        `<ellipse cx="50" cy="63" rx="12" ry="7.5" fill="${m}"/>${nose(50, 59, 4.5)}<path d="M50 63 v4" stroke="${i}" stroke-width="1.6"/>${eyes(41, 59, 47, 4.2, i, s, true)}`;
    case 'leopard': {
      const spots = [[38, 43], [62, 43], [33, 57], [67, 57], [50, 38], [43, 67], [57, 67], [50, 55]]
        .map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="2.8" fill="${m}"/>`).join('');
      return `<circle cx="35" cy="33" r="8.5" fill="${i}"/><circle cx="65" cy="33" r="8.5" fill="${i}"/><circle cx="35" cy="34" r="3.6" fill="${m}"/><circle cx="65" cy="34" r="3.6" fill="${m}"/><ellipse cx="50" cy="54" rx="23" ry="24" fill="${i}"/>${spots}<ellipse cx="50" cy="64" rx="10.5" ry="6.5" fill="${m}"/>${nose(50, 60, 4)}${eyes(42, 58, 48, 4, i, s, true)}`;
    }
    case 'cheetah': {
      const spots = [[40, 43], [60, 43], [36, 57], [64, 57], [50, 40], [46, 65], [56, 67]]
        .map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="2.3" fill="${m}"/>`).join('');
      return `<circle cx="36" cy="33" r="7.5" fill="${i}"/><circle cx="64" cy="33" r="7.5" fill="${i}"/><ellipse cx="50" cy="54" rx="22" ry="24" fill="${i}"/>${spots}<path d="M44 51 q-2 13 -5 22" stroke="${m}" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M56 51 q2 13 5 22" stroke="${m}" stroke-width="2.6" fill="none" stroke-linecap="round"/><ellipse cx="50" cy="64" rx="9.5" ry="6" fill="${m}"/>${nose(50, 60, 3.6)}${eyes(42, 58, 47, 4, i, s, true)}`;
    }
    case 'panther':
      return `<path d="M28 40 L40 24 L46 38 Z" fill="${i}"/><path d="M72 40 L60 24 L54 38 Z" fill="${i}"/><path d="M30 36 L42 26 L44 38 Z" fill="${m}"/><path d="M70 36 L58 26 L56 38 Z" fill="${m}"/><ellipse cx="50" cy="54" rx="22" ry="24" fill="${i}"/><ellipse cx="50" cy="64" rx="9.5" ry="6" fill="${m}"/>${nose(50, 60, 4)}<path d="M36 50 q6 -3 11 0 M64 50 q-6 -3 -11 0" stroke="${m}" stroke-width="2" fill="none" stroke-linecap="round"/>${eyes(41, 59, 49, 4.4, i, s, true)}`;
    case 'wolf':
      return `<path d="M26 42 L32 13 L47 38 Z" fill="${i}"/><path d="M74 42 L68 13 L53 38 Z" fill="${i}"/><path d="M30 16 L43 37 L37 38 Z" fill="${m}"/><path d="M70 16 L57 37 L63 38 Z" fill="${m}"/><path d="M30 44 L44 40 L50 44 L56 40 L70 44 L63 66 L50 82 L37 66 Z" fill="${i}"/><path d="M40 64 L50 60 L60 64 L50 78 Z" fill="${m}"/><ellipse cx="50" cy="70" rx="6" ry="5" fill="${m}"/>${nose(50, 65, 4)}${eyes(40, 60, 50, 4, i, s, true)}`;
    case 'fox':
      return `<path d="M25 49 L31 11 L49 40 Z" fill="${i}"/><path d="M75 49 L69 11 L51 40 Z" fill="${i}"/><path d="M31 16 L45 39 L38 41 Z" fill="${m}"/><path d="M69 16 L55 39 L62 41 Z" fill="${m}"/><path d="M30 42 Q50 39 70 42 L53 78 Q50 83 47 78 Z" fill="${i}"/><path d="M37 50 Q50 48 63 50 L52 73 Q50 76 48 73 Z" fill="${m}"/>${nose(50, 70, 4)}${eyes(41, 59, 49, 4, i, s, true)}`;
    case 'bear':
      return `<circle cx="31" cy="31" r="11" fill="${i}"/><circle cx="69" cy="31" r="11" fill="${i}"/><circle cx="31" cy="32" r="5.5" fill="${m}"/><circle cx="69" cy="32" r="5.5" fill="${m}"/><circle cx="50" cy="55" r="25" fill="${i}"/><ellipse cx="50" cy="65" rx="13" ry="10" fill="${m}"/><ellipse cx="50" cy="58" rx="4.5" ry="3.5" fill="${i}"/>${eyes(41, 59, 49, 3.8, i, s)}`;
    case 'gorilla':
      return `<circle cx="27" cy="50" r="9" fill="${i}"/><circle cx="73" cy="50" r="9" fill="${i}"/><circle cx="27" cy="50" r="4" fill="${m}"/><circle cx="73" cy="50" r="4" fill="${m}"/><path d="M30 42 Q50 30 70 42 L66 66 Q50 82 34 66 Z" fill="${i}"/><path d="M33 46 Q50 40 67 46 L64 53 Q50 49 36 53 Z" fill="${i}"/><path d="M38 60 Q50 56 62 60 Q58 72 50 73 Q42 72 38 60 Z" fill="${m}"/><ellipse cx="50" cy="62" rx="4.5" ry="3" fill="${i}"/>${eyes(42, 58, 52, 3.6, i, s, true)}`;
    case 'eagle':
      return `<path d="M27 42 Q50 18 73 42 Q73 54 60 58 L40 58 Q27 54 27 42 Z" fill="${i}"/><path d="M30 32 Q35 25 44 28 M70 32 Q65 25 56 28" stroke="${i}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M44 56 L56 56 L54 68 Q54 80 50 82 Q46 78 46 68 Z" fill="${m}"/><path d="M44 56 L56 56 L55 62 L45 62 Z" fill="${i}"/>${eye(40, 44, 4, i, s)}${eye(60, 44, 4, i, s)}<path d="M33 40 L44 45 M67 40 L56 45" stroke="${i}" stroke-width="2.6" stroke-linecap="round"/>`;
    case 'owl':
      return `<path d="M30 30 L40 12 L47 31 Z" fill="${i}"/><path d="M70 30 L60 12 L53 31 Z" fill="${i}"/><ellipse cx="50" cy="52" rx="26" ry="24" fill="${i}"/><circle cx="39" cy="47" r="10" fill="${m}"/><circle cx="61" cy="47" r="10" fill="${m}"/><circle cx="39" cy="47" r="5" fill="${i}"/><circle cx="61" cy="47" r="5" fill="${i}"/><circle cx="37.5" cy="45.5" r="1.8" fill="#ffffff"/><circle cx="59.5" cy="45.5" r="1.8" fill="#ffffff"/><path d="M50 54 l5 8 h-10 z" fill="${m}"/>`;
    case 'bull':
      return `<path d="M40 33 Q19 31 13 15 Q12 10 17 11 Q23 24 42 29 Z" fill="${i}"/><path d="M60 33 Q81 31 87 15 Q88 10 83 11 Q77 24 58 29 Z" fill="${i}"/><path d="M40 33 Q22 31 16 17" stroke="${m}" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M60 33 Q78 31 84 17" stroke="${m}" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M30 38 L41 42 L37 51 Z" fill="${i}"/><path d="M70 38 L59 42 L63 51 Z" fill="${i}"/><path d="M36 31 Q50 26 64 31 L61 62 Q50 75 39 62 Z" fill="${i}"/><ellipse cx="50" cy="61" rx="11.5" ry="8" fill="${m}"/><circle cx="46" cy="61" r="1.9" fill="${i}"/><circle cx="54" cy="61" r="1.9" fill="${i}"/>${eyes(42, 58, 45, 3.8, i, s, true)}`;
    case 'ram':
      return `<path d="M40 40 Q22 36 22 50 Q22 60 31 59 Q38 59 37 51 Q37 46 31 48" fill="none" stroke="${i}" stroke-width="6" stroke-linecap="round"/><path d="M60 40 Q78 36 78 50 Q78 60 69 59 Q62 59 63 51 Q63 46 69 48" fill="none" stroke="${i}" stroke-width="6" stroke-linecap="round"/><path d="M33 44 L41 48 L37 55 Z" fill="${m}"/><path d="M67 44 L59 48 L63 55 Z" fill="${m}"/><path d="M40 40 Q50 36 60 40 L57 66 Q50 74 43 66 Z" fill="${i}"/><ellipse cx="50" cy="64" rx="8" ry="6" fill="${m}"/>${nose(50, 61, 3.4)}${eyes(43, 57, 50, 3.6, i, s)}`;
    case 'stag':
      return `<path d="M44 44 L36 22 M40 30 L29 26 M40 30 L33 18 M44 38 L33 36" stroke="${i}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M56 44 L64 22 M60 30 L71 26 M60 30 L67 18 M56 38 L67 36" stroke="${i}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M34 46 L41 40 L43 50 Z" fill="${m}"/><path d="M66 46 L59 40 L57 50 Z" fill="${m}"/><path d="M42 46 Q50 42 58 46 L54 78 Q50 84 46 78 Z" fill="${i}"/><ellipse cx="50" cy="72" rx="6" ry="5" fill="${m}"/>${nose(50, 68, 3.4)}${eyes(44, 56, 52, 3.4, i, s)}`;
    case 'boar':
      return `<path d="M32 38 L40 26 L45 39 Z" fill="${i}"/><path d="M68 38 L60 26 L55 39 Z" fill="${i}"/><path d="M34 42 Q50 36 66 42 L60 68 Q50 76 40 68 Z" fill="${i}"/><ellipse cx="50" cy="64" rx="10" ry="7" fill="${m}"/><circle cx="46" cy="64" r="1.8" fill="${i}"/><circle cx="54" cy="64" r="1.8" fill="${i}"/><path d="M43 70 Q38 64 41 55 Q44 62 46 70 Z" fill="${s}"/><path d="M57 70 Q62 64 59 55 Q56 62 54 70 Z" fill="${s}"/>${eyes(42, 58, 48, 3.6, i, s, true)}`;
    case 'elephant':
      return `<ellipse cx="27" cy="50" rx="18" ry="21" fill="${i}"/><ellipse cx="73" cy="50" rx="18" ry="21" fill="${i}"/><ellipse cx="29" cy="51" rx="11" ry="13" fill="${m}"/><ellipse cx="71" cy="51" rx="11" ry="13" fill="${m}"/><ellipse cx="50" cy="47" rx="17" ry="22" fill="${i}"/><path d="M44 56 L56 56 L55 81 Q55 90 48 90 Q45 88 45 81 Z" fill="${i}"/><path d="M46 72 q4 6 8 0 l-1.5 7 q-2.5 4 -5 0 Z" fill="${m}"/><path d="M44 73 L40 87 L44 87 Z" fill="${s}"/><path d="M56 73 L60 87 L56 87 Z" fill="${s}"/>${eyes(42, 58, 45, 3.4, i, s)}`;
    case 'rhino':
      return `<circle cx="33" cy="34" r="7.5" fill="${i}"/><circle cx="67" cy="34" r="7.5" fill="${i}"/><circle cx="33" cy="34" r="3.4" fill="${m}"/><circle cx="67" cy="34" r="3.4" fill="${m}"/><path d="M34 40 Q50 34 66 40 L60 70 Q50 80 40 70 Z" fill="${i}"/><path d="M50 56 Q44 42 50 24 Q56 42 50 56 Z" fill="${i}"/><path d="M50 57 Q47 46 50 32 Q53 46 50 57 Z" fill="${m}"/><path d="M50 64 q-3.5 8 0 13 q3.5 -5 0 -13 Z" fill="${i}"/><ellipse cx="50" cy="71" rx="8" ry="5" fill="${m}"/><circle cx="46" cy="71" r="1.6" fill="${i}"/><circle cx="54" cy="71" r="1.6" fill="${i}"/>${eyes(40, 60, 47, 3.4, i, s, true)}`;
    case 'stallion':
      return `<path d="M40 86 C36 60 38 44 52 34 C56 30 60 26 58 21 C65 24 71 31 71 41 C71 53 65 61 63 86 Z" fill="${i}"/><path d="M55 30 L61 17 L66 31 Z" fill="${i}"/><path d="M58 23 Q73 30 71 56 L64 54 Q67 34 56 30 Z" fill="${m}"/><path d="M44 84 L41 60 Q44 46 54 38 L57 44 Q48 52 47 62 L49 84 Z" fill="${m}"/>${eye(56, 41, 3.8, i, s)}<ellipse cx="44" cy="74" rx="3" ry="4" fill="${m}"/>`;
    case 'shark':
      return `<path d="M14 53 C30 42 56 43 76 47 L72 58 C56 63 30 64 14 57 Z" fill="${i}"/><path d="M52 44 L60 27 L67 45 Z" fill="${i}"/><path d="M73 47 L90 36 L84 53 L90 70 L72 59 Z" fill="${i}"/><path d="M30 52 C42 48 58 49 70 52 L68 56 C56 53 42 53 30 55 Z" fill="${m}"/><path d="M16 57 l5 4 l5 -4 l5 4 l5 -4 l5 4 l5 -4 l5 4 l5 -4 l5 4" fill="none" stroke="${s}" stroke-width="1.6" stroke-linejoin="round"/>${eye(28, 50, 3.6, i, s)}<path d="M40 47 l-1 8 M46 46 l-1 9 M52 46 l-1 9" stroke="${m}" stroke-width="1.6" stroke-linecap="round"/>`;
    case 'cobra':
      return `<path d="M50 30 C24 32 20 66 35 84 Q50 94 65 84 C80 66 76 32 50 30 Z" fill="${i}"/><path d="M50 38 C34 40 31 64 41 80 Q50 87 59 80 C69 64 66 40 50 38 Z" fill="${m}"/><path d="M40 56 a5 5 0 1 0 0.1 0 M60 56 a5 5 0 1 0 0.1 0" fill="${i}"/><ellipse cx="50" cy="32" rx="10" ry="8" fill="${i}"/>${eye(45, 31, 3, s, i)}${eye(55, 31, 3, s, i)}<path d="M50 24 l-3 -7 M50 24 l3 -7" stroke="${i}" stroke-width="1.8" stroke-linecap="round"/>`;
    default:
      return `<circle cx="50" cy="52" r="22" fill="${i}"/>${eyes(43, 57, 48, 4, i, s)}`;
  }
}
