import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useStream } from './StreamContext';

const AudioPlaybackContext = createContext(undefined);
const AudioVolumeContext = createContext(undefined);

const STORAGE_KEYS = {
    VOLUME: 'fm_vibhavi_volume',
    MUTED: 'fm_vibhavi_muted',
};

const getSavedVolume = () => {
    if (typeof localStorage === 'undefined') return 0.75;
    try {
        const val = localStorage.getItem(STORAGE_KEYS.VOLUME);
        if (val !== null) {
            const parsed = parseFloat(val);
            if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
                return parsed;
            }
        }
    } catch (_) {}
    return 0.75; // 75% default comfortable level
};

const getSavedMuted = () => {
    if (typeof localStorage === 'undefined') return false;
    try {
        const val = localStorage.getItem(STORAGE_KEYS.MUTED);
        if (val !== null) {
            return val === 'true';
        }
    } catch (_) {}
    return false;
};

export const AudioProvider = ({ children }) => {
    const audioRef = useRef(null);
    const fadeIntervalRef = useRef(null);
    const { streamUrl, isBroadcasting, currentTrack } = useStream();
    const location = useLocation();

    // Volume & Mute state with localStorage persistence
    const [volume, setVolumeState] = useState(getSavedVolume);
    const [isMuted, setIsMutedState] = useState(getSavedMuted);
    const [previousVolume, setPreviousVolume] = useState(() => getSavedVolume() || 0.75);

    const volumeRef = useRef(volume);
    const isMutedRef = useRef(isMuted);

    useEffect(() => {
        volumeRef.current = volume;
    }, [volume]);

    useEffect(() => {
        isMutedRef.current = isMuted;
    }, [isMuted]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.crossOrigin = "anonymous";
            // Initialize volume on mount
            audioRef.current.volume = isMuted ? 0 : volume;
        }
    }, []);

    // Keep audio element's volume in sync when not mid-fade
    useEffect(() => {
        if (audioRef.current && !fadeIntervalRef.current) {
            audioRef.current.volume = isMuted ? 0 : volume;
        }
    }, [volume, isMuted]);

    // Handle station off-air pause
    useEffect(() => {
        const isAdmin = location.pathname !== '/';
        
        // Only force pause if the station goes offline
        if (audioRef.current && !isBroadcasting && !isAdmin) {
            if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
            if (!audioRef.current.paused) {
                let vol = audioRef.current.volume;
                fadeIntervalRef.current = setInterval(() => {
                    vol -= 0.05;
                    if (vol <= 0) {
                        vol = 0;
                        clearInterval(fadeIntervalRef.current);
                        fadeIntervalRef.current = null;
                        if (audioRef.current) audioRef.current.pause();
                    }
                    if (audioRef.current) audioRef.current.volume = Math.max(0, vol);
                }, 40);
            }
        }
    }, [isBroadcasting, location.pathname]);

    const play = useCallback(() => {
        if (audioRef.current && streamUrl) {
            if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
            
            let finalUrl = streamUrl;
            try {
                const liveUrl = new URL(streamUrl);
                liveUrl.searchParams.set('t', Date.now().toString());
                finalUrl = liveUrl.toString();
            } catch(e) { }
            
            // Re-assign src and force load to dump the old buffer and jump to the live edge!
            audioRef.current.src = finalUrl;
            audioRef.current.load();
            
            const targetVol = isMutedRef.current ? 0 : volumeRef.current;
            audioRef.current.volume = 0;
            
            audioRef.current.play().then(() => {
                if (targetVol <= 0) {
                    audioRef.current.volume = 0;
                    return;
                }
                let vol = 0;
                fadeIntervalRef.current = setInterval(() => {
                    vol += 0.05;
                    if (vol >= targetVol) {
                        vol = targetVol;
                        clearInterval(fadeIntervalRef.current);
                        fadeIntervalRef.current = null;
                    }
                    if (audioRef.current) audioRef.current.volume = vol;
                }, 40);
            }).catch(e => {
                console.error("Play failed, attempting reconnect:", e);
                audioRef.current.src = finalUrl;
                audioRef.current.load();
                audioRef.current.play().then(() => {
                    audioRef.current.volume = targetVol;
                }).catch(err => console.error("Reconnect failed:", err));
            });
        }
    }, [streamUrl]);

    const pause = useCallback(() => {
        if (audioRef.current && !audioRef.current.paused) {
            if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
            let vol = audioRef.current.volume;
            fadeIntervalRef.current = setInterval(() => {
                vol -= 0.05;
                if (vol <= 0) {
                    vol = 0;
                    clearInterval(fadeIntervalRef.current);
                    fadeIntervalRef.current = null;
                    if (audioRef.current) audioRef.current.pause();
                }
                if (audioRef.current) audioRef.current.volume = Math.max(0, vol);
            }, 40);
        }
    }, []);

    const saveVolumeTimeoutRef = useRef(null);

    useEffect(() => {
        return () => {
            if (saveVolumeTimeoutRef.current) {
                clearTimeout(saveVolumeTimeoutRef.current);
            }
        };
    }, []);

    const setVolume = useCallback((newVol) => {
        const clamped = Math.max(0, Math.min(1, Math.round(newVol * 1000) / 1000));
        setVolumeState(clamped);
        volumeRef.current = clamped;

        // Debounce writing to localStorage to prevent blocking the main thread during rapid drag/touch moves
        if (saveVolumeTimeoutRef.current) {
            clearTimeout(saveVolumeTimeoutRef.current);
        }
        saveVolumeTimeoutRef.current = setTimeout(() => {
            try {
                localStorage.setItem(STORAGE_KEYS.VOLUME, clamped.toString());
            } catch (_) {}
        }, 200);

        // If user actively raises volume while muted, automatically unmute
        if (isMutedRef.current && clamped > 0) {
            setIsMutedState(false);
            isMutedRef.current = false;
            try {
                localStorage.setItem(STORAGE_KEYS.MUTED, 'false');
            } catch (_) {}
        }

        if (audioRef.current && !fadeIntervalRef.current) {
            audioRef.current.volume = isMutedRef.current ? 0 : clamped;
        }
    }, []);

    const toggleMute = useCallback(() => {
        setIsMutedState((prevMuted) => {
            const nextMuted = !prevMuted;
            isMutedRef.current = nextMuted;

            try {
                localStorage.setItem(STORAGE_KEYS.MUTED, nextMuted.toString());
            } catch (_) {}

            if (nextMuted) {
                // Save current volume for restoring
                if (volumeRef.current > 0) {
                    setPreviousVolume(volumeRef.current);
                }
                if (audioRef.current) audioRef.current.volume = 0;
            } else {
                // Unmuting: restore previous volume if current is 0
                if (volumeRef.current === 0) {
                    const restored = previousVolume > 0 ? previousVolume : 0.75;
                    setVolumeState(restored);
                    volumeRef.current = restored;
                    try {
                        localStorage.setItem(STORAGE_KEYS.VOLUME, restored.toString());
                    } catch (_) {}
                    if (audioRef.current) audioRef.current.volume = restored;
                } else {
                    if (audioRef.current) audioRef.current.volume = volumeRef.current;
                }
            }
            return nextMuted;
        });
    }, [previousVolume]);

    useEffect(() => {
        if ('mediaSession' in navigator) {
            const baseUrl = window.location.origin;
            const artwork = [];
            
            if (currentTrack && currentTrack.cover) {
                artwork.push({ src: currentTrack.cover, sizes: '512x512', type: 'image/png' });
            } else {
                artwork.push({ src: `${baseUrl}/web-app-manifest-192x192.png`, sizes: '192x192', type: 'image/png' });
                artwork.push({ src: `${baseUrl}/web-app-manifest-512x512.png`, sizes: '512x512', type: 'image/png' });
            }

            navigator.mediaSession.metadata = new window.MediaMetadata({
                title: currentTrack?.title || 'Live Broadcast',
                artist: currentTrack?.artist || 'FM Vibhavi',
                album: 'Isipathana College Media Unit',
                artwork: artwork
            });
            
            navigator.mediaSession.setActionHandler('play', play);
            navigator.mediaSession.setActionHandler('pause', pause);
            
            return () => {
                navigator.mediaSession.setActionHandler('play', null);
                navigator.mediaSession.setActionHandler('pause', null);
            };
        }
    }, [play, pause, currentTrack]);

    useEffect(() => {
        const handleOnline = () => {
            const isAdmin = location.pathname !== '/';
            if (isBroadcasting && streamUrl && audioRef.current && !isAdmin) {
                play();
            }
        };

        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, [isBroadcasting, streamUrl, location.pathname, play]);

    const playbackValue = React.useMemo(() => ({
        audioRef,
        play,
        pause,
    }), [play, pause]);

    const volumeValue = React.useMemo(() => ({
        volume,
        setVolume,
        isMuted,
        toggleMute,
    }), [volume, setVolume, isMuted, toggleMute]);

    return (
        <AudioPlaybackContext.Provider value={playbackValue}>
            <AudioVolumeContext.Provider value={volumeValue}>
                <audio ref={audioRef} style={{ display: 'none' }} preload="none" playsInline />
                {children}
            </AudioVolumeContext.Provider>
        </AudioPlaybackContext.Provider>
    );
};

export const useAudioPlayback = () => {
    const context = useContext(AudioPlaybackContext);
    if (!context)
        throw new Error('useAudioPlayback must be used within AudioProvider');
    return context;
};

export const useAudioVolume = () => {
    const context = useContext(AudioVolumeContext);
    if (!context)
        throw new Error('useAudioVolume must be used within AudioProvider');
    return context;
};

export const useAudio = () => {
    const playback = useContext(AudioPlaybackContext);
    const volume = useContext(AudioVolumeContext);
    if (!playback || !volume)
        throw new Error('useAudio must be used within AudioProvider');
    return { ...playback, ...volume };
};
