import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Sun, X, Maximize, Settings, Info, Monitor, ChevronLeft } from 'lucide-react';

interface NativePlayerMockProps {
  url: string;
  type: string;
  onClose: () => void;
}

export default function NativePlayerMock({ url, type, onClose }: NativePlayerMockProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState(50);
  const [brightness, setBrightness] = useState(70);
  const [isPip, setIsPip] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const duration = 1440; // 24 minutes in seconds

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSeek = (amount: number) => {
    setCurrentTime(prev => Math.max(0, Math.min(duration, prev + amount)));
    resetControlsTimeout();
  };

  // Simulate progress
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= duration) {
            setIsPlaying(false);
            return duration;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden"
      onClick={resetControlsTimeout}
    >
      {/* Video Content Placeholder */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-zinc-500 text-sm uppercase tracking-widest font-mono">Native ExoPlayer Active</div>
          <div className="text-white/40 text-xs font-mono truncate max-w-md px-4">{url}</div>
          <div className="flex items-center justify-center gap-2">
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] rounded border border-emerald-500/30 uppercase font-bold">
              {type.toUpperCase()}
            </span>
            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] rounded border border-blue-500/30 uppercase font-bold">
              Hardware Accelerated
            </span>
          </div>
        </div>
      </div>

      {/* Gesture Overlays (Left: Brightness, Right: Volume) */}
      <div className="absolute inset-0 flex pointer-events-none">
        <div className="w-1/2 h-full" />
        <div className="w-1/2 h-full" />
      </div>

      {/* Controls Overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 flex flex-col justify-between p-6"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between">
              <button 
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <div className="flex items-center gap-4">
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><Monitor className="w-6 h-6" /></button>
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><Settings className="w-6 h-6" /></button>
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><Info className="w-6 h-6" /></button>
              </div>
            </div>

            {/* Center Controls */}
            <div className="flex items-center justify-center gap-12">
              <button 
                onClick={(e) => { e.stopPropagation(); handleSeek(-10); }}
                className="p-4 hover:bg-white/10 rounded-full transition-colors"
              >
                <SkipBack className="w-10 h-10 fill-white" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }}
                className="p-6 bg-white text-black rounded-full hover:scale-110 transition-transform"
              >
                {isPlaying ? <Pause className="w-12 h-12 fill-black" /> : <Play className="w-12 h-12 fill-black ml-1" />}
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleSeek(10); }}
                className="p-4 hover:bg-white/10 rounded-full transition-colors"
              >
                <SkipForward className="w-10 h-10 fill-white" />
              </button>
            </div>

            {/* Bottom Controls */}
            <div className="space-y-4">
              {/* Seek Bar */}
              <div className="relative h-1 bg-white/20 rounded-full group cursor-pointer">
                <div 
                  className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-emerald-500 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ left: `${(currentTime / duration) * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-sm font-medium">
                <div className="flex items-center gap-4">
                  <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-5 h-5 opacity-60" />
                    <div className="w-24 h-1 bg-white/20 rounded-full">
                      <div className="h-full bg-white rounded-full" style={{ width: `${volume}%` }} />
                    </div>
                  </div>
                  <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <Maximize className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Indicators (Volume/Brightness) */}
      <div className="absolute top-1/2 left-12 -translate-y-1/2 flex flex-col items-center gap-2 opacity-0">
        <div className="w-1.5 h-32 bg-white/20 rounded-full overflow-hidden">
          <div className="w-full bg-white rounded-full" style={{ height: `${brightness}%` }} />
        </div>
        <Sun className="w-5 h-5" />
      </div>
      <div className="absolute top-1/2 right-12 -translate-y-1/2 flex flex-col items-center gap-2 opacity-0">
        <div className="w-1.5 h-32 bg-white/20 rounded-full overflow-hidden">
          <div className="w-full bg-white rounded-full" style={{ height: `${volume}%` }} />
        </div>
        <Volume2 className="w-5 h-5" />
      </div>
    </motion.div>
  );
}
