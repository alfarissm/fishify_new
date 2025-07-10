export type Song = {
  id: string;
  name: string;
  artist: string;
  album: string;
  spotifyUrl: string;
  imageUrl: string;
  duration: string;
  previewUrl: string | null;
};

export type ActionState = {
  recommendations: Song[];
  error: string | null;
};
