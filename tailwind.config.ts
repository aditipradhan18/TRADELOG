import type { Config } from 'tailwindcss'

const c = (n: string) => `rgb(var(--${n}) / <alpha-value>)`

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    borderRadius: { none: '0', sm: '1px', DEFAULT: '2px', md: '2px', lg: '2px', xl: '2px', '2xl': '2px', full: '9999px' },
    extend: {
      colors: { bg: c('bg'), card: c('card'), el: c('el'), line: c('line'), accent: c('accent'), accent2: c('accent2'), profit: c('profit'), loss: c('loss'), ink: c('ink'), mute: c('mute') },
      fontFamily: { sans: ['"Inter Variable"', 'system-ui', 'sans-serif'], mono: ['"JetBrains Mono Variable"', 'ui-monospace', 'monospace'] },
    },
  },
  plugins: [],
} satisfies Config
