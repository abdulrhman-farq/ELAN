# ÉLAN — Photography Guide & Shot List

The app already renders all imagery through one place
(`src/lib/classColor.ts` → `/public/assets/…`). To go live with real
photos, **export your photoshoot to these exact filenames and drop them in
`public/assets/` (overwriting the current SVGs).** No code changes needed.

> If your photos are `.jpg`/`.webp` instead of `.svg`, just tell me and
> I'll switch the references in one commit (or keep this naming and export
> as those formats — I'll update the extensions for you).

## Art direction (ÉLAN)

Warm, editorial, calm — think Aman / The Row / Loro Piana, not bright gym
stock. Natural 2700K light, travertine / fluted oak / linen textures,
shadowed and intimate. Women-only, modest, faces optional. Slight warm
grade (champagne/charcoal), low saturation. Leave darker areas at the
**bottom** of wide shots so white text overlays read cleanly.

## Files & specs

| File (in `public/assets/`) | Used on | Subject | Orientation | Min size |
|---|---|---|---|---|
| `studio-hero.svg` | Home hero, Booking confirmation top, Profile cover | Luxury studio interior (reformers, oak, plaster) | Landscape, dark lower third | 1600×1000 |
| `reformer-flow.svg` | Schedule rows, Class detail, Home cards/next-class | Woman on a reformer, flowing | ~4:3 (works as square + banner) | 1200×900 |
| `power-reformer.svg` | Schedule, Class detail, Home/Admin | Stronger reformer work | ~4:3 | 1200×900 |
| `mat-pilates.svg` | Schedule, Class detail, Home/Admin | Floor / mat session | ~4:3 | 1200×900 |
| `stretching.svg` | Schedule, Class detail | Recovery / flexibility pose | ~4:3 | 1200×900 |
| `instructor-lina.svg` | Confirmation, Home next-class | Professional instructor portrait | Square | 600×600 |

Notes:
- Class images appear **both** as small square thumbnails and as wide
  banners, so keep the subject centered and give breathing room — they get
  cropped to square (56–80px) and to wide banners (full-width, ~96px tall).
- The hero/cover images sit under a dark gradient with white text — make
  sure the composition survives a 10–90% top-to-bottom darken.

## Adding more class types

The resolver maps by the class's English name (keyword match). To add a
type (e.g. "Barre"), drop `public/assets/barre.svg` and add one line to
`classImage()` in `src/lib/classColor.ts`. Unknown types fall back to
`reformer-flow`.

## Recommended: one custom shoot

A single half-day shoot inside the studio (interior + 1–2 instructors on
each apparatus + a few detail/texture frames) covers every screen above
and makes the app unmistakably ÉLAN. Deliver web-optimized exports
(~150–250 KB each, sRGB) at the sizes in the table.

## Manage photos without redeploys — Supabase Storage (wired)

The resolver now supports a remote photo source. When the env var
`NEXT_PUBLIC_ELAN_MEDIA_BASE` is set, every image loads from there as
`<name>.jpg`; when it's unset, it falls back to the bundled SVG art. So
you can upload/replace photos from the Supabase dashboard — no redeploy.

### One-time setup

1. **Create a public bucket** named `media`. In Supabase → Storage → New
   bucket → name `media`, toggle **Public**. (Or run the SQL below in the
   SQL editor.)

   ```sql
   insert into storage.buckets (id, name, public)
   values ('media', 'media', true)
   on conflict (id) do update set public = true;
   ```

2. **Upload the photos** to the bucket root with these exact keys:
   `studio-hero.jpg`, `reformer-flow.jpg`, `power-reformer.jpg`,
   `mat-pilates.jpg`, `stretching.jpg`, `instructor-lina.jpg`.

3. **Set the env var** in Vercel → Project → Settings → Environment
   Variables (Production), then redeploy once:

   ```
   NEXT_PUBLIC_ELAN_MEDIA_BASE = https://<your-ref>.supabase.co/storage/v1/object/public/media
   ```

After that, swapping a photo = re-upload the same filename in Supabase
Storage. The public URL stays the same, so the app updates with no code
change or redeploy.

> Photos are referenced as `.jpg`. If you prefer `.webp`/`.png`, tell me
> and I'll change the extension in the resolver.
