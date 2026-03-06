import { Anime, Episode } from '../types';

export const MOCK_ANIME: Anime[] = [
  {
    id: 1,
    title: "Demon Slayer: Kimetsu no Yaiba",
    overview: "A family is attacked by demons and only two members survive - Tanjiro and his sister Nezuko, who is turning into a demon slowly. Tanjiro sets out to become a demon slayer to avenge his family and cure his sister.",
    poster_path: "https://picsum.photos/seed/demonslayer/500/750",
    backdrop_path: "https://picsum.photos/seed/demonslayer-bg/1920/1080",
    vote_average: 8.7,
    release_date: "2019-04-06",
    genres: ["Action", "Fantasy", "Adventure"],
    type: 'Series'
  },
  {
    id: 2,
    title: "Jujutsu Kaisen",
    overview: "A boy swallows a cursed talisman - the finger of a demon - and becomes cursed himself. He enters a shaman's school to be able to locate the demon's other body parts and thus exorcise himself.",
    poster_path: "https://picsum.photos/seed/jjk/500/750",
    backdrop_path: "https://picsum.photos/seed/jjk-bg/1920/1080",
    vote_average: 8.6,
    release_date: "2020-10-03",
    genres: ["Action", "Supernatural", "School"],
    type: 'Series'
  },
  {
    id: 3,
    title: "Attack on Titan",
    overview: "Several hundred years ago, humans were nearly exterminated by titans. Titans are typically several stories tall, seem to have no intelligence, devour human beings and, worst of all, seem to do it for the pleasure rather than as a food source.",
    poster_path: "https://picsum.photos/seed/aot/500/750",
    backdrop_path: "https://picsum.photos/seed/aot-bg/1920/1080",
    vote_average: 8.9,
    release_date: "2013-04-07",
    genres: ["Action", "Drama", "Fantasy"],
    type: 'Series'
  },
  {
    id: 4,
    title: "One Piece",
    overview: "Years ago, the world's most powerful pirate, Gol D. Roger, was executed, leaving behind a legendary treasure known as the 'One Piece'. Now, a young boy named Monkey D. Luffy sets out on a journey to find the treasure and become the King of the Pirates.",
    poster_path: "https://picsum.photos/seed/onepiece/500/750",
    backdrop_path: "https://picsum.photos/seed/onepiece-bg/1920/1080",
    vote_average: 8.8,
    release_date: "1999-10-20",
    genres: ["Adventure", "Comedy", "Fantasy"],
    type: 'Series'
  },
  {
    id: 5,
    title: "Your Name",
    overview: "Two strangers find themselves linked in a bizarre way. When a connection forms, will distance be the only thing to keep them apart?",
    poster_path: "https://picsum.photos/seed/yourname/500/750",
    backdrop_path: "https://picsum.photos/seed/yourname-bg/1920/1080",
    vote_average: 8.5,
    release_date: "2016-08-26",
    genres: ["Romance", "Drama", "Supernatural"],
    type: 'Movie'
  }
];

export const getEpisodes = (animeId: number): Episode[] => {
  return Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    episode_number: i + 1,
    season_number: 1,
    name: `Episode ${i + 1}: The Journey Begins`,
    overview: "The story unfolds as our protagonist faces their first major challenge and meets unexpected allies.",
    still_path: `https://picsum.photos/seed/ep-${animeId}-${i}/400/225`,
    air_date: "2024-01-01",
    servers: [
      { name: "Server 1 (HLS)", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", type: 'hls' },
      { name: "Server 2 (MP4)", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", type: 'mp4' }
    ]
  }));
};
