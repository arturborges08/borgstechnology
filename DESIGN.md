---
name: Borgs
description: Modern dark glass product UI for spec-driven first-person video collection; orange and white on warm black.
colors:
  warm-black: "#070505"
  warm-black-raised: "#0F0A08"
  glass-panel: "rgba(30,21,16,.64)"
  glass-highlight: "rgba(255,255,255,.045)"
  hairline: "rgba(255,255,255,.09)"
  hairline-warm: "rgba(255,138,61,.28)"
  signal-orange: "#FF6A1A"
  amber-light: "#FF9B42"
  apricot: "#FFC08A"
  ember: "#B8400B"
  action-top: "#C8450A"
  action-bottom: "#AE3A07"
  action-solid: "#B83E08"
  action-hover: "#9E3406"
  white: "#FFFFFF"
  ash: "#DCD2CA"
  smoke: "#A89A8F"
  smoke-app: "#B5A79C"
  approved-green: "#4ADE80"
  approved-green-bg: "rgba(74,222,128,.12)"
  pending-amber: "#FFB061"
  pending-amber-bg: "rgba(255,155,66,.14)"
  rejected-coral: "#FF7A5C"
  rejected-coral-bg: "rgba(255,122,92,.12)"
typography:
  display:
    fontFamily: "Manrope, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "clamp(2.6rem, 6.4vw, 5.6rem)"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Manrope, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "clamp(2.1rem, 4.4vw, 3.6rem)"
    fontWeight: 800
    lineHeight: 1.03
    letterSpacing: "-0.035em"
  accent:
    fontFamily: "'Instrument Serif', Georgia, 'Times New Roman', serif"
    fontWeight: 400
    letterSpacing: "-0.01em"
  page-title:
    fontFamily: "Manrope, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "clamp(1.7rem, 3vw, 2.3rem)"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Manrope, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "1.18rem"
    fontWeight: 700
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Manrope, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "16.5px"
    fontWeight: 400
    lineHeight: 1.6
  body-app:
    fontFamily: "Manrope, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.55
  label-table:
    fontFamily: "Manrope, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.72rem"
    fontWeight: 700
    letterSpacing: "0.06em"
  data:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "0.8rem"
    fontWeight: 600
    fontFeature: "tnum"
rounded:
  control-app: "8px"
  chip: "10px"
  control: "12px"
  button-app: "11px"
  button: "14px"
  card: "16px"
  panel: "22px"
  feature: "28px"
  pill: "999px"
spacing:
  gutter-app: "16px"
  gutter: "20px"
  gap: "16px"
  card-pad: "22px"
  tile-pad: "26px"
  section-mobile: "96px"
  section: "128px"
  container-app: "980px"
  container: "1200px"
components:
  button-primary:
    backgroundColor: "{colors.action-solid}"
    textColor: "{colors.white}"
    typography: "{typography.title}"
    rounded: "{rounded.button}"
    padding: "15px 22px"
  button-primary-app:
    backgroundColor: "{colors.action-solid}"
    textColor: "{colors.white}"
    rounded: "{rounded.button-app}"
    padding: "11px 18px"
  button-primary-app-hover:
    backgroundColor: "{colors.action-hover}"
  button-ghost:
    backgroundColor: "{colors.glass-highlight}"
    textColor: "{colors.white}"
    rounded: "{rounded.button}"
    padding: "15px 22px"
  button-light:
    backgroundColor: "{colors.white}"
    textColor: "#1A0D05"
    rounded: "{rounded.button}"
    padding: "15px 22px"
  button-danger:
    backgroundColor: "{colors.rejected-coral-bg}"
    textColor: "{colors.rejected-coral}"
    rounded: "{rounded.button-app}"
    padding: "11px 18px"
  input:
    backgroundColor: "rgba(0,0,0,.35)"
    textColor: "{colors.white}"
    rounded: "{rounded.control}"
    padding: "13px 14px"
  input-app:
    backgroundColor: "rgba(6,4,3,.55)"
    textColor: "{colors.white}"
    rounded: "{rounded.control-app}"
    padding: "10px 12px"
  card:
    backgroundColor: "{colors.glass-panel}"
    rounded: "{rounded.card}"
    padding: "{spacing.card-pad}"
  tile:
    backgroundColor: "{colors.glass-panel}"
    rounded: "{rounded.panel}"
    padding: "{spacing.tile-pad}"
  pill-approved:
    backgroundColor: "{colors.approved-green-bg}"
    textColor: "{colors.approved-green}"
    rounded: "{rounded.pill}"
    padding: "3px 9px"
  pill-pending:
    backgroundColor: "{colors.pending-amber-bg}"
    textColor: "{colors.pending-amber}"
    rounded: "{rounded.pill}"
    padding: "3px 9px"
  pill-rejected:
    backgroundColor: "{colors.rejected-coral-bg}"
    textColor: "{colors.rejected-coral}"
    rounded: "{rounded.pill}"
    padding: "3px 9px"
  chip:
    backgroundColor: "rgba(255,255,255,.05)"
    textColor: "{colors.ash}"
    typography: "{typography.data}"
    rounded: "{rounded.chip}"
    padding: "8px 12px"
  chip-on:
    backgroundColor: "rgba(255,106,26,.16)"
    textColor: "{colors.apricot}"
  nav-item-active:
    backgroundColor: "{colors.white}"
    textColor: "#120B07"
    rounded: "{rounded.control-app}"
    padding: "8px 12px"
