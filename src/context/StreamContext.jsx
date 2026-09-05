import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const StreamContext = createContext(undefined);

export const StreamProvider = ({ children }) => {
    const [streamUrl, setStreamUrlState] = useState(() => {
        return localStorage.getItem('fm_stream_url') || '';
    });
    const [connectionState, setConnectionState] = useState('idle');
    const [bitrate, setBitrate] = useState(128); // mock default
    const [bufferHealth, setBufferHealth] = useState(0);
    const [uptime, setUptime] = useState(0);
    const [listenerCount, setListenerCount] = useState(0);
    const [isBroadcastingState, setIsBroadcastingState] = useState(false);
    const [startedAt, setStartedAt] = useState(null);
    const [currentTrack, setCurrentTrack] = useState(null);
    const [schedule, setSchedule] = useState([]);
    const [dbError, setDbError] = useState(null);
    const [isInitializing, setIsInitializing] = useState(true);

    // Fetch initial config from Supabase
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const { data, error } = await supabase
                    .from('fm-vibhavi')
                    .select('value')
                    .eq('key', 'FM_STREAM_LINK')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();
                
                if (error && error.code !== 'PGRST116') {
                    console.error('Fetch stream link error:', error);
                    setDbError(`Failed to fetch link: ${error.message}`);
                }
                
                if (data && data.value && data.value.length > 0) {
                    const link = data.value[0].url || data.value[0];
                    if (link) {
                        setStreamUrlState(link);
                        localStorage.setItem('fm_stream_url', link);
                    }
                }

                const { data: schedData, error: schedError } = await supabase
                    .from('fm-vibhavi')
                    .select('value')
                    .eq('key', 'FM_SCHEDULE')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();
                
                if (schedError && schedError.code !== 'PGRST116') {
                    console.error('Fetch schedule error:', schedError);
                    setDbError(`Failed to fetch schedule: ${schedError.message}`);
                }
                if (schedData && schedData.value) {
                    setSchedule(schedData.value);
                }

                const { data: broadcastData, error: broadcastError } = await supabase
                    .from('fm-vibhavi')
                    .select('value')
                    .eq('key', 'station_status')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();
                
                if (broadcastError && broadcastError.code !== 'PGRST116') {
                    console.error('Fetch status error:', broadcastError);
                    setDbError(`Failed to fetch status: ${broadcastError.message}`);
                }
                if (broadcastData && broadcastData.value && broadcastData.value.length > 0) {
                    setIsBroadcastingState(broadcastData.value[0].isLive === true);
                    if (broadcastData.value[0].startedAt) {
                        setStartedAt(broadcastData.value[0].startedAt);
                    }
                }
            } catch (err) {
                console.error('Critical initialization error:', err);
                setDbError(`Initialization failed: ${err.message}`);
            } finally {
                setIsInitializing(false);
            }
        };
        fetchConfig();

        // Realtime subscription (Listen to UPDATEs now since rows already exist)
        const channel = supabase.channel('public:fm-vibhavi')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'fm-vibhavi' }, (payload) => {
                console.log('Realtime update:', payload);
                if (payload.new.key === 'FM_STREAM_LINK') {
                    if (payload.new.value && payload.new.value.length > 0) {
                        const newLink = payload.new.value[0].url || payload.new.value[0];
                        setStreamUrlState(newLink);
                        localStorage.setItem('fm_stream_url', newLink);
                    } else {
                        setStreamUrlState('');
                        localStorage.setItem('fm_stream_url', '');
                    }
                }
                if (payload.new.key === 'FM_SCHEDULE') {
                    setSchedule(payload.new.value || []);
                }
                if (payload.new.key === 'station_status') {
                    if (payload.new.value && payload.new.value.length > 0) {
                        setIsBroadcastingState(payload.new.value[0].isLive === true);
                        if (payload.new.value[0].startedAt) {
                            setStartedAt(payload.new.value[0].startedAt);
                        } else {
                            setStartedAt(null);
                        }
                    } else {
                        setIsBroadcastingState(false);
                        setStartedAt(null);
                    }
                }
            })
            .subscribe((status) => {
                console.log('Supabase Realtime Status:', status);
                if (status === 'SUBSCRIBED') {
                    setDbError(null);
                } else if (status === 'CHANNEL_ERROR') {
                    console.warn('[Realtime] Subscription channel error encountered. Retrying subscription...');
                    setDbError('Realtime sync connection interrupted. Reconnecting...');
                    setTimeout(() => {
                        if (channel && supabase) {
                            channel.subscribe();
                        }
                    }, 5000);
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Intercept setStreamUrl to update Supabase
    const setStreamUrl = async (newUrl) => {
        setStreamUrlState(newUrl);
        localStorage.setItem('fm_stream_url', newUrl);
        
        const { error } = await supabase
            .from('fm-vibhavi')
            .update({ value: newUrl ? [{ url: newUrl }] : [] })
            .eq('key', 'FM_STREAM_LINK');
            
        if (error) {
            console.error('Update stream link error:', error);
            setDbError(`Failed to update link: ${error.message}`);
            throw error;
        } else {
            setDbError(null);
        }
    };

    // Wrapper to update Supabase when toggling broadcast
    const setIsBroadcasting = async (isLive) => {
        const timestamp = isLive ? Date.now() : null;
        setIsBroadcastingState(isLive);
        setStartedAt(timestamp);

        const { error } = await supabase
            .from('fm-vibhavi')
            .update({ value: [{ isLive: isLive, startedAt: timestamp }] })
            .eq('key', 'station_status');
            
        if (error) {
            console.error('Update station status error:', error);
            setDbError(`Failed to update broadcast status: ${error.message}`);
            // Revert state if failed
            setIsBroadcastingState(!isLive);
            setStartedAt(isLive ? null : Date.now()); // Fallback
        } else {
            setDbError(null);
        }
    };

    // Real Uptime loop
    const isBroadcasting = isBroadcastingState;
    useEffect(() => {
        let timer;
        if (isBroadcasting && streamUrl) {
            setConnectionState('connected');
            
            timer = setInterval(() => {
                if (startedAt) {
                    setUptime(Math.floor((Date.now() - startedAt) / 1000));
                } else {
                    setUptime(prev => prev + 1); // fallback
                }
                
                // Mocked defaults until broadcast audio server is active
                setBufferHealth(100); 
                setBitrate(128); 
            }, 1000);
        } else {
            setConnectionState('disconnected');
            setUptime(0);
            setBufferHealth(0);
            setBitrate(0);
            setListenerCount(0);
        }
        return () => clearInterval(timer);
    }, [isBroadcasting, streamUrl, startedAt]);

// Robust radio ID extractor supporting trailing slashes, /listen, and query params
const extractRadioId = (url) => {
    if (!url) return null;
    try {
        const clean = url.trim().replace(/\/+$/, '');
        const urlObj = new URL(clean.startsWith('http') ? clean : `https://${clean}`);
        const segments = urlObj.pathname.split('/').filter(Boolean);
        if (segments.length === 0) return null;
        let id = segments[segments.length - 1];
        if (id.toLowerCase() === 'listen' && segments.length > 1) {
            id = segments[segments.length - 2];
        }
        return id || null;
    } catch {
        const parts = url.trim().split('?')[0].replace(/\/+$/, '').split('/');
        let id = parts[parts.length - 1];
        if (id && id.toLowerCase() === 'listen' && parts.length > 1) {
            id = parts[parts.length - 2];
        }
        return id || null;
    }
};

    // Track metadata polling (RadioKing API support with rate limiting, background backoff & AbortController)
    useEffect(() => {
        let interval;
        let abortController = null;
        let lastFetchTime = 0;
        let isFetching = false;
        const MIN_FETCH_GAP_MS = 4000; // 4s minimum throttle on focus/visibility

        const fetchTrack = async (isManualEvent = false) => {
            if (!isBroadcastingState || !streamUrl) {
                setCurrentTrack(null);
                return;
            }

            const now = Date.now();
            if (isManualEvent && (now - lastFetchTime < MIN_FETCH_GAP_MS || isFetching)) {
                return; // Throttled
            }

            if (isFetching) return;
            isFetching = true;
            lastFetchTime = now;

            if (abortController) {
                abortController.abort();
            }
            abortController = new AbortController();
            const { signal } = abortController;

            try {
                if (streamUrl.includes('radioking.io')) {
                    const radioId = extractRadioId(streamUrl);
                    if (!radioId) return;

                    const cacheBuster = `_t=${now}`;

                    const res = await fetch(`https://api.radioking.io/widget/radio/${radioId}/track/current?${cacheBuster}`, { signal });
                    if (res.ok) {
                        const data = await res.json();
                        const endAtTime = data.end_at ? new Date(data.end_at).getTime() : null;
                        const isExpired = !data.is_live && endAtTime && (now > endAtTime + 1500);

                        // If RadioKing current track is expired past end_at, cross-check next playlist
                        if (isExpired) {
                            try {
                                const nextRes = await fetch(`https://api.radioking.io/widget/radio/${radioId}/track/next?${cacheBuster}`, { signal });
                                if (nextRes.ok) {
                                    const nextList = await nextRes.json();
                                    if (Array.isArray(nextList) && nextList.length > 0) {
                                        const active = nextList.find(item => {
                                            const start = item.started_at ? new Date(item.started_at).getTime() : 0;
                                            return start > 0 && start <= now;
                                        });
                                        if (active) {
                                            setCurrentTrack({
                                                title: active.title,
                                                artist: active.artist || null,
                                                cover: active.cover_url || active.cover || null
                                            });
                                            return;
                                        }
                                    }
                                }
                            } catch (_) {}
                        }

                        setCurrentTrack({
                            title: data.title,
                            artist: data.artist || null,
                            cover: data.cover || null
                        });
                    }

                    // Fetch real-time active listener count from RadioKing
                    try {
                        const listenerRes = await fetch(`https://api.radioking.io/widget/radio/${radioId}/listener?${cacheBuster}`, { signal });
                        if (listenerRes.ok) {
                            const listenerData = await listenerRes.json();
                            // Handle multiple response shapes from RadioKing API
                            const count = typeof listenerData === 'number'
                                ? listenerData
                                : (listenerData.listener_count ?? listenerData.listeners ?? listenerData.total ?? listenerData.count ?? null);
                            if (typeof count === 'number' && count >= 0) {
                                setListenerCount(count);
                            }
                        }
                    } catch (_) {
                        // Fallback: try /status endpoint which sometimes has listener info
                        try {
                            const statusRes = await fetch(`https://api.radioking.io/widget/radio/${radioId}/status?${cacheBuster}`, { signal });
                            if (statusRes.ok) {
                                const statusData = await statusRes.json();
                                const count = statusData.listener_count ?? statusData.listeners ?? statusData.total ?? null;
                                if (typeof count === 'number' && count >= 0) {
                                    setListenerCount(count);
                                }
                            }
                        } catch (_) {}
                    }
                }
            } catch (e) {
                if (e.name !== 'AbortError') {
                    console.error("Failed to fetch track/listener data:", e);
                }
            } finally {
                isFetching = false;
            }
        };

        if (isBroadcastingState) {
            fetchTrack();

            const setupInterval = () => {
                clearInterval(interval);
                // Rate Limiting Optimization: Back off polling interval when tab is in background
                const pollIntervalMs = typeof document !== 'undefined' && document.hidden ? 35000 : 10000;
                interval = setInterval(fetchTrack, pollIntervalMs);
            };

            setupInterval();

            const handleVisibilityChange = () => {
                setupInterval();
                if (document.visibilityState === 'visible') {
                    fetchTrack(true);
                }
            };
            const handleFocus = () => {
                fetchTrack(true);
            };

            document.addEventListener('visibilitychange', handleVisibilityChange);
            window.addEventListener('focus', handleFocus);

            return () => {
                clearInterval(interval);
                if (abortController) abortController.abort();
                document.removeEventListener('visibilitychange', handleVisibilityChange);
                window.removeEventListener('focus', handleFocus);
            };
        } else {
            setCurrentTrack(null);
            setListenerCount(0);
        }

        return () => {
            clearInterval(interval);
            if (abortController) abortController.abort();
        };
    }, [isBroadcastingState, streamUrl]);

    return (
        <StreamContext.Provider value={{
            streamUrl, setStreamUrl,
            connectionState, setConnectionState,
            bitrate, setBitrate,
            bufferHealth, setBufferHealth,
            uptime, listenerCount,
            isBroadcasting, setIsBroadcasting,
            schedule, setSchedule,
            currentTrack,
            dbError, setDbError,
            isInitializing
        }}>
            {children}
        </StreamContext.Provider>
    );
};

export const useStream = () => {
    const context = useContext(StreamContext);
    if (!context)
        throw new Error('useStream must be used within StreamProvider');
    return context;
};
