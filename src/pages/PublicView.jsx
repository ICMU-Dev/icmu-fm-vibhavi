import React, { useState, useEffect, useRef } from 'react';
import { useStream } from '../context/StreamContext';
import { useAudio } from '../context/AudioContext';
import { Play, Pause, Volume2, VolumeX, Menu, Power, Heart, AlertTriangle, Radio } from 'lucide-react';
import { Button } from '../components/motion/button/base';
import { RangeSlider } from '../components/motion/range-slider';
import { Link } from 'react-router-dom';
import { Loader } from '../components/motion/loader';
import { Logo } from '../components/Logo';
import { motion, AnimatePresence } from "motion/react";

export function PublicView() {
    const { isBroadcasting, currentTrack } = useStream();
    const { audioRef, play, pause } = useAudio();
    const [isPlaying, setIsPlaying] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    const audioCtxRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceRef = useRef(null);
    const requestRef = useRef(null);
    const lerpedHeightsRef = useRef(new Array(24).fill(0));
    const barsRef = useRef([]);

    // Sync isPlaying state with actual audio element state in case it pauses/plays outside React
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const handlePlay = () => { 
            setIsPlaying(true);
            setIsBuffering(audio.readyState < 3);
        };
        const handlePause = () => { setIsPlaying(false); setIsBuffering(false); };
        const handleWaiting = () => setIsBuffering(true);
        const handlePlaying = () => setIsBuffering(false);
        const handleLoadStart = () => { if (isPlaying) setIsBuffering(true); };
        const handleCanPlay = () => { if (isPlaying) setIsBuffering(false); };
        
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('waiting', handleWaiting);
        audio.addEventListener('playing', handlePlaying);
        audio.addEventListener('loadstart', handleLoadStart);
        audio.addEventListener('canplay', handleCanPlay);

        setIsPlaying(!audio.paused);
        return () => {
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('waiting', handleWaiting);
            audio.removeEventListener('playing', handlePlaying);
            audio.removeEventListener('loadstart', handleLoadStart);
            audio.removeEventListener('canplay', handleCanPlay);
        };
    }, [audioRef]);

    useEffect(() => {
        const handleOffline = () => setIsOffline(true);
        const handleOnline = () => setIsOffline(false);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);
        return () => {
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
        };
    }, []);

    // Pause if stream goes offline
    useEffect(() => {
        if (!isBroadcasting && isPlaying) {
            pause();
            setIsPlaying(false);
        }
    }, [isBroadcasting, isPlaying, pause]);

    // Audio Visualizer Loop
    useEffect(() => {
        if (audioRef.current && isPlaying && !audioCtxRef.current) {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                audioCtxRef.current = new AudioContext();
                analyserRef.current = audioCtxRef.current.createAnalyser();
                analyserRef.current.fftSize = 64; // Gives us 32 bins

                sourceRef.current = audioCtxRef.current.createMediaElementSource(audioRef.current);
                sourceRef.current.connect(analyserRef.current);
                analyserRef.current.connect(audioCtxRef.current.destination);
            } catch (e) {
                console.warn("Web Audio API setup failed or CORS restricted", e);
            }
        }
        
        if (audioCtxRef.current && isPlaying && audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }

        const updateLoop = () => {
            let dataArray = new Uint8Array(24);
            
            if (isPlaying) {
                let isAllZero = true;
                if (analyserRef.current) {
                    const fullData = new Uint8Array(analyserRef.current.frequencyBinCount);
                    analyserRef.current.getByteFrequencyData(fullData);
                    dataArray = fullData.slice(0, 24);
                    isAllZero = !dataArray.some(val => val > 0);
                }

                // If CORS blocks data (all zeros), fallback to a smooth, organic fluid animation
                if (isAllZero || !analyserRef.current) {
                    const time = Date.now() / 300;
                    for(let i=0; i<24; i++) {
                        const wave1 = Math.sin(time + (i * 0.3)) * 30;
                        const wave2 = Math.cos(time * 0.7 - (i * 0.2)) * 25;
                        const wave3 = Math.sin(time * 0.4 + i) * 15;
                        dataArray[i] = Math.max(0, wave1 + wave2 + wave3 + 100);
                    }
                }
            }

            // Smoothly interpolate (lerp) heights to remove jitter (runs at 60fps)
            barsRef.current.forEach((bar, i) => {
                if (bar) {
                    const targetVal = dataArray[i] || 10;
                    const targetPercent = Math.max(8, (targetVal / 255) * 100);
                    
                    lerpedHeightsRef.current[i] += (targetPercent - lerpedHeightsRef.current[i]) * 0.15;
                    bar.style.height = `${lerpedHeightsRef.current[i]}%`;
                }
            });

            requestRef.current = requestAnimationFrame(updateLoop);
        };

        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        requestRef.current = requestAnimationFrame(updateLoop);

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isPlaying, audioRef]);

    const togglePlay = () => {
        if (isPlaying) {
            pause();
        }
        else {
            if (!isBroadcasting) {
                alert("Station is currently offline.");
                return;
            }
            play();
        }
    };

    return (<div className="flex flex-col items-center justify-center min-h-dvh bg-background relative overflow-hidden font-sans">
      {/* Dynamic Background Glow */}
      <div className="absolute inset-0 bg-(image:--radialPrimaryAccent) opacity-10 pointer-events-none mix-blend-screen"/>
      
      <div className="w-full max-w-sm sm:max-w-md bg-card/40 backdrop-blur-3xl border-0 sm:border border-white/5 sm:border-border/30 sm:rounded-[2.5rem] shadow-2xl overflow-hidden h-dvh sm:h-[75dvh] flex flex-col relative z-10">
        
        {/* Top Nav */}
        <div className="flex justify-center items-center pt-8 pb-4">
           <Logo variant="transparent" className="h-10 opacity-90 drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]" />
        </div>

        {/* Frequency Display */}
        <div className="flex flex-col items-center justify-center mt-6">
          <div className="text-7xl font-bold font-heading text-foreground tracking-tighter drop-shadow-md">
             102.5
          </div>
          {currentTrack ? (
              <div className="mt-4 justify-center flex items-center space-x-2 bg-background/50 backdrop-blur-sm rounded-full px-2 py-1.5 border border-border/10 max-w-[70%]">
                 {currentTrack.cover && <img src={currentTrack.cover} alt="Cover" className="w-5 h-5 rounded-full object-cover shadow-sm" />}
                 <marquee behavior="scroll" direction="left" style={{scrollAmount: 5}}><span className="flex items-center text-xs font-body text-muted-foreground uppercase tracking-widest">
                    {currentTrack.artist ? `${currentTrack.artist} - ${currentTrack.title}` : currentTrack.title}
                 </span></marquee>
              </div>
          ) : (
              <Heart className="w-6 h-6 text-primary mt-4 drop-shadow-[0_0_12px_rgba(var(--primary),0.6)] cursor-pointer hover:scale-110 transition-transform"/>
          )}
        </div>

        {/* Waveform Visualizer */}
        <div className="flex-1 flex items-end justify-center px-6 mt-12  max-h-[15%] min-h-30 opacity-90">
           <div className="w-full h-full flex items-end justify-center space-x-1.5 pb-4 border-b border-white/5 relative">
              {/* Fake gradient mask for bottom fade */}
              <div className="absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-bg-card/50 to-transparent z-10 pointer-events-none"/>
              {Array.from({ length: 24 }).map((_, i) => (
                  <div 
                    key={i} 
                    ref={el => barsRef.current[i] = el}
                    className={`w-2.5 rounded-t-full bg-linear-to-t from-transparent via-primary/60 to-primary drop-shadow-[0_0_6px_rgba(var(--primary),0.4)] ${isPlaying ? 'transition-none' : 'opacity-40 transition-all duration-500 ease-out'}`} 
                    style={{ height: '12px' }}
                  />
              ))}
           </div>
        </div>

        {/* Large Tuning Dial / Play Control */}
        <div className="mt-8 mb-16 flex justify-center relative">
           {/* Background dial track */}
           <div className="w-72 h-72 rounded-full border-16 border-background/80 flex items-center justify-center relative shadow-(--shadow-ultimate) overflow-hidden">
              {/* Dial markers */}
              <div className="absolute inset-0 rounded-full border border-border/10 pointer-events-none" style={{
            background: 'repeating-conic-gradient(from 0deg, transparent 0deg 10deg, rgba(255,255,255,0.03) 10deg 11deg)'
        }}/>
              
              {/* Center Play Button */}
              <Button onClick={togglePlay} disabled={!isBroadcasting || isOffline} variant="ghost" className={`w-32 h-32 rounded-full transition-all duration-700 ease-out flex items-center justify-center z-20 relative overflow-hidden ${(!isBroadcasting || isOffline) ? 'bg-background text-muted-foreground opacity-80' : 'bg-background text-foreground'} ${isPlaying ? 'shadow-[0_0_50px_rgba(var(--primary),0.25),8px_8px_16px_rgba(0,0,0,0.6),-4px_-4px_12px_rgba(255,255,255,0.02)]' : 'shadow-[8px_8px_20px_rgba(0,0,0,0.6),-4px_-4px_12px_rgba(255,255,255,0.03)] hover:shadow-[4px_4px_10px_rgba(0,0,0,0.5),-2px_-2px_6px_rgba(255,255,255,0.02)]'}`}>
                 <AnimatePresence>
                 {isOffline ? (
                    <motion.div key="offline" initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="absolute inset-0 flex flex-col items-center justify-center space-y-1">
                       <AlertTriangle className="w-8 h-8 text-destructive opacity-80" />
                       <span className="text-[10px] font-bold text-destructive uppercase tracking-widest leading-none mt-1">Offline</span>
                    </motion.div>
                 ) : isBuffering ? (
                    <motion.div key="buffering" initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="absolute inset-0 flex items-center justify-center">
                       <Loader variant="spinner" size={48} className="text-primary drop-shadow-[0_0_12px_rgba(var(--primary),0.6)]" />
                    </motion.div>
                 ) : isPlaying ? (
                    <motion.div key="pause" initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="absolute inset-0 flex items-center justify-center">
                       <Pause className="w-12 h-12 text-primary drop-shadow-[0_0_12px_rgba(var(--primary),0.6)]"/>
                    </motion.div>
                 ) : (
                    <motion.div key="play" initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="absolute inset-0 flex items-center justify-center pl-1.5">
                       <Play className="w-12 h-12 text-foreground opacity-80 hover:opacity-100 transition-opacity"/>
                    </motion.div>
                 )}
                 </AnimatePresence>
              </Button>

              {/* Value indicators */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-8 border-t-primary drop-shadow-[0_0_6px_rgba(var(--primary),0.8)]"/>

              {/* Offline Overlay */}
              {!isBroadcasting && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-md z-30 flex flex-col items-center justify-center transition-all duration-1000 ease-in-out opacity-100">
                      <div className="relative flex items-center justify-center mb-4">
                          <div className="absolute w-12 h-12 bg-destructive/20 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
                          <Radio className="w-6 h-6 text-destructive opacity-80 z-10" />
                      </div>
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold text-center px-10 leading-relaxed">
                          FM Vibhavi is offline. We'll be back soon!
                      </span>
                  </div>
              )}
           </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pb-8 w-full flex flex-col items-center justify-center opacity-50 hover:opacity-100 transition-opacity">
            <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-widest flex items-center space-x-1.5">
                <span>Made with</span>
                <Heart className="w-3 h-3 text-destructive inline-block fill-destructive" />
                <span>by</span>
            </p>
            <p className="text-[10px] font-bold text-foreground mt-1 uppercase tracking-widest">
                Isipathana College Media Unit
            </p>
        </div>

      </div>
    </div>);
}
