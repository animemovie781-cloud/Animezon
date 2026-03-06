import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Play, Info, ChevronRight, Star, Calendar, Clock, List, Filter, Home, User, Settings as SettingsIcon, X, Loader2 } from 'lucide-react';
import { Anime, Episode, AndroidInterface } from './types';
import { fetchTrendingAnime, fetchAnimeEpisodes } from './services/api';
import NativePlayerMock from './components/NativePlayerMock';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [activePlayer, setActivePlayer] = useState<{ url: string; type: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Home');
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);

  // Initialize Android Bridge
  useEffect(() => {
    if (!window.Android) {
      window.Android = {
        playVideo: (url: string, type: string) => {
          console.log(`[Android Bridge] playVideo: ${url} (${type})`);
          setActivePlayer({ url, type });
        },
        openPlayer: () => console.log('[Android Bridge] openPlayer'),
        exitPlayer: () => {
          console.log('[Android Bridge] exitPlayer');
          setActivePlayer(null);
        },
        setStatusBarColor: (color: string) => console.log(`[Android Bridge] setStatusBarColor: ${color}`)
      };
    }

    // Fetch initial data
    const loadInitialData = async () => {
      setLoading(true);
      const trending = await fetchTrendingAnime();
      setAnimeList(trending);
      setLoading(false);
    };

    loadInitialData();
  }, []);

  const handleAnimeClick = async (anime: Anime) => {
    setSelectedAnime(anime);
    setEpisodes([]); // Clear previous episodes
    setEpisodesLoading(true);
    try {
      const eps = await fetchAnimeEpisodes(anime.id);
      setEpisodes(eps);
    } catch (err) {
      console.error("Failed to load episodes", err);
    } finally {
      setEpisodesLoading(false);
    }
  };

  const handlePlayEpisode = (episode: Episode) => {
    if (episode.servers.length > 1) {
      setSelectedEpisode(episode);
    } else if (episode.servers.length === 1) {
      const server = episode.servers[0];
      if (window.Android) {
        window.Android.playVideo(server.url, server.type);
      }
    }
  };

  const startPlayback = (url: string, type: string) => {
    if (window.Android) {
      window.Android.playVideo(url, type);
    }
    setSelectedEpisode(null);
  };

  const filteredAnime = animeList.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const heroAnime = animeList[0];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
          <p className="text-emerald-500 font-display font-bold uppercase tracking-widest animate-pulse">Loading AniStream...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] pb-24">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 px-6 py-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm">
        <div className="flex items-center gap-8">
          <h1 className="text-2xl font-display font-bold text-emerald-500 tracking-tighter">ANISTREAM</h1>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
            {['Home', 'Series', 'Movies', 'New & Popular', 'My List'].map(item => (
              <button 
                key={item}
                onClick={() => setActiveTab(item)}
                className={cn("hover:text-white transition-colors", activeTab === item && "text-white")}
              >
                {item}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text"
              placeholder="Search anime..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-zinc-900/50 border border-zinc-800 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 w-48 md:w-64 transition-all"
            />
          </div>
          <button className="p-2 bg-zinc-900 rounded-full"><User className="w-5 h-5" /></button>
        </div>
      </header>

      {/* Hero Section */}
      {heroAnime && (
        <section className="relative h-[80vh] w-full overflow-hidden">
          <img 
            src={heroAnime.backdrop_path} 
            alt={heroAnime.title}
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 hero-gradient" />
          
          <div className="absolute bottom-0 inset-x-0 p-8 md:p-16 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 max-w-2xl"
            >
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 bg-emerald-500 text-black text-[10px] font-bold rounded uppercase">Trending</span>
                <div className="flex items-center gap-1 text-emerald-400 text-sm font-bold">
                  <Star className="w-4 h-4 fill-emerald-400" />
                  {heroAnime.vote_average.toFixed(1)}
                </div>
              </div>
              <h2 className="text-5xl md:text-7xl font-display font-black tracking-tight leading-none uppercase italic">
                {heroAnime.title}
              </h2>
              <p className="text-zinc-400 text-lg line-clamp-3 font-medium leading-relaxed">
                {heroAnime.overview}
              </p>
              <div className="flex items-center gap-4 pt-4">
                <button 
                  onClick={() => handleAnimeClick(heroAnime)}
                  className="px-8 py-4 bg-white text-black rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform"
                >
                  <Play className="w-5 h-5 fill-black" /> Watch Now
                </button>
                <button 
                  onClick={() => handleAnimeClick(heroAnime)}
                  className="px-8 py-4 bg-zinc-800/80 text-white rounded-full font-bold flex items-center gap-2 hover:bg-zinc-700 transition-colors"
                >
                  <Info className="w-5 h-5" /> More Info
                </button>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Content Rails */}
      <main className="px-6 -mt-12 relative z-10 space-y-12">
        <ContentRail title="Trending Now" anime={filteredAnime} onSelect={handleAnimeClick} />
        <ContentRail title="Popular on AniStream" anime={[...filteredAnime].reverse()} onSelect={handleAnimeClick} />
        <ContentRail title="Top Rated Movies" anime={filteredAnime.filter(a => a.type === 'Movie')} onSelect={handleAnimeClick} />
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-black/80 backdrop-blur-xl border-t border-zinc-800 px-6 py-4 flex items-center justify-between">
        <button className="flex flex-col items-center gap-1 text-emerald-500">
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Home</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-zinc-500">
          <List className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">List</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-zinc-500">
          <Filter className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Filter</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-zinc-500">
          <SettingsIcon className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Setup</span>
        </button>
      </nav>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedAnime && (
          <DetailsModal 
            anime={selectedAnime} 
            episodes={episodes}
            loading={episodesLoading}
            onClose={() => setSelectedAnime(null)} 
            onPlay={handlePlayEpisode}
          />
        )}
      </AnimatePresence>

      {/* Server Selector Modal */}
      <AnimatePresence>
        {selectedEpisode && (
          <ServerSelector 
            episode={selectedEpisode}
            onClose={() => setSelectedEpisode(null)}
            onSelect={startPlayback}
          />
        )}
      </AnimatePresence>

      {/* Native Player Simulator */}
      <AnimatePresence>
        {activePlayer && (
          <NativePlayerMock 
            url={activePlayer.url} 
            type={activePlayer.type} 
            onClose={() => setActivePlayer(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ContentRail({ title, anime, onSelect }: { title: string; anime: Anime[]; onSelect: (a: Anime) => void }) {
  if (anime.length === 0) return null;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-display font-bold tracking-tight uppercase italic">{title}</h3>
        <button className="text-emerald-500 text-xs font-bold uppercase tracking-widest flex items-center gap-1">
          View All <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-6 px-6">
        {anime.map((item) => (
          <motion.button
            key={item.id}
            whileHover={{ scale: 1.05 }}
            onClick={() => onSelect(item)}
            className="flex-none w-40 md:w-56 group"
          >
            <div className="relative aspect-[2/3] rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl">
              <img 
                src={item.poster_path} 
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold mb-1">
                  <Star className="w-3 h-3 fill-emerald-400" />
                  {item.vote_average.toFixed(1)}
                </div>
                <p className="text-white text-sm font-bold line-clamp-2">{item.title}</p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function DetailsModal({ anime, episodes, loading, onClose, onPlay }: { anime: Anime; episodes: Episode[]; loading: boolean; onClose: () => void; onPlay: (ep: Episode) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-12"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-[#0a0a0a] w-full max-w-5xl max-h-[90vh] rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: Poster & Info */}
        <div className="w-full md:w-1/3 relative">
          <img 
            src={anime.poster_path} 
            alt={anime.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
          <div className="absolute bottom-0 p-8 space-y-4">
            <h2 className="text-3xl font-display font-black uppercase italic leading-tight">{anime.title}</h2>
            <div className="flex flex-wrap gap-2">
              {anime.genres.map(g => (
                <span key={g} className="px-2 py-1 bg-zinc-800 text-zinc-400 text-[10px] font-bold rounded uppercase">{g}</span>
              ))}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="absolute top-4 left-4 p-2 bg-black/50 hover:bg-black rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Right: Episodes & Content */}
        <div className="flex-1 p-8 overflow-y-auto no-scrollbar space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-6 text-sm font-bold text-zinc-400">
              <div className="flex items-center gap-1 text-emerald-400">
                <Star className="w-4 h-4 fill-emerald-400" /> {anime.vote_average.toFixed(1)}
              </div>
              <div className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {anime.release_date?.split('-')[0]}</div>
              <div className="flex items-center gap-1"><Clock className="w-4 h-4" /> 24m</div>
            </div>
            <p className="text-zinc-400 leading-relaxed font-medium">{anime.overview}</p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h3 className="text-xl font-display font-bold uppercase italic">Episodes</h3>
              <select className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1 text-sm font-bold focus:outline-none">
                <option>Season 1</option>
              </select>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Fetching Episodes...</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {episodes.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500 font-bold uppercase tracking-widest text-xs">No Episodes Found</div>
                ) : (
                  episodes.map((ep) => (
                    <button
                      key={ep.id}
                      onClick={() => onPlay(ep)}
                      className="flex items-center gap-4 p-3 bg-zinc-900/50 hover:bg-zinc-800 rounded-2xl transition-all group text-left"
                    >
                      <div className="relative w-32 md:w-40 aspect-video rounded-xl overflow-hidden flex-none">
                        <img 
                          src={ep.still_path} 
                          alt={ep.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-8 h-8 fill-white" />
                        </div>
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm md:text-base line-clamp-1">{ep.name}</h4>
                          <span className="text-emerald-500 text-xs font-bold">24:00</span>
                        </div>
                        <p className="text-zinc-500 text-xs line-clamp-2">{ep.overview}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ServerSelector({ episode, onClose, onSelect }: { episode: Episode; onClose: () => void; onSelect: (url: string, type: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-[#0f0f0f] w-full max-w-md rounded-3xl p-8 border border-zinc-800 shadow-2xl space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-xl font-display font-bold uppercase italic tracking-tight">Select Server</h3>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">{episode.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid gap-3">
          {episode.servers.map((server, idx) => (
            <button
              key={idx}
              onClick={() => onSelect(server.url, server.type)}
              className="w-full p-4 bg-zinc-900 hover:bg-emerald-500 hover:text-black rounded-2xl flex items-center justify-between transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-800 group-hover:bg-black/20 rounded-xl flex items-center justify-center font-bold text-sm">
                  {idx + 1}
                </div>
                <span className="font-bold uppercase tracking-wider text-sm">{server.name}</span>
              </div>
              <Play className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>

        <p className="text-center text-zinc-600 text-[10px] font-bold uppercase tracking-widest">
          Choose a server for the best streaming experience
        </p>
      </motion.div>
    </motion.div>
  );
}
