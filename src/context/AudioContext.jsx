import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useStream } from './StreamContext';
const AudioContext = createContext(undefined);

export const AudioProvider = ({ children }) => {
    const audioRef = useRef(null);
    const fadeIntervalRef = useRef(null);
    const { streamUrl, isBroadcasting, currentTrack } = useStream();
    const location = useLocation();
    
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.crossOrigin = "anonymous";
        }
    }, []);
    
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
                        if (audioRef.current) audioRef.current.pause();
                    }
                    if (audioRef.current) audioRef.current.volume = Math.max(0, vol);
                }, 50);
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
            
            audioRef.current.volume = 0;
            audioRef.current.play().then(() => {
                let vol = 0;
                fadeIntervalRef.current = setInterval(() => {
                    vol += 0.05;
                    if (vol >= 1) {
                        vol = 1;
                        clearInterval(fadeIntervalRef.current);
                    }
                    if (audioRef.current) audioRef.current.volume = vol;
                }, 50);
            }).catch(e => {
                console.error("Play failed, attempting reconnect:", e);
                audioRef.current.src = finalUrl;
                audioRef.current.load();
                audioRef.current.play().then(() => {
                    audioRef.current.volume = 1;
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
                    if (audioRef.current) audioRef.current.pause();
                }
                if (audioRef.current) audioRef.current.volume = Math.max(0, vol);
            }, 50);
        }
    }, []);

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

    const setVolume = (vol) => {
        if (audioRef.current) {
            audioRef.current.volume = Math.max(0, Math.min(1, vol));
        }
    };
    return (<AudioContext.Provider value={{ audioRef, play, pause, setVolume }}>
      <audio ref={audioRef} style={{ display: 'none' }} preload="none" playsInline />
      {children}
    </AudioContext.Provider>);
};
export const useAudio = () => {
    const context = useContext(AudioContext);
    if (!context)
        throw new Error('useAudio must be used within AudioProvider');
    return context;
};
