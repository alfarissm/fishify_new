'use server';

import SpotifyWebApi from 'spotify-web-api-node';

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

let tokenExpirationTime = 0;

async function getAccessToken() {
  if (Date.now() < tokenExpirationTime) {
    return;
  }

  try {
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body['access_token']);
    // Set expiration time to 5 minutes before the actual expiration
    tokenExpirationTime = Date.now() + (data.body['expires_in'] - 300) * 1000;
  } catch (err) {
    console.error('Something went wrong when retrieving an access token', err);
    throw new Error('Failed to authenticate with Spotify API.');
  }
}

export async function searchSpotifyTrack(trackName: string, artistName: string) {
  await getAccessToken();

  try {
    const query = `track:${trackName} artist:${artistName}`;
    const data = await spotifyApi.searchTracks(query, { limit: 1 });
    
    if (data.body.tracks && data.body.tracks.items.length > 0) {
      return data.body.tracks.items[0];
    }
    return null;
  } catch (err) {
    console.error('Something went wrong when searching for the track', err);
    return null;
  }
}
