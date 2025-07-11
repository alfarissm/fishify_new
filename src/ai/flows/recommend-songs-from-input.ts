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
import { searchSpotify } from '@/services/spotify';

const RecommendSongsFromInputInputSchema = z.object({
  input: z
    .string()
    .describe('A mood, activity, or the last song the user listened to.'),
});
export type RecommendSongsFromInputInput = z.infer<
  typeof RecommendSongsFromInputInputSchema
>;

const RecommendSongsFromInputOutputSchema = z.object({
  songs: z
    .array(z.object({
      id: z.string().describe("A unique ID for the song."),
      name: z.string().describe('The name of the song.'), 
      artist: z.string().describe('The artist of the song.'),
      album: z.string().describe('The album the song belongs to.'),
      spotifyUrl: z.string().describe('A link to the song on Spotify.'),
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

const recommendationPrompt = ai.definePrompt({
  name: 'recommendationPrompt',
  input: { schema: RecommendSongsFromInputInputSchema },
  output: { schema: z.object({ query: z.string().describe('A search query for Spotify with a maximum of 5 words, including genre, mood, or artist keywords.') }) },
  prompt: `You are an expert music curator who creates Spotify search queries. Your task is to convert a user's request into an effective search query. The query should be concise (max 5 words) and include genres, moods, or artists to find relevant music.

- If the user provides a mood or activity (e.g., 'rainy day', 'workout'), create a query with relevant genres and moods (e.g., 'lo-fi beats', 'high-energy pop workout').
- If the user provides an artist, create a query for that artist or similar ones (e.g., 'artists like Tame Impala').
- If the user provides a song, create a query based on its style (e.g., '80s synth-pop revival').

Focus on creating a search query that will yield fresh, relevant, and interesting results on Spotify.

User's input: "{{{input}}}"`,
});


const recommendSongsFromInputFlow = ai.defineFlow(
  {
    name: 'recommendSongsFromInputFlow',
    inputSchema: RecommendSongsFromInputInputSchema,
    outputSchema: RecommendSongsFromInputOutputSchema,
  },
  async (input) => {
    const { output: recommendation } = await recommendationPrompt(input);
    if (!recommendation || !recommendation.query) {
      throw new Error('Could not generate a search query.');
    }

    const tracks = await searchSpotify(recommendation.query);

    if (!tracks || tracks.length === 0) {
      return { songs: [] };
    }

    const songs = tracks.map((track) => {
      return {
        id: track.id,
        name: track.name,
        artist: track.artists[0]?.name || 'Unknown Artist',
        album: track.album.name,
        spotifyUrl: track.external_urls.spotify,
        imageUrl: track.album.images[0]?.url || 'https://placehold.co/300x300.png',
        duration: formatDuration(track.duration_ms),
        previewUrl: track.preview_url,
      };
    }).filter(song => song.previewUrl); // Ensure we only return songs with previews for a better UX

    // If filtering removes all songs, return a slice of the original unfiltered list
    if (songs.length === 0 && tracks.length > 0) {
      return {
        songs: tracks.slice(0, 10).map((track) => ({
          id: track.id,
          name: track.name,
          artist: track.artists[0]?.name || 'Unknown Artist',
          album: track.album.name,
          spotifyUrl: track.external_urls.spotify,
          imageUrl: track.album.images[0]?.url || 'https://placehold.co/300x300.png',
          duration: formatDuration(track.duration_ms),
          previewUrl: track.preview_url,
        }))
      }
    }


    return { songs: songs.slice(0, 10) };
  }
);
