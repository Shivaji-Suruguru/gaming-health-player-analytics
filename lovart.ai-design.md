---
version: alpha
name: Lovart Light
description: A bright, minimal creative workspace with a playful neon accent, soft cards, and Inter-led utility typography.
colors:
  primary: "#100F09"
  secondary: "#5B5B56"
  tertiary: "#E5E7EB"
  neutral: "#F9F8F6"
  surface: "#FFFFFF"
  on-surface: "#100F09"
  accent: "#E1FF67"
  border: "#E5E7EB"
  muted: "#F3F2EE"
  overlay: "#000000"
  error: "#D92D20"
typography:
  headline-display:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: 700
    lineHeight: 38px
    letterSpacing: 0px
  headline-lg:
    fontFamily: Inter
    fontSize: 26px
    fontWeight: 400
    lineHeight: 31px
    letterSpacing: 0px
  headline-md:
    fontFamily: Inter
    fontSize: 21px
    fontWeight: 400
    lineHeight: 25px
    letterSpacing: 0px
  headline-sm:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: 400
    lineHeight: 20px
    letterSpacing: 0px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 25px
    letterSpacing: 0px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    lineHeight: 25px
    letterSpacing: 0px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 400
    lineHeight: 18px
    letterSpacing: 0px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 600
    lineHeight: 20px
    letterSpacing: 0px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 500
    lineHeight: 20px
    letterSpacing: 0px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 500
    lineHeight: 16px
    letterSpacing: 0px
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 400
    lineHeight: 16px
    letterSpacing: 0px
rounded:
  none: 0px
  sm: 4px
  md: 8px
  lg: 12px
  xl: 16px
  full: 9999px
spacing:
  xs: 2px
  sm: 6px
  md: 10px
  lg: 14px
  xl: 16px
  section: 32px
  gutter: 24px
  page: 48px
components:
  button-primary:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.none}"
    padding: "0px 0px 8px"
  button-primary-hover:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.none}"
    padding: "0px 0px 8px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.none}"
    padding: "0px 0px 8px"
  button-tertiary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: "8px 12px"
  card:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: "16px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: "16px"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: "8px 12px"
  banner:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.none}"
    padding: "8px 16px"
---

# Lovart Light

## Overview
Lovart feels like a clean, modern creative studio: airy, utility-first, and lightly playful. The interface is mostly neutral and spacious, with a high-visibility neon accent used sparingly to signal promotions and important actions. It is designed for an audience of creators and marketers who want speed, clarity, and low-friction browsing across tools and templates.

## Colors
- **Primary (#100F09):** A near-black ink used for most text, icons, and important affordances. It gives the product a crisp editorial tone without feeling harsh.
- **Secondary (#5B5B56):** A softer graphite for secondary labels, subdued navigation items, and less prominent supporting text.
- **Tertiary (#E5E7EB):** A light neutral gray used for borders, separators, and delicate UI framing.
- **Neutral (#F9F8F6):** The warm off-white page base. It keeps the workspace feeling bright, open, and slightly warm rather than clinical.
- **Surface (#FFFFFF):** Pure white used for cards, inputs, and floating UI elements that need to sit above the base canvas.
- **Accent (#E1FF67):** A vivid yellow-green highlight reserved for the top promo banner and other attention-grabbing moments. It is intentionally loud and should be used sparingly.
- **Border (#E5E7EB):** The canonical divider color for outlines, chips, and card edges; subtle enough to preserve the minimal look.
- **Muted (#F3F2EE):** A soft filler tone for low-emphasis panels or inactive backgrounds.
- **Overlay (#000000):** Used for strong contrast elements like filled circular controls and dark media surfaces.
- **Error (#D92D20):** Reserved for destructive states, validation, and urgent system feedback.

## Typography
Inter is the sole typeface and should remain the default across the product for a clean, contemporary feel. Headlines are light-to-bold depending on emphasis: `headline-display` and `label-lg` carry strong presence for key UI moments, while `headline-lg`, `headline-md`, and `headline-sm` stay regular-weight for a soft, approachable hierarchy. Body copy uses `body-md` as the core reading size, with `body-lg` for more prominent explanatory content and `body-sm`/`caption` for metadata and secondary notes. Labels are slightly heavier than body text to improve scanability in chips, navigation, and actions. Letter spacing is visually neutral; there is no uppercase tracking system in the source, so avoid forced all-caps styling unless it is functionally necessary.

## Layout
The page is built on a wide, fluid canvas with generous whitespace and content blocks that breathe rather than stack densely. Sections align to a simple centered rhythm, with large top padding around the hero and consistent horizontal gutters for tool grids and content rails. Spacing is restrained and modular: 2px, 6px, 10px, 14px, and 16px provide the core rhythm, while larger section spacing and page padding create separation between major zones. Cards and tool thumbnails are arranged in clean rows with even gaps, and content should favor clear alignment over complex nesting.

## Elevation & Depth
The system is mostly flat, relying on contrast, white space, and soft borders instead of dramatic shadows. When depth is needed, use a subtle low-shadow treatment like the card and floating controls seen in the screenshot; avoid stacking multiple shadow layers. Inputs, chips, and cards should feel lightly lifted but still close to the page surface. The neon banner is the main exception, using color rather than elevation to command attention.

## Shapes
The shape language is gentle and pragmatic. Cards and major fields use modest rounding in the 8px to 16px range, while pills and filter chips go fully rounded. Interactive utility controls can be more circular or square, but there is no highly decorative curvature. Overall, the geometry feels soft, modern, and restrained rather than playful or bubbly.

## Components
Buttons are understated and text-forward. `button-primary` and `button-secondary` should read as simple inline actions with transparent backgrounds, minimal or no border treatment, and bold text emphasis rather than filled button chrome. `button-primary-hover` should not introduce heavy visual effects; keep state changes subtle and grounded in contrast or underline behavior. `button-tertiary` is appropriate for small pill-like actions and can use full rounding and light surface fill when an action needs more presence.

Cards should use the `card` treatment: surface or neutral backgrounds, a 1px border, `rounded.md`, and generous internal padding. They should support image-led layouts with captions below, preserving the spacious feel of the interface. Inputs should feel like large, inviting prompt fields: `input` uses a white surface, a soft border, and `rounded.lg` so the field reads as a central composition anchor. Chips use `chip` styling with full rounding, modest padding, and compact labels; selected chips can be inferred through stronger contrast or filled backgrounds, but should remain visually light. The promo banner should use `banner` with the accent color and minimal embellishment. Icons and utility controls should stay thin-lined and monochrome, with filled dark states reserved for primary submission or playback-like actions.

## Do's and Don'ts
- Do keep the interface airy, with large areas of negative space around primary workflows.
- Do use `#100F09` for the majority of text and iconography to maintain the crisp editorial contrast.
- Do reserve `#E1FF67` for high-priority promotional or attention states only.
- Do favor thin borders and soft cards over heavy shadows or glassmorphism.
- Do keep chips and pills simple, compact, and fully rounded.
- Don't introduce loud gradients, saturated multicolor UI, or decorative texture in core surfaces.
- Don't use oversized radii on cards or inputs; the system should feel refined, not bubbly.
- Don't turn actions into bulky filled buttons unless they are truly primary and high-stakes.