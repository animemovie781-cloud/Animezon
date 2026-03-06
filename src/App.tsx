import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Play, Info, ChevronRight, Star, Calendar, Clock, List, Filter, Home, User, Settings as SettingsIcon, X, Loader2 } from 'lucide-react';
import { Anime, Episode, AndroidInterface } from './types';
import { fetchTrendingAnime, fetchAnimeEpisodes, fetchAnimeByCategory, fetchAnimeDetails } from './services/api';
import NativePlayerMock from './components/NativePlayerMock';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [actionAnime, setActionAnime] = useState<Anime[]>([]);
  const [sciFiAnime, setSciFiAnime] = useState<Anime[]>([]);
  const [romanceAnime, setRomanceAnime] = useState<Anime[]>([]);
  const [comedyAnime, setComedyAnime] = useState<Anime[]>([]);
  const [mysteryAnime, setMysteryAnime] = useState<Anime[]>([]);
  const [continueWatching, setContinueWatching] = useState<{anime: Anime, episode: Episode}[]>([]);
  const [myList, setMyList] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [activePlayer, setActivePlayer] = useState<{ url: string; type: string; episode?: Episode } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Home');
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [showGenreFilter, setShowGenreFilter] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<{id: string, name: string} | null>(null);
  const [genreAnime, setGenreAnime] = useState<Anime[]>([]);
  const [genreLoading, setGenreLoading] = useState(false);

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
      try {
        const [trending, action, scifi, romance, comedy, mystery] = await Promise.all([
          fetchTrendingAnime(),
          fetchAnimeByCategory('10759'), // Action & Adventure
          fetchAnimeByCategory('10765'), // Sci-Fi & Fantasy
          fetchAnimeByCategory('18'),    // Drama
          fetchAnimeByCategory('35'),    // Comedy
          fetchAnimeByCategory('9648')   // Mystery
        ]);
        setAnimeList(trending);
        setActionAnime(action);
        setSciFiAnime(scifi);
        setRomanceAnime(romance);
        setComedyAnime(comedy);
        setMysteryAnime(mystery);

        // Load continue watching from localStorage
        const saved = localStorage.getItem('continueWatching');
        if (saved) {
          setContinueWatching(JSON.parse(saved));
        }

        const savedList = localStorage.getItem('myList');
        if (savedList) {
          setMyList(JSON.parse(savedList));
        }
      } catch (err) {
        console.error("Failed to load initial data", err);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const handleAnimeClick = async (anime: Anime) => {
    setSelectedAnime(anime);
    setShowGenreFilter(false); // Close filter if open
    setEpisodes([]); // Clear previous episodes
    setSelectedSeason(1);
    setEpisodesLoading(true);
    try {
      // Fetch full details to get number_of_seasons
      const details = await fetchAnimeDetails(anime.id);
      if (details) {
        setSelectedAnime(details);
      }
      const eps = await fetchAnimeEpisodes(anime.id, 1);
      setEpisodes(eps);
    } catch (err) {
      console.error("Failed to load episodes", err);
    } finally {
      setEpisodesLoading(false);
    }
  };

  const handleSeasonChange = async (seasonNum: number) => {
    if (!selectedAnime) return;
    setSelectedSeason(seasonNum);
    setEpisodesLoading(true);
    try {
      const eps = await fetchAnimeEpisodes(selectedAnime.id, seasonNum);
      setEpisodes(eps);
    } catch (err) {
      console.error("Failed to load episodes for season", seasonNum, err);
    } finally {
      setEpisodesLoading(false);
    }
  };

  const handlePlayEpisode = (episode: Episode) => {
    if (episode.servers && episode.servers.length > 0) {
      const firstServer = episode.servers[0];
      startPlayback(firstServer.url, firstServer.type, episode);
    }
  };

  const startPlayback = (url: string, type: string, episode?: Episode) => {
    const ep = episode || selectedEpisode;
    if (window.Android) {
      window.Android.playVideo(url, type);
    }
    if (ep && selectedAnime) {
      setActivePlayer({ url, type, episode: ep });
      
      // Update continue watching
      const newItem = { anime: selectedAnime, episode: ep };
      setContinueWatching(prev => {
        const filtered = prev.filter(item => item.anime.id !== selectedAnime.id);
        const updated = [newItem, ...filtered].slice(0, 10);
        localStorage.setItem('continueWatching', JSON.stringify(updated));
        return updated;
      });
    }
    setSelectedEpisode(null);
  };

  const handleNextEpisode = () => {
    if (!activePlayer?.episode) return;
    const currentIndex = episodes.findIndex(e => e.id === activePlayer.episode?.id);
    if (currentIndex !== -1 && currentIndex < episodes.length - 1) {
      handlePlayEpisode(episodes[currentIndex + 1]);
    }
  };

  const handleGenreSelect = async (genre: {id: string, name: string}) => {
    setSelectedGenre(genre);
    setGenreLoading(true);
    try {
      if (genre.id === 'trending') {
        setGenreAnime(animeList);
      } else if (genre.id === 'popular') {
        setGenreAnime([...animeList].reverse());
      } else {
        const results = await fetchAnimeByCategory(genre.id);
        setGenreAnime(results);
      }
    } catch (err) {
      console.error("Failed to fetch genre anime", err);
    } finally {
      setGenreLoading(false);
    }
  };

  const handleViewAll = (id: string, name: string) => {
    handleGenreSelect({ id, name });
    setShowGenreFilter(true);
  };

  const toggleMyList = (anime: Anime) => {
    setMyList(prev => {
      const exists = prev.find(a => a.id === anime.id);
      let updated;
      if (exists) {
        updated = prev.filter(a => a.id !== anime.id);
      } else {
        updated = [anime, ...prev];
      }
      localStorage.setItem('myList', JSON.stringify(updated));
      return updated;
    });
  };
  const genres = [
    { id: '10759', name: 'Action' },
    { id: '10765', name: 'Sci-Fi' },
    { id: '35', name: 'Comedy' },
    { id: '18', name: 'Drama' },
    { id: '9648', name: 'Mystery' },
    { id: '10762', name: 'Kids' },
    { id: '80', name: 'Crime' },
    { id: '99', name: 'Documentary' }
  ];

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
      <main className="px-6 -mt-12 relative z-10 space-y-12 pb-12">
        {activeTab === 'Home' && !searchQuery && (
          <>
            {continueWatching.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-display font-bold tracking-tight uppercase italic">Continue Watching</h3>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-6 px-6">
                  {continueWatching.map((item, idx) => (
                    <motion.button
                      key={`${item.anime.id}-${idx}`}
                      whileHover={{ scale: 1.05 }}
                      onClick={() => handleAnimeClick(item.anime)}
                      className="flex-none w-64 group"
                    >
                      <div className="relative aspect-video rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl">
                        <img 
                          src={item.episode.still_path || item.anime.backdrop_path} 
                          alt={item.anime.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-10 h-10 fill-white" />
                        </div>
                        <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black to-transparent">
                          <p className="text-white text-xs font-bold truncate">{item.anime.title}</p>
                          <p className="text-emerald-400 text-[10px] font-bold uppercase">EP {item.episode.episode_number}: {item.episode.name}</p>
                        </div>
                        <div className="absolute bottom-0 left-0 h-1 bg-emerald-500 w-1/2" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {myList.length > 0 && (
              <ContentRail 
                title="My List" 
                anime={myList} 
                onSelect={handleAnimeClick} 
                onViewAll={() => setActiveTab('My List')}
              />
            )}
            
            <ContentRail 
              title="Trending Now" 
              anime={filteredAnime} 
              onSelect={handleAnimeClick} 
              onViewAll={() => handleViewAll('trending', 'Trending Now')}
            />
            <ContentRail 
              title="Action & Adventure" 
              anime={actionAnime} 
              onSelect={handleAnimeClick} 
              onViewAll={() => handleViewAll('10759', 'Action & Adventure')}
            />
            <ContentRail 
              title="Sci-Fi & Fantasy" 
              anime={sciFiAnime} 
              onSelect={handleAnimeClick} 
              onViewAll={() => handleViewAll('10765', 'Sci-Fi & Fantasy')}
            />
            <ContentRail 
              title="Comedy" 
              anime={comedyAnime} 
              onSelect={handleAnimeClick} 
              onViewAll={() => handleViewAll('35', 'Comedy')}
            />
            <ContentRail 
              title="Mystery & Thriller" 
              anime={mysteryAnime} 
              onSelect={handleAnimeClick} 
              onViewAll={() => handleViewAll('9648', 'Mystery & Thriller')}
            />
            <ContentRail 
              title="Drama & Romance" 
              anime={romanceAnime} 
              onSelect={handleAnimeClick} 
              onViewAll={() => handleViewAll('18', 'Drama & Romance')}
            />
            <ContentRail 
              title="Popular on AniStream" 
              anime={[...filteredAnime].reverse()} 
              onSelect={handleAnimeClick} 
              onViewAll={() => handleViewAll('popular', 'Popular')}
            />
          </>
        )}

        {activeTab === 'My List' && (
          <div className="pt-20 space-y-8">
            <h2 className="text-3xl font-display font-black uppercase italic tracking-tight text-emerald-500">My List</h2>
            {myList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 border border-dashed border-zinc-800 rounded-3xl">
                <Star className="w-12 h-12 text-zinc-700" />
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Your list is empty</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {myList.map(item => (
                  <motion.button
                    key={item.id}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => handleAnimeClick(item)}
                    className="space-y-2 text-left"
                  >
                    <div className="aspect-[2/3] rounded-2xl overflow-hidden border border-zinc-800 shadow-xl">
                      <img 
                        src={item.poster_path} 
                        alt={item.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <p className="text-sm font-bold line-clamp-1">{item.title}</p>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        )}

        {searchQuery && (
          <div className="pt-20 space-y-8">
            <h2 className="text-2xl font-display font-bold uppercase italic tracking-tight">Search Results for "{searchQuery}"</h2>
            {filteredAnime.length === 0 ? (
              <div className="text-center py-20 text-zinc-500 font-bold uppercase tracking-widest text-xs">No results found</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {filteredAnime.map(item => (
                  <motion.button
                    key={item.id}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => handleAnimeClick(item)}
                    className="space-y-2 text-left"
                  >
                    <div className="aspect-[2/3] rounded-2xl overflow-hidden border border-zinc-800 shadow-xl">
                      <img 
                        src={item.poster_path} 
                        alt={item.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <p className="text-sm font-bold line-clamp-1">{item.title}</p>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-black/80 backdrop-blur-xl border-t border-zinc-800 px-6 py-4 flex items-center justify-between">
        <button 
          onClick={() => { setActiveTab('Home'); setShowGenreFilter(false); setSelectedGenre(null); }}
          className={cn("flex flex-col items-center gap-1", activeTab === 'Home' && !showGenreFilter ? "text-emerald-500" : "text-zinc-500")}
        >
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Home</span>
        </button>
        <button 
          onClick={() => { setActiveTab('My List'); setShowGenreFilter(false); setSelectedGenre(null); }}
          className={cn("flex flex-col items-center gap-1", activeTab === 'My List' ? "text-emerald-500" : "text-zinc-500")}
        >
          <List className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">List</span>
        </button>
        <button 
          onClick={() => setShowGenreFilter(true)}
          className={cn("flex flex-col items-center gap-1", showGenreFilter ? "text-emerald-500" : "text-zinc-500")}
        >
          <Filter className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Filter</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-zinc-500">
          <SettingsIcon className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Setup</span>
        </button>
      </nav>

      {/* Genre Filter Modal */}
      <AnimatePresence>
        {showGenreFilter && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            className="fixed inset-0 z-[110] bg-black flex flex-col"
          >
            <header className="p-6 flex items-center justify-between border-b border-zinc-800">
              <h2 className="text-2xl font-display font-black uppercase italic tracking-tight">Browse Genres</h2>
              <button onClick={() => setShowGenreFilter(false)} className="p-2 bg-zinc-900 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </header>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div className="flex flex-wrap gap-3">
                {genres.map(g => (
                  <button
                    key={g.id}
                    onClick={() => handleGenreSelect(g)}
                    className={cn(
                      "px-6 py-3 rounded-2xl font-bold uppercase tracking-widest text-xs border transition-all",
                      selectedGenre?.id === g.id 
                        ? "bg-emerald-500 text-black border-emerald-500" 
                        : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600"
                    )}
                  >
                    {g.name}
                  </button>
                ))}
              </div>

              {selectedGenre && (
                <div className="space-y-6">
                  <h3 className="text-xl font-display font-bold uppercase italic text-emerald-500">{selectedGenre.name} Anime</h3>
                  {genreLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                      <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Loading {selectedGenre.name}...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {genreAnime.map(item => (
                        <motion.button
                          key={item.id}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleAnimeClick(item)}
                          className="space-y-2 text-left"
                        >
                          <div className="aspect-[2/3] rounded-2xl overflow-hidden border border-zinc-800">
                            <img 
                              src={item.poster_path} 
                              alt={item.title}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <p className="text-xs font-bold line-clamp-1">{item.title}</p>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedAnime && (
          <DetailsModal 
            anime={selectedAnime} 
            episodes={episodes}
            loading={episodesLoading}
            selectedSeason={selectedSeason}
            isInList={!!myList.find(a => a.id === selectedAnime.id)}
            onToggleList={() => toggleMyList(selectedAnime)}
            onSeasonChange={handleSeasonChange}
            onClose={() => setSelectedAnime(null)} 
            onPlay={handlePlayEpisode}
          />
        )}
      </AnimatePresence>

      {/* Native Player Simulator */}
      <AnimatePresence>
        {activePlayer && (
          <NativePlayerMock 
            url={activePlayer.url} 
            type={activePlayer.type} 
            episode={activePlayer.episode}
            onClose={() => setActivePlayer(null)} 
            onSwitchServer={(url, type) => setActivePlayer(prev => prev ? { ...prev, url, type } : null)}
            onNextEpisode={handleNextEpisode}
            hasNextEpisode={activePlayer.episode ? episodes.findIndex(e => e.id === activePlayer.episode?.id) < episodes.length - 1 : false}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ContentRail({ title, anime, onSelect, onViewAll }: { title: string; anime: Anime[]; onSelect: (a: Anime) => void; onViewAll?: () => void }) {
  if (anime.length === 0) return null;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-display font-bold tracking-tight uppercase italic">{title}</h3>
        {onViewAll && (
          <button 
            onClick={onViewAll}
            className="text-emerald-500 text-xs font-bold uppercase tracking-widest flex items-center gap-1 hover:text-emerald-400 transition-colors"
          >
            View All <ChevronRight className="w-4 h-4" />
          </button>
        )}
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
              {title === "Trending Now" && (
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-emerald-500 text-black text-[8px] font-black rounded uppercase tracking-tighter z-10">
                  Trending
                </div>
              )}
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

function DetailsModal({ 
  anime, 
  episodes, 
  loading, 
  selectedSeason,
  isInList,
  onToggleList,
  onSeasonChange,
  onClose, 
  onPlay 
}: { 
  anime: Anime; 
  episodes: Episode[]; 
  loading: boolean; 
  selectedSeason: number;
  isInList: boolean;
  onToggleList: () => void;
  onSeasonChange: (num: number) => void;
  onClose: () => void; 
  onPlay: (ep: Episode) => void 
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-0 md:p-12"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-[#0a0a0a] w-full h-full md:h-auto md:max-w-5xl md:max-h-[90vh] md:rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: Poster & Info */}
        <div className="w-full md:w-1/3 relative h-64 md:h-auto flex-none">
          <img 
            src={anime.poster_path} 
            alt={anime.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
          <div className="absolute bottom-0 p-6 md:p-8 space-y-4">
            <h2 className="text-2xl md:text-3xl font-display font-black uppercase italic leading-tight line-clamp-2">{anime.title}</h2>
            <div className="flex flex-wrap gap-2">
              {anime.genres.length > 0 ? anime.genres.slice(0, 3).map(g => (
                <span key={g} className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-[9px] md:text-[10px] font-bold rounded uppercase border border-emerald-500/30">{g}</span>
              )) : (
                <span className="px-2 py-1 bg-zinc-800 text-zinc-400 text-[10px] font-bold rounded uppercase">Animation</span>
              )}
            </div>
            <button 
              onClick={onToggleList}
              className={cn(
                "w-full py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all",
                isInList ? "bg-emerald-500 text-black" : "bg-zinc-800 text-white hover:bg-zinc-700"
              )}
            >
              {isInList ? <Star className="w-4 h-4 fill-black" /> : <Star className="w-4 h-4" />}
              {isInList ? "In My List" : "Add to List"}
            </button>
          </div>
          <button 
            onClick={onClose}
            className="absolute top-4 left-4 p-2 bg-black/50 hover:bg-black rounded-full transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Right: Episodes & Content */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="p-6 md:p-8 overflow-y-auto no-scrollbar space-y-8 h-full">
            <div className="space-y-4">
              <div className="flex items-center gap-6 text-sm font-bold text-zinc-400">
                <div className="flex items-center gap-1 text-emerald-400">
                  <Star className="w-4 h-4 fill-emerald-400" /> {anime.vote_average.toFixed(1)}
                </div>
                <div className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {anime.release_date?.split('-')[0]}</div>
                <div className="flex items-center gap-1"><Clock className="w-4 h-4" /> 24m</div>
              </div>
              <p className="text-zinc-400 leading-relaxed font-medium text-sm md:text-base">{anime.overview}</p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4 sticky top-0 bg-[#0a0a0a] z-10">
                <h3 className="text-xl font-display font-bold uppercase italic">Episodes</h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Season</span>
                  <select 
                    value={selectedSeason}
                    onChange={(e) => onSeasonChange(Number(e.target.value))}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1 text-xs font-bold focus:outline-none cursor-pointer hover:border-emerald-500 transition-colors"
                  >
                    {Array.from({ length: anime.number_of_seasons || 1 }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                  <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Fetching Episodes...</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {episodes.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500 font-bold uppercase tracking-widest text-[10px] border border-dashed border-zinc-800 rounded-2xl">No Episodes Found for Season {selectedSeason}</div>
                  ) : (
                    episodes.map((ep, idx) => (
                      <button
                        key={`${ep.id}-${idx}`}
                        onClick={() => onPlay(ep)}
                        className="flex items-center gap-4 p-3 bg-zinc-900/40 hover:bg-zinc-800/60 rounded-2xl transition-all group text-left border border-zinc-800/50 hover:border-emerald-500/30"
                      >
                        <div className="relative w-28 md:w-36 aspect-video rounded-xl overflow-hidden flex-none bg-zinc-800">
                          <img 
                            src={ep.still_path} 
                            alt={ep.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-8 h-8 fill-white" />
                          </div>
                          <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 rounded text-[8px] font-bold text-white">
                            EP {ep.episode_number}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-bold text-sm line-clamp-1 group-hover:text-emerald-400 transition-colors">{ep.name}</h4>
                            <span className="text-zinc-500 text-[10px] font-bold flex-none">24:00</span>
                          </div>
                          <p className="text-zinc-500 text-[10px] line-clamp-2 leading-relaxed">{ep.overview || "No description available for this episode."}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

