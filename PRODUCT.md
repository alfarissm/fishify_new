# Product

## Register

product

## Users
Music listeners who want quick discovery without curating playlists themselves. Context: a person describes a mood, activity, or a song/artist they like, and wants a short, listenable list back fast. Primary job: type a prompt → scan 10 recommendations → preview tracks (30s) → open the full track on Apple Music.

## Product Purpose
Fishify turns natural-language intent ("calm music for night drives", "songs like Arctic Monkeys") into 10 concrete song recommendations. A Groq LLM interprets the prompt; the iTunes Search API enriches each pick with artwork, album, duration, a 30-second preview, and an Apple Music link. Success = the user finds something worth playing and clicks through, with minimal friction.

## Brand Personality
Sleek and premium. Quiet confidence, not loud. Feels like a high-end music app — Apple Music / iTunes lineage: album artwork is the hero, typography is crisp, surfaces are calm and dark-leaning. Three words: refined, immersive, effortless.

## Anti-references
- Bootstrap / generic-AI look: uniform cards, template blue, stiff "made by AI" grids.
- A literal Spotify clone — Spotify-green chrome and copied Spotify UI.
- Loud/overstimulating: garish gradients, too many colors, gratuitous animation.
- Cold corporate SaaS / enterprise dashboard feel.

## Design Principles
- **Artwork is the interface.** Album covers carry the visual weight; chrome recedes around them.
- **Calm over loud.** Premium feel comes from restraint, spacing, and typography — not decoration.
- **Listen in one tap.** The path from recommendation to preview/play is immediate and obvious.
- **Honest empty/edge states.** When a preview is missing or a search fails, say so plainly without breaking the mood.

## Accessibility & Inclusion
Target WCAG AA: body text ≥4.5:1 against its surface (verify on dark surfaces especially), visible focus states on all controls, full keyboard operation of search and player, and a `prefers-reduced-motion` alternative for every animation.
