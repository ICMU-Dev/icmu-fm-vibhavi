import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStream } from '../context/StreamContext';
import { useAudioPlayback, useAudioVolume } from '../context/AudioContext';
import { Play, Pause, Volume2, VolumeX, AlertTriangle, Radio } from 'lucide-react';
import { Loader } from '../components/motion/loader';
import { AtmosphereBackground } from '../components/layout/AtmosphereBackground';
import fallbackDemo from '../data/demo.json';

export function PublicView() {
    const { isBroadcasting, currentTrack } = useStream();
    const { audioRef, play, pause } = useAudioPlayback();
    const { volume, setVolume, isMuted, toggleMute } = useAudioVolume();

    const [demoData, setDemoData] = useState(fallbackDemo);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    const audioCtxRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceRef = useRef(null);
    const requestRef = useRef(null);
    const lerpedHeightsRef = useRef(new Array(22).fill(15));
    const barsDesktopRef = useRef([]);
    const barsMobileRef = useRef([]);

    // Fetch external demo.json if available, otherwise keep fallback
    useEffect(() => {
        fetch('/demo.json')
            .then(res => res.json())
            .then(data => {
                if (data && data.upcoming) {
                    setDemoData(data);
                }
            })
            .catch(() => {});
    }, []);

    // Sync isPlaying state with actual audio element
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
    }, [audioRef, isPlaying]);

    // Network status
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
                analyserRef.current.fftSize = 64;

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
            let dataArray = new Uint8Array(22);
            
            if (isPlaying) {
                let isAllZero = true;
                if (analyserRef.current) {
                    const fullData = new Uint8Array(analyserRef.current.frequencyBinCount);
                    analyserRef.current.getByteFrequencyData(fullData);
                    dataArray = fullData.slice(0, 22);
                    isAllZero = !dataArray.some(val => val > 0);
                }

                // If CORS blocks analyser data, fallback to fluid harmonic motion
                if (isAllZero || !analyserRef.current) {
                    const time = Date.now() / 240;
                    for (let i = 0; i < 22; i++) {
                        const wave1 = Math.sin(time + (i * 0.38)) * 40;
                        const wave2 = Math.cos(time * 0.7 - (i * 0.28)) * 32;
                        const wave3 = Math.sin(time * 0.45 + i * 0.5) * 20;
                        dataArray[i] = Math.max(15, wave1 + wave2 + wave3 + 125);
                    }
                }
            } else {
                // Symmetrical resting wave pattern matching mockup
                for (let i = 0; i < 22; i++) {
                    const distFromCenter = Math.abs(i - 10.5) / 10.5;
                    dataArray[i] = Math.max(18, (1 - distFromCenter * 0.65) * 110);
                }
            }

            // Smoothly interpolate heights (lerp)
            for (let i = 0; i < 22; i++) {
                const targetVal = dataArray[i] || 15;
                const targetPercent = Math.max(12, Math.min(100, (targetVal / 255) * 100));
                lerpedHeightsRef.current[i] += (targetPercent - lerpedHeightsRef.current[i]) * 0.18;
                const hStr = `${lerpedHeightsRef.current[i]}%`;
                
                if (barsDesktopRef.current[i]) barsDesktopRef.current[i].style.height = hStr;
                if (barsMobileRef.current[i]) barsMobileRef.current[i].style.height = hStr;
            }

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
        } else {
            if (!isBroadcasting) {
                alert("FM Vibhavi is currently off-air. Check back soon!");
                return;
            }
            play();
        }
    };

    // Volume Slider Drag / Click Helper
    const handleVolumeInteraction = useCallback((e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX);
        if (clientX !== undefined) {
            const rawX = Math.max(0, Math.min(rect.width, clientX - rect.left));
            const newVol = Number((rawX / rect.width).toFixed(2));
            setVolume(newVol);
            if (isMuted && newVol > 0) toggleMute();
        }
    }, [setVolume, isMuted, toggleMute]);

    const displayTrackTitle = currentTrack?.title || demoData.nowPlaying?.title || "Isipathana College Media Unit";
    const frequency = demoData.station?.frequency || "102.5";
    const upcomingShows = demoData.upcoming || [];

    const effectiveVolumePercent = isMuted ? 0 : Math.round(volume * 100);

    return (
        <div className="relative min-h-dvh w-full overflow-x-hidden font-sans select-none bg-[#070b08] text-white">
            {/* Dynamic Time-of-Day Atmosphere Background with Seamless Crossfade */}
            <AtmosphereBackground variant="public" opacity={1} />

            {/* Main Viewport Container */}
            <div className="relative z-10 min-h-dvh w-full flex flex-col justify-between p-5 sm:p-8 lg:px-16 lg:py-10 max-w-7xl mx-auto">
                
                {/* ========================================================================= */}
                {/* TOP HEADER */}
                {/* ========================================================================= */}
                <header className="flex items-start justify-between w-full pt-1 sm:pt-2">
                    {/* Left: Dual Crests + Title */}
                    <div className="flex flex-col items-start space-y-1 sm:space-y-1.5">
                        <div className="flex items-center space-x-2.5 sm:space-x-3">
                            {/* Isipathana College Crest */}
                            <img 
                                src="/assets/isipathana_crest.png" 
                                alt="Isipathana College Crest" 
                                className="h-9 sm:h-11 w-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
                            />
                            {/* Media Unit Crest */}
                            <img 
                                src="/apple-touch-icon.png" 
                                alt="ICMU Crest" 
                                className="h-9 sm:h-11 w-auto object-contain brightness-0 invert drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
                            />
                        </div>
                        <div className="hidden sm:flex flex-col text-left">
                            <span className="text-[11px] lg:text-xs font-bold tracking-[0.18em] text-white uppercase leading-tight">
                                ISIPATHANA COLLEGE
                            </span>
                            <span className="text-[9px] lg:text-[10px] font-medium tracking-[0.25em] text-white/80 uppercase leading-tight">
                                MEDIA UNIT
                            </span>
                        </div>
                    </div>

                    {/* Right: FM Vibhavi Logo */}
                    <div className="flex items-center justify-end">
                        <img 
                            src="/assets/vibhavi_logo.png" 
                            alt="FM Vibhavi" 
                            className="h-12 sm:h-15 lg:h-16 w-auto object-contain drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]"
                        />
                    </div>
                </header>

                {/* ========================================================================= */}
                {/* DESKTOP BODY (lg and above) */}
                {/* ========================================================================= */}
                <main className="hidden lg:flex items-center justify-between w-full my-auto py-8">
                    {/* Left Column: Frequency + Now Playing + Player */}
                    <div className="flex flex-col items-start max-w-lg">
                        <h1 className="text-6xl xl:text-8xl font-bold text-white tracking-tighter leading-none mb-1 drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)]">
                            {frequency}
                        </h1>
                        <p className="text-lg xl:text-xl text-white/80 font-medium mb-3">
                            Now Playing
                        </p>

                        {/* Track Badge Pill */}
                        <div className="inline-flex items-center rounded-full bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 px-4 py-1.5 text-xs xl:text-sm font-medium text-white shadow-lg mb-6 max-w-sm truncate transition-colors">
                            {displayTrackTitle}
                        </div>

                        {/* Audio Player Capsule */}
                        <div className="rounded-full bg-black/45 backdrop-blur-xl border border-white/15 p-2 xl:p-2.5 pr-6 xl:pr-8 flex items-center gap-4 shadow-2xl">
                            <button
                                type="button"
                                onClick={togglePlay}
                                disabled={isOffline}
                                aria-label={isPlaying ? "Pause" : "Play"}
                                className="w-14 h-14 xl:w-16 xl:h-16 rounded-full bg-white text-black flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0 disabled:opacity-50"
                            >
                                {isOffline ? (
                                    <AlertTriangle className="w-6 h-6 text-destructive" />
                                ) : isBuffering ? (
                                    <Loader variant="spinner" size={24} className="text-black" />
                                ) : isPlaying ? (
                                    <Pause className="w-6 h-6 xl:w-7 xl:h-7 fill-black text-black" />
                                ) : (
                                    <Play className="w-6 h-6 xl:w-7 xl:h-7 fill-black text-black ml-1" />
                                )}
                            </button>

                            {/* Soundwave Bars */}
                            <div className="flex items-center space-x-1.5 h-9 xl:h-10 px-1">
                                {Array.from({ length: 22 }).map((_, i) => (
                                    <div
                                        key={`desktop-bar-${i}`}
                                        ref={el => barsDesktopRef.current[i] = el}
                                        className="w-1 xl:w-1.5 rounded-full bg-white transition-all duration-75"
                                        style={{ height: '20%' }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Coming Up Next + Volume */}
                    <div className="flex flex-col items-start w-full max-w-84 xl:max-w-96">
                        <h2 className="text-white/90 text-sm font-semibold tracking-wide mb-3 pl-1">
                            Coming Up Next
                        </h2>

                        {/* Shows Stack */}
                        <div className="flex flex-col space-y-2.5 w-full">
                            {upcomingShows.map((item) => (
                                <div
                                    key={item.id}
                                    className="w-full rounded-full bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 px-5 py-3 flex items-center justify-between text-white transition-all duration-200 shadow-md group cursor-default"
                                >
                                    <span className="text-white font-medium text-xs xl:text-sm truncate mr-3">
                                        {item.title}
                                    </span>
                                    <span className="text-white/60 font-mono text-[11px] xl:text-xs shrink-0 tabular-nums">
                                        {item.time}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Desktop Volume Slider */}
                        <div className="flex items-center space-x-3 mt-4 pt-1 pl-1">
                            <span className="text-white/80 text-xs xl:text-sm font-medium">Volume</span>
                            <div
                                onClick={handleVolumeInteraction}
                                onTouchMove={handleVolumeInteraction}
                                className="w-36 xl:w-44 h-5 rounded-full bg-white/15 backdrop-blur-md relative overflow-hidden cursor-pointer flex items-center p-0.5 border border-white/10 hover:border-white/30 transition-colors"
                            >
                                <div
                                    className="h-full bg-white rounded-full transition-all duration-75 ease-out shadow-sm"
                                    style={{ width: `${Math.max(8, effectiveVolumePercent)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </main>

                {/* ========================================================================= */}
                {/* MOBILE BODY (below lg) */}
                {/* ========================================================================= */}
                <main className="flex lg:hidden flex-col items-center text-center w-full my-auto py-4">
                    {/* Frequency */}
                    <h1 className="text-6xl sm:text-7xl font-black text-white tracking-tighter leading-none mb-1 drop-shadow-[0_4px_16px_rgba(0,0,0,0.7)]">
                        {frequency}
                    </h1>

                    <p className="text-base sm:text-lg text-white/85 font-medium mb-2.5">
                        Now Playing
                    </p>

                    {/* Track Badge Pill */}
                    <div className="inline-flex items-center rounded-full bg-white/10 backdrop-blur-md border border-white/15 px-4 py-1.5 text-xs sm:text-sm font-medium text-white shadow-lg mb-6 max-w-[85vw] truncate">
                        {displayTrackTitle}
                    </div>

                    {/* Player Capsule */}
                    <div className="w-full max-w-sm rounded-full bg-black/45 backdrop-blur-xl border border-white/15 p-2.5 pr-5 flex items-center gap-3 shadow-2xl mx-auto">
                        <button
                            type="button"
                            onClick={togglePlay}
                            disabled={isOffline}
                            aria-label={isPlaying ? "Pause" : "Play"}
                            className="w-13 h-13 rounded-full bg-white text-black flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0 disabled:opacity-50"
                        >
                            {isOffline ? (
                                <AlertTriangle className="w-5 h-5 text-destructive" />
                            ) : isBuffering ? (
                                <Loader variant="spinner" size={22} className="text-black" />
                            ) : isPlaying ? (
                                <Pause className="w-5 h-5 fill-black text-black" />
                            ) : (
                                <Play className="w-5 h-5 fill-black text-black ml-0.5" />
                            )}
                        </button>

                        {/* Soundwave Bars */}
                        <div className="flex items-center justify-center space-x-1 h-8 px-1 flex-1">
                            {Array.from({ length: 22 }).map((_, i) => (
                                <div
                                    key={`mobile-bar-${i}`}
                                    ref={el => barsMobileRef.current[i] = el}
                                    className="w-1 rounded-full bg-white transition-all duration-75"
                                    style={{ height: '20%' }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Mobile Volume Capsule */}
                    <div className="flex items-center justify-center mt-3.5 mb-7">
                        <div
                            onClick={handleVolumeInteraction}
                            onTouchMove={handleVolumeInteraction}
                            className="w-44 h-6.5 rounded-full bg-black/50 backdrop-blur-md border border-white/15 relative overflow-hidden cursor-pointer flex items-center p-0.5"
                        >
                            <div
                                className="h-full bg-white rounded-full transition-all duration-75 ease-out flex items-center px-1.5 min-w-7 justify-start"
                                style={{ width: `${Math.max(18, effectiveVolumePercent)}%` }}
                            >
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                                    className="text-black"
                                >
                                    {isMuted || volume === 0 ? (
                                        <VolumeX className="w-3 h-3" />
                                    ) : (
                                        <Volume2 className="w-3 h-3" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Coming Up Section */}
                    <div className="w-full max-w-sm mx-auto text-left">
                        <h2 className="text-2xl font-bold text-white tracking-tight mb-3 pl-1">
                            Coming Up
                        </h2>
                        <div className="flex flex-col space-y-2.5 w-full">
                            {upcomingShows.map((item) => (
                                <div
                                    key={item.id}
                                    className="w-full rounded-full bg-white/10 backdrop-blur-md border border-white/15 px-4 sm:px-5 py-3 flex items-center justify-between text-white shadow-md"
                                >
                                    <div className="flex items-center space-x-2.5 min-w-0 mr-2">
                                        <span className="font-mono text-white/75 font-bold text-xs sm:text-sm shrink-0">
                                            {item.number || '01'}
                                        </span>
                                        <span className="font-bold text-xs sm:text-sm text-white truncate">
                                            {item.title}
                                        </span>
                                    </div>
                                    <span className="text-white/60 font-mono text-[11px] sm:text-xs shrink-0 tabular-nums">
                                        {item.time}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>

                {/* ========================================================================= */}
                {/* FOOTER */}
                {/* ========================================================================= */}
                <footer className="pt-4 pb-2 w-full flex items-center justify-center text-center">
                    <p className="text-[9px] sm:text-[10px] font-bold text-white/70 uppercase tracking-[0.25em] flex items-center justify-center space-x-1.5">
                        <span>MADE WITH</span>
                        <span className="text-emerald-400">💚</span>
                        <span>BY ISIPATHANA COLLEGE MEDIA UNIT</span>
                    </p>
                </footer>

            </div>
        </div>
    );
}
