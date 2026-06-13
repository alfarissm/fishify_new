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
