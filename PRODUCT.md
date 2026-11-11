# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Buyers: robotics and Physical AI teams, research groups and data-collection vendors (mostly outside Brazil, reading in English) who need first-person video of real tasks and want to request a small paid pilot.
- Contributors: adults (18+) in Brazil, reading in Portuguese, who record everyday tasks with a phone and get paid per approved video.
- Operator: the founder (Artur) reviews submissions, publishes tasks, approves contributors and pays withdrawals by Pix through the admin panel.

## Product Purpose

Borgs collects egocentric (first-person) video in Brazil to a buyer's specification. Success is a buyer who agrees to a paid pilot with a written spec, and contributors who deliver clips that pass review.

## Positioning

Collection to the buyer's spec in Brazilian homes and workplaces, with signed consent from every contributor and human review of every clip. Unverified metadata is recorded as unknown, never guessed.

## Operating Context

- Public site at borgsstore.com.br (EN/PT toggle), pilot request form that stores leads.
- Contributor web app at /app: sign-up, consent terms, profile with Pix key, task list with pay per approved video, video upload (max 50 MB), submission history with rejection reasons, wallet and withdrawal requests.
- Admin panel: review queue with video playback, task editor, contributor approval, manual Pix payout records, leads, CSV export of approved clip metadata.
- A native/mobile app is planned later.

## Capabilities and Constraints

- Stack: React + Vite SPA, Supabase (auth, Postgres with RLS, private storage), static hosting (moving to Railway).
- Payouts are manual Pix; the system only records them.
- Supabase free plan limits uploads to 50 MB per file and 1 GB total.

## Brand Commitments

- Name: "Borgs" wordmark with "Technology" as a smaller descriptor. Domain stays borgsstore.com.br.
- Logo (approved by the user): a three-blade camera aperture inside a rounded Reuleaux triangle, white on a black-to-orange tile; alternates: white on orange tile, orange or white bare symbol. Files: public/logo-*.svg.
- Brand colours: orange and white (primary); black and orange (alternate).
- Visual references supplied by the user: dark premium dashboards with warm brown/orange glass surfaces, monochrome cinematic landing pages, analytics UI with orange and lime accents.
- The user rejected a concept-led (darkroom) direction and chose the category standard executed at the level of their references: modern dark glass product UI. Standing preference.
- Conversion areas (CTAs, sign-up, pilot form) should use animation to draw attention.

## Evidence on Hand

None yet. There are no customers, testimonials, logos, contributor counts, finished datasets or collected hours. Future work must not fabricate any of them.

## Product Principles

1. Honesty is the product: state what exists and what does not.
2. Consent and rights before capture.
3. The buyer's specification drives what gets collected.
4. Contributors always see pay and rules before they record.
