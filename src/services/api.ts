import axios from 'axios';
import { ref, get } from 'firebase/database';
import { db } from './firebase';
import { Anime, Episode } from '../types';

const TMDB_API_KEY = '2e211dfda888f7cc55ce433d743f9bc3';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/original';

export const fetchTrendingAnime = async (): Promise<Anime[]> => {
  try {
    // Fetching popular animation TV shows with "Anime" keyword or just high rated animation
    const response = await axios.get(`${TMDB_BASE_URL}/discover/tv`, {
      params: {
        api_key: TMDB_API_KEY,
        with_genres: '16', // Animation
        sort_by: 'popularity.desc',
        language: 'en-US',
        'vote_count.gte': 100
      }
    });

    return response.data.results.map((item: any) => ({
      id: item.id,
      title: item.name || item.original_name,
      overview: item.overview,
      poster_path: item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : 'https://picsum.photos/seed/no-poster/500/750',
      backdrop_path: item.backdrop_path ? `${IMAGE_BASE_URL}${item.backdrop_path}` : 'https://picsum.photos/seed/no-backdrop/1920/1080',
      vote_average: item.vote_average,
      release_date: item.first_air_date || 'N/A',
      genres: [],
      type: 'Series'
    }));
  } catch (error) {
    console.error('Error fetching trending anime:', error);
    return [];
  }
};

export const fetchAnimeEpisodes = async (animeId: number, seasonNumber: number = 1): Promise<Episode[]> => {
  try {
    // 1. Fetch episodes from TMDB
    const tmdbResponse = await axios.get(`${TMDB_BASE_URL}/tv/${animeId}/season/${seasonNumber}`, {
      params: { api_key: TMDB_API_KEY }
    });

    const episodes = tmdbResponse.data.episodes;

    // 2. Fetch server links from Firebase for each episode
    const episodesWithServers = await Promise.all(episodes.map(async (ep: any) => {
      const episodeRef = ref(db, `anime/${animeId}/${seasonNumber}/${ep.episode_number}`);
      const snapshot = await get(episodeRef);
      const serverData = snapshot.val();

      const servers = [];
      if (serverData) {
        Object.entries(serverData).forEach(([key, value]) => {
          if (typeof value === 'string') {
            servers.push({
              name: key.toUpperCase(),
              url: value,
              type: value.includes('.m3u8') ? 'hls' : 'mp4'
            });
          }
        });
      }

      // Fallback if no server in Firebase (for demo purposes)
      if (servers.length === 0) {
        servers.push({
          name: "DEMO SERVER",
          url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
          type: 'hls'
        });
      }

      return {
        id: ep.id,
        episode_number: ep.episode_number,
        season_number: seasonNumber,
        name: ep.name,
        overview: ep.overview,
        still_path: ep.still_path ? `${IMAGE_BASE_URL}${ep.still_path}` : 'https://picsum.photos/seed/no-image/400/225',
        air_date: ep.air_date,
        servers
      };
    }));

    return episodesWithServers;
  } catch (error) {
    console.error('Error fetching episodes:', error);
    return [];
  }
};
