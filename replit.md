# Sound2Soul

A trust-first identity, publishing, and fan-growth platform for AI-assisted music creators. Production-ready MVP — dark mode, cinematic design, demo-ready for investors.

## Architecture

**Monorepo (pnpm workspace):**
- `artifacts/api-server` — Express/Fastify API server (port 8080, proxied at `/api`)
- `artifacts/sound2soul` — React + Vite frontend (port 21762, proxied at `/`)
- `lib/api-spec` — OpenAPI spec + Orval codegen config
- `lib/api-client-react` — Generated React Query hooks (from Orval)
- `lib/api-zod` — Generated Zod schemas (from Orval)
- `lib/db` — Drizzle ORM schema + PostgreSQL client

## Key Features

1. **Creator Profiles** — Artist identity with banner, avatar, bio, AI tools used, creator statement, genres, mood tags
2. **Track Publishing** — Upload with Trust Profile: AI involvement disclosure, rights confirmation checklist, Soul Story
3. **Trust Card** — Displayed on every track: AI involvement type, human contribution details. Legal disclaimer on every card.
4. **Emotional Explore** — Curated sections: Featured, Calm Right Now, Hopeful Sounds, Cinematic AI, Hidden Gems, Focus & Flow
5. **Fan Email Capture** — Fans can subscribe to creators per-track or on profile pages
6. **Interactions** — Likes, saves, follows (auth required)
7. **Creator Dashboard** — Stats: plays, likes, fans, tracks. Track management.
8. **Admin Moderation** — Approve/reject tracks, platform metrics
9. **Pro Waitlist** — Pricing page with 3 tiers ($0/$9/$19), waitlist signup
10. **Auth** — JWT-based, bcrypt passwords. Roles: listener, creator, admin

## Database Schema

PostgreSQL via Drizzle ORM:
- `users` — id, email, password_hash, role
- `creator_profiles` — id, user_id, artist_name, slug, bio, avatar_url, banner_url, genres[], mood_identity_tags[], ai_tools_used[], social_links, creator_statement
- `tracks` — id, creator_id, title, slug, description, audio_url, cover_image_url, genre, mood_tags[], soul_story, ai_involvement_type, human_contribution_checklist, rights_confirmation, visibility, moderation_status, is_featured, play_count, like_count, save_count
- `likes`, `saves`, `follows` — interaction tables
- `fan_emails` — email capture with consent
- `reports` — track flagging
- `pro_waitlist` — waitlist signups

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@sound2soul.com | admin123 |
| Creator (Nova Hymns) | nova@sound2soul.com | creator123 |
| Creator (LoFi Aarav) | lofi@sound2soul.com | creator123 |
| Creator (Mira Echo) | mira@sound2soul.com | creator123 |
| Creator (DreamCircuit) | dream@sound2soul.com | creator123 |
| Creator (SoulPatch) | soul@sound2soul.com | creator123 |
| Listener | listener@sound2soul.com | listener123 |

## Demo Creators & Tracks

- **Nova Hymns** — Electronic/Ambient/Vocal. Tracks: Vessel of Light, Surrender the Algorithm, Echo of the Unnamed
- **LoFi Aarav** — Lo-Fi/Hip-Hop/Chill. Tracks: Chai Steam Morning, Rain on Corrugated Iron, Study Break in Bombay
- **Mira Echo** — Cinematic/Neoclassical. Tracks: The Shape of Absence, Winter Protocol
- **DreamCircuit** — Synthwave/Electronic. Tracks: Sector Seven Reverie, Parallel Self
- **SoulPatch** — Jazz/Soul/Fusion. Tracks: Blue Note Hypothesis, Sunday Church of Swing

## Business Rules

- Free tier: max 3 public tracks per creator
- New tracks default to `moderation_status=pending` — only `approved` tracks appear on Explore
- Rights confirmation must be fully completed before public submission
- Trust Card disclaimer: "This information is provided by the creator. Sound2Soul does not provide legal clearance or copyright verification." — never says "copyright safe" or "legally cleared"

## Auth

- JWT tokens stored in localStorage as `sound2soul_token`
- `setAuthTokenGetter` from `@workspace/api-client-react` called on app boot
- Password hashing: bcrypt

## AI Involvement Types

- Human-created, no AI
- AI-assisted lyrics
- AI-assisted composition
- AI-assisted vocals
- AI-generated draft, human-edited
- Fully AI-generated

## Mood Tags

Calm, Hopeful, Nostalgic, Cinematic, Focus, Healing, Romantic, Dark, Energetic, Spiritual, Playful, Dreamy

## Codegen

After updating `lib/api-spec/openapi.yaml`:
```
pnpm --filter @workspace/api-spec run codegen
```

## Design

- Dark mode-first, deep midnight backgrounds (`#080810`)
- Warm violet (`#7c3aed`) and amber (`#f59e0b`) accents
- Cinematic feel, no emojis
- Mobile-friendly responsive layout
