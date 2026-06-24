/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // Editorial serif for display, clean sans for UI, mono for tickers.
      // Traditional-Chinese faces are matched in the stacks (see index.css).
      fontFamily: {
        display: ['Newsreader', 'Noto Serif TC', 'Songti TC', 'Georgia', 'serif'],
        sans: ['IBM Plex Sans', 'Noto Sans TC', 'PingFang TC', 'Microsoft JhengHei', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'Noto Sans TC', 'ui-monospace', 'monospace'],
      },
      // Colours bind to OKLCH CSS variables (declared in index.css) so the whole
      // app swaps palette when `<html data-theme="dark">` is set. The
      // `<alpha-value>` slot preserves opacity syntax, e.g. `bg-brand-600/40`.
      // The `brand` ramp is now greyscale, so existing `bg-brand-*` utilities
      // de-purple automatically.
      colors: {
        brand: {
          50:  'oklch(var(--brand-50)  / <alpha-value>)',
          100: 'oklch(var(--brand-100) / <alpha-value>)',
          200: 'oklch(var(--brand-200) / <alpha-value>)',
          300: 'oklch(var(--brand-300) / <alpha-value>)',
          400: 'oklch(var(--brand-400) / <alpha-value>)',
          500: 'oklch(var(--brand-500) / <alpha-value>)',
          600: 'oklch(var(--brand-600) / <alpha-value>)',
          700: 'oklch(var(--brand-700) / <alpha-value>)',
          800: 'oklch(var(--brand-800) / <alpha-value>)',
          900: 'oklch(var(--brand-900) / <alpha-value>)',
        },
        ink: {
          900: 'oklch(var(--ink-900) / <alpha-value>)',
          700: 'oklch(var(--ink-700) / <alpha-value>)',
          500: 'oklch(var(--ink-500) / <alpha-value>)',
          300: 'oklch(var(--ink-300) / <alpha-value>)',
          200: 'oklch(var(--ink-200) / <alpha-value>)',
          100: 'oklch(var(--ink-100) / <alpha-value>)',
          50:  'oklch(var(--ink-50)  / <alpha-value>)',
        },
        success: 'oklch(var(--success)  / <alpha-value>)',
        danger:  'oklch(var(--danger)   / <alpha-value>)',
        paper:   'oklch(var(--paper)    / <alpha-value>)',
        card:    'oklch(var(--card)     / <alpha-value>)',
        onbrand: 'oklch(var(--on-brand) / <alpha-value>)',
        accent:      'oklch(var(--accent)      / <alpha-value>)',
        'accent-2':  'oklch(var(--accent-2)    / <alpha-value>)',
        'accent-soft':'oklch(var(--accent-soft) / <alpha-value>)',
        onaccent:    'oklch(var(--on-accent)   / <alpha-value>)',
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(135deg, oklch(var(--accent)) 0%, oklch(var(--accent-2)) 100%)',
      },
      letterSpacing: {
        label: '0.16em',
        logo: '0.28em',
      },
      borderRadius: {
        sm: '2px',
        md: '4px',
        lg: '8px',
        xl2: '12px',
        pill: '999px',
      },
      // Hairline-first system: shadows reserved for true overlays. The legacy
      // soft/pop keys are kept (still referenced by components) but redefined
      // as subtle neutral elevation instead of a purple glow.
      boxShadow: {
        soft: '0 1px 2px oklch(0.17 0.006 280 / 0.06), 0 8px 24px -16px oklch(0.17 0.006 280 / 0.14)',
        pop:  '0 24px 60px -24px oklch(0.17 0.006 280 / 0.28)',
        overlay: '0 24px 60px -24px oklch(0.17 0.006 280 / 0.28)',
        sheet: '0 -8px 40px -16px oklch(0.17 0.006 280 / 0.22)',
      },
      transitionTimingFunction: {
        'out-quint': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'slide-in-right': {
          '0%':   { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-out-left': {
          '0%':   { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(-30%)', opacity: '0.6' },
        },
        // De-golded: a quiet monochrome pulse, no coloured glow.
        twinkle: {
          '0%, 100%': { opacity: '0.55', transform: 'scale(1)' },
          '50%':      { opacity: '1', transform: 'scale(1.12)' },
        },
        'fade-rise': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'sheet-up': {
          '0%':   { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
      animation: {
        'slide-in-right': 'slide-in-right 260ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-out-left': 'slide-out-left 260ms cubic-bezier(0.16, 1, 0.3, 1)',
        twinkle: 'twinkle 2s ease-in-out infinite',
        'fade-rise': 'fade-rise 320ms cubic-bezier(0.16, 1, 0.3, 1)',
        'sheet-up': 'sheet-up 320ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
