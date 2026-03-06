import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Sun, X, Maximize, Settings, Info, Monitor, ChevronLeft, Loader2, Server, Rewind, FastForward, Music } from 'lucide-react';
import Hls from 'hls.js';
import { Episode } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NativePlayerMockProps {
  url: string;
  type: string;
  episode?: Episode;
  onClose: () => void;
  onSwitchServer?: (url: string, type: string) => void;
  onNextEpisode?: () => void;
  hasNextEpisode?: boolean;
}

export default function NativePlayerMock({ url, type, episode, onClose, onSwitchServer, onNextEpisode, hasNextEpisode }: NativePlayerMockProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState(100);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [audioTracks, setAudioTracks] = useState<any[]>([]);
  const [currentAudioTrack, setCurrentAudioTrack] = useState<number>(-1);

  const [showAudioMenu, setShowAudioMenu] = useState(false);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    setShowControls(true);
    if (isPlaying && !showSettings) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setIsLoading(true);
    setError(null);

    let hls: Hls | null = null;

    if (type === 'hls' || url.includes('.m3u8')) {
      if (Hls.isSupported()) {
        hls = new Hls();
        hlsRef.current = hls;
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => setIsPlaying(false));
          setIsPlaying(true);
          setIsLoading(false);
          
          if (hls) {
            setAudioTracks(hls.audioTracks);
            setCurrentAudioTrack(hls.audioTrack);
          }
        });
        hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, () => {
          if (hls) setCurrentAudioTrack(hls.audioTrack);
        });
        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            setError("Failed to load HLS stream. The link might be expired or invalid.");
            setIsLoading(false);
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
      }
    } else {
      video.src = url;
    }

    return () => {
      if (hls) hls.destroy();
      hlsRef.current = null;
    };
  }, [url, type]);

  const togglePlay = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
    resetControlsTimeout();
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
    setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    setIsLoading(false);
  };

  const handleSeek = (amount: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime += amount;
    resetControlsTimeout();
  };

  const toggleFullScreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement && 
        !(document as any).webkitFullscreenElement && 
        !(document as any).mozFullScreenElement && 
        !(document as any).msFullscreenElement) {
      
      const requestFS = container.requestFullscreen || 
                       (container as any).webkitRequestFullscreen || 
                       (container as any).mozRequestFullScreen || 
                       (container as any).msRequestFullscreen;
      
      if (requestFS) {
        requestFS.call(container).catch(err => {
          console.error(`Error attempting to enable full-screen mode: ${err.message}`);
        });
      }
    } else {
      const exitFS = document.exitFullscreen || 
                    (document as any).webkitExitFullscreen || 
                    (document as any).mozCancelFullScreen || 
                    (document as any).msExitFullscreen;
      
      if (exitFS) {
        exitFS.call(document);
      }
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden"
      onClick={resetControlsTimeout}
      onMouseMove={resetControlsTimeout}
    >
      {/* Real Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain z-0"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
        playsInline
      />

      {/* Loading State */}
      {isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-white font-bold max-w-xs">{error}</p>
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-white text-black rounded-full font-bold text-sm"
          >
            Go Back
          </button>
        </div>
      )}

      {/* Controls Overlay */}
      <AnimatePresence>
        {showControls && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 flex flex-col justify-between p-6"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between z-50">
              <div className="flex items-center gap-4">
                <button 
                  onClick={(e) => { e.stopPropagation(); onClose(); }}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <div className="flex flex-col">
                  <span className="text-white font-bold text-sm truncate max-w-[150px] md:max-w-md">
                    {episode?.name || "Playing Video"}
                  </span>
                  <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">
                    {type.toUpperCase()} • Hardware Accelerated
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-4">
                {/* Direct Server Switcher Shortcut */}
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowSettings(true); }}
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors border border-white/10"
                >
                  <Server className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Servers</span>
                </button>
                
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><Monitor className="w-6 h-6" /></button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
                  className={`p-2 rounded-full transition-colors ${showSettings ? 'bg-emerald-500 text-black' : 'hover:bg-white/10'}`}
                >
                  <Settings className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Center Controls */}
            <div className="flex items-center justify-center gap-6 md:gap-12 z-50">
              <button 
                onClick={(e) => { e.stopPropagation(); handleSeek(-10); }}
                className="p-4 hover:bg-white/10 rounded-full transition-colors"
              >
                <Rewind className="w-8 h-8 md:w-10 md:h-10 fill-white" />
              </button>
              <button 
                onClick={togglePlay}
                className="p-6 bg-white text-black rounded-full hover:scale-110 transition-transform shadow-2xl"
              >
                {isPlaying ? <Pause className="w-10 h-10 md:w-12 md:h-12 fill-black" /> : <Play className="w-10 h-10 md:w-12 md:h-12 fill-black ml-1" />}
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleSeek(10); }}
                className="p-4 hover:bg-white/10 rounded-full transition-colors"
              >
                <FastForward className="w-8 h-8 md:w-10 md:h-10 fill-white" />
              </button>
              
              {hasNextEpisode && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onNextEpisode?.(); }}
                  className="p-4 bg-emerald-500/20 hover:bg-emerald-500/40 rounded-full transition-colors group"
                  title="Next Episode"
                >
                  <SkipForward className="w-8 h-8 md:w-10 md:h-10 fill-emerald-500 text-emerald-500" />
                </button>
              )}
            </div>

            {/* Bottom Controls */}
            <div className="space-y-4 z-50">
              {/* Seek Bar */}
              <div 
                className="relative h-1.5 bg-white/20 rounded-full group cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pos = (e.clientX - rect.left) / rect.width;
                  if (videoRef.current) videoRef.current.currentTime = pos * videoRef.current.duration;
                }}
              >
                <div 
                  className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full"
                  style={{ width: `${progress}%` }}
                />
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-emerald-500 rounded-full shadow-lg scale-0 group-hover:scale-100 transition-transform"
                  style={{ left: `${progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-sm font-bold font-mono">
                <div className="flex items-center gap-4">
                  <span className="text-emerald-500">{formatTime(currentTime)}</span>
                  <span className="text-zinc-500">/</span>
                  <span className="text-zinc-400">{formatTime(duration)}</span>
                </div>
                <div className="flex items-center gap-6">
                  {audioTracks.length > 1 && (
                    <div className="relative">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setShowAudioMenu(!showAudioMenu); }}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all border",
                          showAudioMenu ? "bg-emerald-500 text-black border-emerald-500" : "bg-white/10 hover:bg-white/20 border-white/10"
                        )}
                      >
                        <Music className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest hidden md:inline">
                          {audioTracks[currentAudioTrack]?.name || "Audio"}
                        </span>
                      </button>

                      <AnimatePresence>
                        {showAudioMenu && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute bottom-full right-0 mb-4 w-48 bg-black/90 backdrop-blur-xl border border-zinc-800 rounded-2xl p-2 shadow-2xl z-[100]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="p-2 border-b border-zinc-800 mb-2">
                              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Select Audio</p>
                            </div>
                            <div className="space-y-1">
                              {audioTracks.map((track, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    if (hlsRef.current) {
                                      hlsRef.current.audioTrack = idx;
                                      setCurrentAudioTrack(idx);
                                    }
                                    setShowAudioMenu(false);
                                  }}
                                  className={cn(
                                    "w-full p-2.5 rounded-xl flex items-center justify-between transition-all text-left",
                                    currentAudioTrack === idx 
                                      ? "bg-emerald-500/20 text-emerald-400" 
                                      : "hover:bg-white/10 text-zinc-400 hover:text-white"
                                  )}
                                >
                                  <span className="font-bold text-[10px] uppercase tracking-wider truncate">
                                    {track.name || `Track ${idx + 1}`}
                                  </span>
                                  {currentAudioTrack === idx && <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                  {hasNextEpisode && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); onNextEpisode?.(); }}
                      className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500 text-black rounded-full hover:bg-emerald-400 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                    >
                      <SkipForward className="w-4 h-4 fill-black" />
                      <span className="text-[10px] uppercase tracking-widest font-bold">Next Episode</span>
                    </button>
                  )}
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-5 h-5 text-zinc-400" />
                    <div className="w-24 h-1 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-white rounded-full" style={{ width: `${volume}%` }} />
                    </div>
                  </div>
                  <button 
                    onClick={toggleFullScreen}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <Maximize className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings / Server Selector Menu */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="absolute top-0 right-0 bottom-0 w-80 bg-black/90 backdrop-blur-xl border-l border-zinc-800 p-8 z-[10000] flex flex-col gap-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-display font-bold uppercase italic tracking-tight">Settings</h3>
              <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                  <Server className="w-3 h-3" /> Select Server
                </div>
                <div className="grid gap-2">
                  {episode?.servers.map((server, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        if (onSwitchServer) onSwitchServer(server.url, server.type);
                        setShowSettings(false);
                      }}
                      className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all group ${
                        url === server.url 
                          ? 'bg-emerald-500 text-black' 
                          : 'bg-zinc-900 hover:bg-zinc-800 text-white'
                      }`}
                    >
                      <span className="font-bold uppercase tracking-wider text-xs">{server.name}</span>
                      {url === server.url && <div className="w-2 h-2 bg-black rounded-full animate-pulse" />}
                    </button>
                  ))}
                </div>
              </div>

              {audioTracks.length > 1 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                    <Music className="w-3 h-3" /> Audio Track
                  </div>
                  <div className="grid gap-2">
                    {audioTracks.map((track, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (hlsRef.current) {
                            hlsRef.current.audioTrack = idx;
                          }
                        }}
                        className={`w-full p-3 rounded-xl flex items-center justify-between transition-all ${
                          currentAudioTrack === idx 
                            ? 'bg-emerald-500 text-black' 
                            : 'bg-zinc-900 hover:bg-zinc-800 text-white'
                        }`}
                      >
                        <span className="font-bold uppercase tracking-wider text-[10px]">{track.name || `Track ${idx + 1}`}</span>
                        {currentAudioTrack === idx && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                  Playback Speed
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {['0.5x', '1.0x', '1.5x', '2.0x'].map((speed) => (
                    <button 
                      key={speed}
                      className={`p-2 rounded-xl text-[10px] font-bold border transition-all ${
                        speed === '1.0x' 
                          ? 'bg-white text-black border-white' 
                          : 'border-zinc-800 text-zinc-400 hover:border-zinc-600'
                      }`}
                    >
                      {speed}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-auto pt-8 border-t border-zinc-800">
              <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                Switching servers might restart the video. Ensure you have a stable connection.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
