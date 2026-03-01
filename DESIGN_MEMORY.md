## Design Memory

- Direction: **Field** (warm matte surfaces, sage green accent)
- Component library: CVA-based primitives in `components/ui/`
- Font: Plus Jakarta Sans (body + display, weights 400–800), Geist Mono (mono)
- Primary accent: `#5a9680` (sage green) light / `#6aaa92` dark
- Background: `#fbfaf9` (warm stone) light / `#161c1a` (deep forest) dark
- Elevated surfaces: `#ffffff` light / `#1a2220` dark — **matte only, no frosted glass**
- Borders: warm translucent (`rgba(28,35,32,0.12)` light, `rgba(240,238,235,0.1)` dark)
- Radius: sm=6px, md=12px, lg=16px, xl=20px, **full=9999px (pills)**
- Status: sage `#5a9680` / amber `#d9a441` / brick `#b35a4d` (light)
- Card anatomy: `bg-white rounded-xl shadow-sm border border-[var(--color-border-subtle)] p-8`
- Pill badge: `bg-[var(--color-accent-primary)]/10 px-3 py-1 rounded-full text-[var(--color-accent-primary)] text-xs font-bold uppercase tracking-wide`
- CTA button: `bg-[var(--color-accent-primary)] text-white px-8 py-3 rounded-full font-bold shadow-sm shadow-primary/20`
- Sticky header: `header-glass` class (bg-white/85 + backdrop-blur — only place glass is used)
- Vetoes: **no frosted glass on main card surfaces**, no blue accent, no slate-900/dark-navy bg, no glass-panel class on cards
- Previous systems: Kyoto Moss (Japanese minimalism) → Glass (Tremor/Vercel, blue) → Field (current)
- Design preset: `lib/design/presets/field.ts` — `fieldTheme`
- Last updated: 2026-02-27
