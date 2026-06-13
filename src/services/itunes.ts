'use server';

// iTunes Search API — free, no API key or auth required.
// Docs: https://performance-partners.apple.com/search-api

export type ItunesTrack = {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName: string;
  trackViewUrl: string;
  artworkUrl100: string;
  trackTimeMillis: number;
  previewUrl: string | null;
};

export type TrendingTrack = { name: string; artist: string };

// Apple's free RSS chart feed — current top songs, no key required.
// Used to ground the LLM in tracks that actually exist right now,
// so recommendations aren't limited to the model's training cutoff.
export async function getTrendingTracks(
  limit = 50,
  country = 'us'
): Promise<TrendingTrack[]> {
  try {
    const url = `https://rss.marketingtools.apple.com/api/v2/${country}/music/most-played/${limit}/songs.json`;
    const res = await fetch(url, {
      // Charts move slowly; refresh a few times a day.
      next: { revalidate: 60 * 60 * 6 },
    });

    if (!res.ok) {
      console.error('Apple RSS chart fetch failed', res.status);
      return [];
    }

    const data = (await res.json()) as {
      feed?: { results?: Array<{ name: string; artistName: string }> };
    };
    const results = data.feed?.results ?? [];
    return results.map((r) => ({ name: r.name, artist: r.artistName }));
  } catch (err) {
    console.error('Failed to fetch trending tracks', err);
    return [];
  }
}

export async function searchItunesTrack(
  trackName: string,
  artistName: string
): Promise<ItunesTrack | null> {
  try {
    const term = encodeURIComponent(`${trackName} ${artistName}`);
    const url = `https://itunes.apple.com/search?term=${term}&entity=song&limit=1`;

    const res = await fetch(url, {
      headers: { 'User-Agent': 'fishify' },
      // Cache results to reduce repeated lookups.
      next: { revalidate: 60 * 60 * 24 },
    });

    if (!res.ok) {
      console.error('iTunes search failed', res.status, res.statusText);
      return null;
    }

    const data = (await res.json()) as { resultCount: number; results: ItunesTrack[] };

    if (data.resultCount > 0 && data.results.length > 0) {
      return data.results[0];
    }
    return null;
  } catch (err) {
    console.error('Something went wrong when searching for the track', err);
    return null;
  }
}