---

# Design System: Borgs

## Overview

**Creative North Star: "The Warm Control Room"**

Borgs is a modern dark product platform played straight: a warm near-black room lit from above by a soft orange bloom, with frosted glass panels floating in it. The product itself is the hero. On the public landing (Persuade) a working review console, with a clip frame, its metadata record and approve/reject controls, sits directly under the headline; in the contributor and admin app (Operate) the same glass, hairlines and status colours carry tables, queues and forms at a tighter density. The user chose this category standard against their own references (dark premium dashboards with warm brown/orange glass, monochrome cinematic landings, analytics UI) and rejected a concept-led darkroom world; that choice is standing.

The palette is orange and white on warm black. Orange is light, not paint: it arrives as the background bloom, the brand tile's gradient, a deep ember fill on primary actions, and small warm accents on borders and icons. White carries type and the inverted "selected" state. Status is a separate, functional vocabulary (green approved, amber pending, coral rejected) that never doubles as decoration.

Type is a single confident sans (Manrope, heavy and tightly tracked at display sizes) with one editorial voice: Instrument Serif italic for the accent phrase inside a landing headline. Data (clip IDs, durations, metadata, chips) is set in the system monospace with tabular numerals, because honest metadata is the product.

**Key Characteristics:**
- Warm black ground (never neutral grey, never pure #000) with radial orange blooms.
- Frosted glass panels: translucent warm-brown fill, 1px white hairline, inset top highlight, blur.
- Primary action is a deep ember gradient with white text; brand orange itself is too light to carry white text.
- One serif italic accent phrase per landing headline; everything else Manrope.
- Monospace with tabular numerals for every piece of clip data and money.
- Status colours are semantic only: green approved, amber pending, coral rejected.
- Conversion surfaces move: travelling gradient border, pulse, approve tick drawing in, form success check.

## Colors

Warm black and glass, lit by orange, with white type and a strictly semantic status set.

### Primary
- **Signal Orange** (signal-orange): the brand orange. Background blooms, the brand tile gradient, selection highlight, caret, progress fills, the first step marker, the active console thumbnail ring, highlighted bars. Used as light and as small solid marks, never as a large text-bearing fill.
- **Ember Action** (action-top to action-bottom gradient; action-solid as the flat fallback): the fill for every primary button on both surfaces. Deep enough that white text passes contrast. In the app, hover drops to **Ember Pressed** (action-hover).
- **Amber Light** (amber-light): links, icon strokes in glass tiles, focus rings, serif accent words in headlines, step numbers.
- **Apricot** (apricot): text on warm-tinted chips and pending pills on the landing; the lightest step of the orange family.
- **Ember** (ember): the deep end of the orange family, reserved for the orange contributor feature panel and brand gradients.

### Neutral
- **Warm Black** (warm-black): page background on both surfaces. **Warm Black Raised** (warm-black-raised) for the occasional solid raised ground.
- **Glass Panel** (glass-panel): fill of tiles, cards, FAQ items, the pilot form. **Glass Highlight** (glass-highlight): ghost buttons, language toggle track, nav hover.
- **Hairline** (hairline): every border and divider. **Warm Hairline** (hairline-warm): the hover/open/emphasis border on glass panels and chips.
- **White** (white): headlines, primary text, button text, and the inverted fill of a selected toggle or active nav item.
- **Ash** (ash): secondary text and ledes on the landing. **Smoke** (smoke): tertiary text, labels, metadata keys, footer. **Smoke App** (smoke-app): the app's single muted text tone.

### Status
- **Approved Green** (approved-green on approved-green-bg): approved clips, approve buttons, success alerts, the form success check.
- **Pending Amber** (pending-amber on pending-amber-bg): pending review, warnings.
- **Rejected Coral** (rejected-coral on rejected-coral-bg): rejected clips, reject and danger buttons, error alerts, invalid field borders.

### Named Rules
**The Light Not Paint Rule.** Signal Orange is light in the room: blooms, gradients, rings, small marks. Text-bearing orange surfaces use the Ember Action gradient or the deep feature-panel radial, never flat Signal Orange under white text.

**The Semantic Status Rule.** Green, amber and coral mean approved, pending and rejected. They appear as a tinted 12-14% background with the full-strength colour as text, never as decoration, never as a brand accent.

**The Warm Black Rule.** The ground is #070505-family warm black with an orange bloom at the top. Neutral greys and pure black read as a different product.

## Typography

**Display Font:** Manrope (with system-ui, -apple-system, Segoe UI)
**Accent Font:** Instrument Serif italic (with Georgia), landing headlines only
**Data Font:** system monospace (ui-monospace, SFMono-Regular, Menlo, Consolas)

**Character:** A heavy, tightly tracked geometric sans gives the platform its confidence; a single italic serif phrase adds warmth and voice without turning it editorial. Monospace data reads as a real record.

### Hierarchy
- **Display** (800, clamp(2.6rem, 6.4vw, 5.6rem), 0.98, -0.035em): the landing hero headline, max 15ch, centred, balanced.
- **Headline** (800, clamp(2.1rem, 4.4vw, 3.6rem), 1.03, -0.035em): landing section headings, max 20ch.
- **Accent** (Instrument Serif italic 400, -0.01em, Amber Light): the `em` phrase inside a Display or Headline. On the orange feature panel it turns pale (#FFEEE2).
- **Page Title** (800, clamp(1.7rem, 3vw, 2.3rem), -0.03em): the app's page heading. The app loads no serif.
- **Title** (700, 1.18rem, -0.02em): tile and card headings; buttons use 700 at 1rem (landing) and 600 at 0.92rem (app).
- **Body** (400, 16.5px, 1.6): landing prose; ledes at 1.15rem in Ash, max 58ch. **Body App** (15px, 1.55) for Operate screens, with page descriptions capped at 62ch.
- **Table Label** (700, 0.72rem, 0.06em, uppercase, Smoke App): table column headers only.
- **Data** (monospace 600, ~0.8rem, tabular numerals): clip IDs, metadata values, chips, the REC tag. Money and counts use tabular numerals in any face.

### Named Rules
**The One Accent Phrase Rule.** A landing headline gets at most one Instrument Serif italic phrase, and it carries the point of the sentence. Body, UI and the whole app stay in Manrope.

**The Honest Record Rule.** Any value that comes from the clip record (ID, duration, device, pay, balance) is monospace or tabular. Prose never imitates data and data never sits in proportional, jittering numerals.

## Layout

The landing is a centred 1200px container with a 20px gutter (respecting safe-area insets) and generous vertical rhythm: 128px between sections (96px under 760px), 48px from heading to content. Hero copy is centred with a 24px internal gap; the console stage sits 64px below. Content blocks use two-column grids with uneven fractions (1.45/1, 1.2/0.8, 0.85/1.15) and a three-column bento of glass tiles with 16px gaps where wide tiles span two columns and an emphasis tile spans the full row. The pilot form column is sticky beside its copy on desktop.

The app is a tighter 980px shell with a 16px gutter, a hairline-ruled top bar, and a single main column with 24px gaps. Cards and stat blocks flow into auto-fit grids (min 260px or 200px). The review screen is a 1.3/1 split.

Responsive: under 1100px the floating hero cards are removed; under 980px the bento drops to two columns, the five-step row becomes a vertical timeline, and every two-column section stacks; under 760px nav links and the nav CTA hide, the console stacks, the thumbnail strip shows three, and the bento is one column. All grid tracks use minmax(0, ...) so nothing overflows at phone width.

## Elevation & Depth

Depth is glass plus light, not stacked drop shadows. Panels separate from the warm black by a translucent fill, a 1px hairline, an inset white top highlight (5-7% alpha) and backdrop blur. Large hero objects add a deep black under-shadow and an orange under-glow so they appear lit by the bloom. Shadows are always soft and blurred, with large negative spread.

### Shadow Vocabulary
- **Glass edge** (`box-shadow: inset 0 1px 0 rgba(255,255,255,.05)`): every tile and card; up to .07 on the console.
- **Console lift** (`box-shadow: inset 0 1px 0 rgba(255,255,255,.07), 0 50px 100px -40px rgba(0,0,0,.95), 0 30px 80px -50px rgba(255,106,26,.5)`): the hero console only.
- **Float** (`box-shadow: inset 0 1px 0 rgba(255,255,255,.06), 0 24px 50px -24px rgba(0,0,0,.95)`): floating glass cards.
- **Warm glow** (`box-shadow: 0 40px 90px -50px rgba(255,106,26,.55)`): the pilot form and the orange feature panel.
- **App card** (`box-shadow: inset 0 1px 0 rgba(243,230,211,.05), 0 20px 40px -28px rgba(0,0,0,.8)`): Operate cards.
- **Button bevel** (`box-shadow: inset 0 1px 0 rgba(255,255,255,.35), 0 12px 28px -12px rgba(0,0,0,.9)`): primary buttons.

### Named Rules
**The Lit From Above Rule.** Every raised object is lit by the room: inset top highlight, soft dark fall-off below, and an orange under-glow only on the few objects that matter most (console, pilot form, feature panel).

## Shapes

Soft, generous rounding throughout, scaled to object size: 8px for app inputs and nav items, 10-12px for chips, landing inputs, icon tiles and console controls, 11px app buttons, 14px landing buttons, 16px cards and floating panels, 22px tiles, console and form, 28px the orange feature panel, 34px the phone mock, and full pills for status tags. Circles appear only for step markers, recording dots and the play button. Borders are always 1px hairlines; there are no thick outlines and no hard edges. The brand mark is a three-blade aperture in a rounded Reuleaux triangle on a 12px-radius tile.

## Components

### Buttons
Tactile and confident: a bevelled ember slab that presses in.
- **Shape:** gently rounded (landing 14px, small 11px; app 11px).
- **Primary:** Ember Action gradient (action-top to action-bottom) with white 700 text, 15px 22px padding, button bevel shadow, trailing arrow icon. The app primary is the same gradient over action-solid, 600 weight, 11px 18px.
- **Hover / Focus / Active:** landing primary lifts 2px and its arrow slides 3px right; the app primary flattens to Ember Pressed. All buttons scale to 0.97 on press. Focus is a visible amber ring (landing 2px offset 3px; app 3px offset 2px).
- **Glow (conversion CTA):** the primary hero and form submit carry a conic gradient border that travels around the button every 3.4s. Stops when disabled and under reduced motion.
- **Ghost:** Glass Highlight fill, inset hairline, white text, blur; hover brightens to 9% white.
- **Light:** white fill, near-black text, used on the orange feature panel; may pulse a white ring to draw attention.
- **Danger (app):** coral tint fill, coral text, no border.

### Chips and Status Pills
- **Chips:** monospace 600, Glass Highlight fill, hairline border, 10px radius. The selected chip turns warm (orange 16% fill, warm hairline, Apricot text).
- **Status pills:** full-round, 700 at 0.75rem, tinted background with full-strength status text: approved, pending, rejected, plus a neutral variant in Smoke App.

### Cards / Containers
- **Corner Style:** 22px for landing tiles and forms, 16px for app cards and FAQ items.
- **Background:** Glass Panel with backdrop blur.
- **Shadow Strategy:** glass edge always; see Elevation for the few lifted objects.
- **Border:** 1px hairline; warms to Warm Hairline on hover (landing tiles also lift 3px) and on an open FAQ item.
- **Internal Padding:** 26px tiles, 22px cards, 30px pilot form (22px on phones).
- **Icon tile:** 42px square, 12px radius, orange 14% fill, Amber Light line icon at 1.8 stroke.

### Inputs / Fields
- **Style:** dark inset fill (landing rgba(0,0,0,.35), app rgba(6,4,3,.55)), 1px hairline, white text, labels above in 600/500 weight.
- **Focus:** border shifts to amber and a soft amber halo appears (4px landing, 3px app); orange caret.
- **Error:** coral border via aria-invalid; app error alerts use the coral tint.
- **Checkbox:** native control with orange accent colour.

### Navigation
- **Landing:** sticky frosted capsule (18px radius, rgba(14,10,8,.66), blur 18px, hairline) holding the brand, text links in Ash 600 that brighten to white on a glass chip on hover, the EN/PT toggle, sign-in and a small primary CTA. Under 760px links and CTA hide.
- **App:** a hairline-ruled top bar with the wordmark and text tabs in Smoke App; the active tab inverts to a white fill with near-black text.
- **Segmented toggle (language, tabs):** a glass track holding small buttons; the pressed or selected item inverts to white (landing) or a glass panel with inset hairline (app tabs).

### Brand Lockup
The aperture tile (white mark on black-to-orange gradient tile, primary) beside a Manrope 800 "Borgs" wordmark at -0.04em with a small uppercase "Technology" descriptor (600, 0.72rem, 0.2em tracking, Smoke). Alternates: white on orange tile, bare orange or white symbol.

### Review Console (signature)
A wide glass panel framing a 16:10 clip with a REC tag, centred glass play button and an orange scrub bar; beside it a monospace metadata list (key in Smoke, value tabular), a status pill, and a two-up reject/approve pair in status tints. The approve button pulses and its tick draws in on a 6s loop; the active thumbnail in the strip below carries an orange ring. Product UI shown here uses labelled sample data.

### Motion
Ease-out (cubic-bezier(0.23,1,0.32,1)) for every state change, 150-220ms for colour and transform. Ambient loops are reserved for conversion and the console: travelling CTA border, pulse ring, approve tick, REC blink, scrub progress, gently floating cards. Form success draws a green check. Every loop stops under prefers-reduced-motion.

## Do's and Don'ts

### Do:
- **Do** build every surface on Warm Black with a top orange radial bloom; frosted glass panels with a 1px hairline and inset top highlight sit on it.
- **Do** fill primary actions with the Ember Action gradient (#C8450A to #AE3A07) and white text; reserve the travelling gradient border for the one or two conversion CTAs on a page.
- **Do** use green, amber and coral only for approved, pending and rejected, as tinted fill with full-strength text.
- **Do** set clip IDs, metadata, pay and balances in monospace or tabular numerals.
- **Do** give a landing headline at most one Instrument Serif italic phrase in Amber Light.
- **Do** invert to white with near-black text for the selected item in toggles and app navigation.
- **Do** label sample data and illustrative stock wherever product UI or photos appear.
- **Do** stop every ambient animation under prefers-reduced-motion.

### Don't:
- **Don't** put white text on flat Signal Orange (#FF6A1A); it fails contrast. Use the ember gradient.
- **Don't** use neutral greys or pure black for the ground, or a light theme; the system is dark-only.
- **Don't** use green, amber or coral as brand accents or decoration.
- **Don't** add customer logos, testimonials, counts, dataset hours or any other evidence the product does not have.
- **Don't** introduce the darkroom or any other decorative concept world; the user rejected it in favour of the category standard.
- **Don't** add hard offset shadows, thick outlines or sharp corners; depth is glass, hairline and soft light.
- **Don't** load the serif in the app or use it outside a headline accent phrase.
