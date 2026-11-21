# NovaPay design system

Source of truth: `docs/design-reference-mockup.jpg` (approved app mockup) and
`apps/web/public/brand/novapay-logo-original.jpg` (logo).

- **Logo:** `components/logo.tsx` — the N mark (ribbon, card-with-chip leg, orbit) redrawn as SVG
  so it is crisp at any size and works on light and dark. The original file has a green/blue halo
  from background removal; please supply a transparent PNG or SVG master for print/app stores.
- **Type:** serif (Times New Roman) for headings and balances, as in the mockup; Inter for interface
  text; Montserrat Bold for the wordmark only. This replaces README §5.4's "Times New Roman
  everywhere" — the mockup was approved afterwards.
- **Tokens:** `app/globals.css` — every colour is a semantic variable redefined per theme.
- **Card network mark:** hidden until a programme agreement allows it. Set
  `NEXT_PUBLIC_CARD_NETWORK=visa` (or `mastercard`) to show it.
- **Merchant logos:** transactions show a coloured initial, not third-party logos.
