'use server';

import {
  recommendSongsFromInput,
} from '@/ai/flows/recommend-songs-from-input';
import type { ActionState } from '@/types';

export async function getRecommendations(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const prompt = formData.get('prompt');

  if (typeof prompt !== 'string' || prompt.trim().length < 2) {
    return {
      recommendations: [],
      error: 'Please enter a valid prompt.',
    };
  }

  try {
    const result = await recommendSongsFromInput({ input: prompt });
    if (result && result.songs) {
      return {
        recommendations: result.songs,
        error: null,
      };
    }
    return {
      recommendations: [],
      error: 'Could not find any recommendations.',
    };
  } catch (error) {
    console.error(error);
    return {
      recommendations: [],
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}
