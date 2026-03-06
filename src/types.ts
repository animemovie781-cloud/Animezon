export interface Anime {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  release_date: string;
  genres: string[];
  type: 'Series' | 'Movie';
  number_of_seasons?: number;
}

export interface Episode {
  id: number;
  episode_number: number;
  season_number: number;
  name: string;
  overview: string;
  still_path: string;
  air_date: string;
  servers: {
    name: string;
    url: string;
    type: 'hls' | 'mp4';
  }[];
}

export interface AndroidInterface {
  playVideo: (url: string, type: string) => void;
  openPlayer: () => void;
  exitPlayer: () => void;
  setStatusBarColor: (color: string) => void;
}

declare global {
  interface Window {
    Android?: AndroidInterface;
  }
}
