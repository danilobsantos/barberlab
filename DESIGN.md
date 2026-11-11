---
version: alpha
name: BarberLab
description: Dark-first SaaS for independent barbershops, using the existing emerald accent and shadcn/Tailwind components.
colors:
  background: "#151619"
  foreground: "#F8FAFC"
  surface: "#1A1B20"
  primary: "#22C55E"
  on-primary: "#FFFFFF"
  secondary: "#2B3B30"
  muted: "#A6B8AA"
  border: "#2B3B30"
  destructive: "#EF4444"
typography:
  display-lg: { fontFamily: Inter, fontSize: 36px, fontWeight: 600, lineHeight: 1.1, letterSpacing: -0.03em }
  display-md: { fontFamily: Inter, fontSize: 30px, fontWeight: 600, lineHeight: 1.2, letterSpacing: -0.02em }
  title-lg: { fontFamily: Inter, fontSize: 20px, fontWeight: 600, lineHeight: 1.3 }
  title-md: { fontFamily: Inter, fontSize: 16px, fontWeight: 600, lineHeight: 1.4 }
  body-lg: { fontFamily: Inter, fontSize: 16px, fontWeight: 400, lineHeight: 1.5 }
  body-md: { fontFamily: Inter, fontSize: 14px, fontWeight: 400, lineHeight: 1.5 }
  body-sm: { fontFamily: Inter, fontSize: 12px, fontWeight: 400, lineHeight: 1.5 }
  label-md: { fontFamily: Inter, fontSize: 14px, fontWeight: 500, lineHeight: 1.4 }
  button: { fontFamily: Inter, fontSize: 14px, fontWeight: 600, lineHeight: 1 }
rounded:
  sm: 4px
  md: 8px
  lg: 12px
  full: 9999px
spacing:
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    height: 40px
  text-input:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    height: 40px
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: 24px
---

# BarberLab

## Overview
Dark-first interface for barbershop owners and customers. Keep interactions direct, familiar, and accessible; use the existing green accent only for primary actions and positive states.

## Colors
The tokens mirror the dark theme in `app/globals.css`: charcoal surfaces, high-contrast foreground text, and an emerald primary color.

## Typography
Use the existing Inter font. Labels sit above inputs; helper and error text stay close to their field.

## Layout
Use Tailwind's 4px spacing rhythm and a centered, readable form width. Collapse multi-column content to one column below 768px.

## Elevation & Depth
Prefer subtle borders and tonal surfaces over heavy shadows.

## Shapes
Use 8px controls and 12px cards; keep the radius scale consistent within a page.

## Components
Reuse the existing shadcn/ui Button, Input, Label, and Card components. Preserve visible keyboard focus and inline validation feedback.

## Do's and Don'ts
- Do use explicit labels and associate errors with their fields.
- Do keep form actions keyboard-accessible and provide pending/success/error states.
- Don't rely on placeholders as labels or add decorative gradients unrelated to the current brand.
