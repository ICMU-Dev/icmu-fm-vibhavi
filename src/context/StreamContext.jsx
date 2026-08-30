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
    const [listenerCount, setListenerCount] = useState(42);
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
                if (status === 'CHANNEL_ERROR') {
                    setDbError('Failed to connect to realtime updates. Automatically refreshing...');
                    setTimeout(() => window.location.reload(), 3000);
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
                
                // Currently mocked until a radio server API is provided
                setBufferHealth(100); 
                setBitrate(128); 
                // We keep a slight random fluctuation for aesthetic if no API is available
                setListenerCount(prev => {
                    const next = prev + Math.floor(Math.random() * 3) - 1;
                    return next < 0 ? 0 : next;
                });
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

    // Track metadata polling (RadioKing API support)
    useEffect(() => {
        let interval;
        const fetchTrack = async () => {
            if (!isBroadcastingState || !streamUrl) {
                setCurrentTrack(null);
                return;
            }
            try {
                if (streamUrl.includes('radioking.io')) {
                    const parts = streamUrl.split('/');
                    const radioId = parts[parts.length - 1].split('?')[0];
                    const res = await fetch(`https://api.radioking.io/widget/radio/${radioId}/track/current`);
                    if (res.ok) {
                        const data = await res.json();
                        setCurrentTrack({
                            title: data.title,
                            artist: data.artist,
                            cover: data.cover
                        });
                    }
                }
            } catch (e) {
                console.error("Failed to fetch track data:", e);
            }
        };

        if (isBroadcastingState) {
            fetchTrack();
            interval = setInterval(fetchTrack, 15000); // Poll every 15s
        } else {
            setCurrentTrack(null);
        }

        return () => clearInterval(interval);
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
