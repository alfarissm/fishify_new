'use server';
/**
 * @fileOverview Recommends songs based on user input (mood, activity, or last listened song).
 *
 * - recommendSongsFromInput - A function that takes user input and recommends songs.
 * - RecommendSongsFromInputInput - The input type for the recommendSongsFromInput function.
 * - RecommendSongsFromInputOutput - The return type for the recommendSongsFromInput function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { searchItunesTrack, getTrendingTracks } from '@/services/itunes';

const RecommendSongsFromInputInputSchema = z.object({
  input: z
    .string()
    .describe('A mood, activity, or the last song the user listened to.'),
});
export type RecommendSongsFromInputInput = z.infer<
  typeof RecommendSongsFromInputInputSchema
>;

const SongSuggestionSchema = z.object({
  name: z.string().describe('The name of the song.'),
  artist: z.string().describe('The artist of the song.'),
});

const RecommendSongsFromInputOutputSchema = z.object({
  songs: z
    .array(z.object({
      id: z.string().describe("A unique ID for the song."),
      name: z.string().describe('The name of the song.'), 
      artist: z.string().describe('The artist of the song.'),
      album: z.string().describe('The album the song belongs to.'),
      trackUrl: z.string().describe('A link to the song on Apple Music / iTunes.'),
      imageUrl: z.string().describe('A URL to the album cover image. Use a 300x300 placeholder from placehold.co.'),
      duration: z.string().describe('The duration of the song in mm:ss format.'),
      previewUrl: z.string().nullable().describe('The URL for a 30-second audio preview of the song, or null if not available.')
    }))
    .describe('An array of 10 recommended songs.'),
});
export type RecommendSongsFromInputOutput = z.infer<
  typeof RecommendSongsFromInputOutputSchema
>;

export async function recommendSongsFromInput(
  input: RecommendSongsFromInputInput
): Promise<RecommendSongsFromInputOutput> {
  return recommendSongsFromInputFlow(input);
}

const formatDuration = (ms: number): string => {
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}:${(parseInt(seconds) < 10 ? '0' : '')}${seconds}`;
}

const PromptInputSchema = z.object({
  input: z.string(),
  trending: z.string(),
});

const recommendationPrompt = ai.definePrompt({
  name: 'recommendationPrompt',
  input: { schema: PromptInputSchema },
  output: { schema: z.object({ songs: z.array(SongSuggestionSchema).length(10) }) },
  prompt: `You are a music recommendation expert. Recommend 10 songs based on the user's input.

Below is a list of songs that are TRENDING RIGHT NOW (current charts). Use this as your source of truth for what is new and popular today — your own training data is outdated, so rely on this list for recency:

{{{trending}}}

Rules:
- Analyze the user's input: a specific artist, a song title, a mood, or an activity.
- Aim for a mix where AT LEAST HALF of the 10 songs are current/recent — prefer tracks from the trending list above (or other songs by those same current artists) whenever they fit the user's request.
- Only add older or classic songs when they genuinely fit the mood and a recent option doesn't exist.
- If the input is an artist's name, recommend their most popular and most recent songs.
- If the input is a song title, recommend songs with a similar style, favoring current artists.
- Recommend only real, existing songs (no invented titles).

Provide just the song name and artist. Nothing else.

User's input: "{{{input}}}"`,
});


const recommendSongsFromInputFlow = ai.defineFlow(
  {
    name: 'recommendSongsFromInputFlow',
    inputSchema: RecommendSongsFromInputInputSchema,
    outputSchema: RecommendSongsFromInputOutputSchema,
  },
  async (input) => {
    const trendingTracks = await getTrendingTracks(50);
    const trending = trendingTracks.length
      ? trendingTracks.map((t) => `- ${t.name} — ${t.artist}`).join('\n')
      : 'No live chart data available; use your best judgment but still favor recent, well-known songs.';

    const { output: recommendation } = await recommendationPrompt({
      input: input.input,
      trending,
    });
    if (!recommendation) {
      throw new Error('Could not get song recommendations.');
    }

    const songPromises = recommendation.songs.map(async (song) => {
      const track = await searchItunesTrack(song.name, song.artist);
      if (track) {
        return {
          id: String(track.trackId),
          name: track.trackName,
          artist: track.artistName || 'Unknown Artist',
          album: track.collectionName || 'Unknown Album',
          trackUrl: track.trackViewUrl,
          // Upscale the 100x100 artwork to 600x600 for a sharper image.
          imageUrl: track.artworkUrl100?.replace('100x100', '600x600') || 'https://placehold.co/300x300.png',
          duration: formatDuration(track.trackTimeMillis),
          previewUrl: track.previewUrl,
        };
      }
      // Fallback if iTunes search fails for a specific song
      return {
        id: `${song.name}-${song.artist}`.replace(/\s/g, '-'),
        name: song.name,
        artist: song.artist,
        album: 'Unknown Album',
        trackUrl: '',
        imageUrl: 'https://placehold.co/300x300.png',
        duration: '0:00',
        previewUrl: null,
      };
    });

    const songs = await Promise.all(songPromises);

    return { songs: songs.filter(song => song.trackUrl) }; // Filter out songs not found on iTunes
  }
);
