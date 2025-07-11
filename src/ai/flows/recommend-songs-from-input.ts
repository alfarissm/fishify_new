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
import { searchSpotifyTrack } from '@/services/spotify';

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
  output: { schema: z.object({ songs: z.array(SongSuggestionSchema).length(10) }) },
  prompt: `You are a music recommendation expert with a deep knowledge of both classic hits and current trending music. Your goal is to recommend 10 songs based on the user's input. Prioritize newer, more contemporary songs where appropriate, but feel free to include timeless classics if they fit the mood.

First, analyze the user's input to determine if it is a specific artist, a song title, a mood, or an activity.

- If the input is an artist's name, recommend 10 popular songs by that artist, including their newer releases.
- If the input is a song title, recommend 10 songs with a similar style or from similar artists, focusing on modern equivalents.
- If the input describes a mood (e.g., 'rainy day', 'happy') or an activity (e.g., 'workout', 'studying'), recommend 10 songs that fit that context, blending current hits with suitable classics.

Provide just the song name and artist. Do not provide any other information.

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
    if (!recommendation) {
      throw new Error('Could not get song recommendations.');
    }

    const songPromises = recommendation.songs.map(async (song) => {
      const track = await searchSpotifyTrack(song.name, song.artist);
      if (track) {
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
      }
      // Fallback if Spotify search fails for a specific song
      return {
        id: `${song.name}-${song.artist}`.replace(/\s/g, '-'),
        name: song.name,
        artist: song.artist,
        album: 'Unknown Album',
        spotifyUrl: '',
        imageUrl: 'https://placehold.co/300x300.png',
        duration: '0:00',
        previewUrl: null,
      };
    });

    const songs = await Promise.all(songPromises);

    return { songs: songs.filter(song => song.spotifyUrl) }; // Filter out songs not found on Spotify
  }
);
