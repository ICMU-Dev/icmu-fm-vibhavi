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
                }
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
                    } else {
                        setIsBroadcastingState(false);
                    }
                }
            })
            .subscribe((status) => {
                console.log('Supabase Realtime Status:', status);
                if (status === 'CHANNEL_ERROR') {
                    setDbError('Failed to connect to realtime updates.');
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
            throw error; // throw to UI
        } else {
            setDbError(null);
        }
    };

    // Intercept setIsBroadcasting to update Supabase
    const setIsBroadcasting = async (isLive) => {
        setIsBroadcastingState(isLive);
        const { error } = await supabase
            .from('fm-vibhavi')
            .update({ value: [{ isLive: isLive }] })
            .eq('key', 'station_status');
            
        if (error) {
            console.error('Update station status error:', error);
            setDbError(`Failed to update broadcast status: ${error.message}`);
            // Revert state if failed
            setIsBroadcastingState(!isLive);
        } else {
            setDbError(null);
        }
    };

    // Mock telemetry loop when broadcasting
    const isBroadcasting = isBroadcastingState;
    useEffect(() => {
        let timer;
        if (isBroadcasting && streamUrl) {
            setConnectionState('connecting');
            // Mock connecting delay
            setTimeout(() => setConnectionState('connected'), 1000);
            timer = setInterval(() => {
                setUptime(prev => prev + 1);
                setBufferHealth(Math.floor(Math.random() * 200) + 10); // 10ms - 210ms
                setBitrate(128 + Math.floor(Math.random() * 4) - 2); // slight variance
                setListenerCount(prev => Math.max(0, prev + Math.floor(Math.random() * 3) - 1));
            }, 1000);
        }
        else {
            setConnectionState('idle');
            setUptime(0);
            setBufferHealth(0);
        }
        return () => clearInterval(timer);
    }, [isBroadcasting, streamUrl]);

    return (
        <StreamContext.Provider value={{
            streamUrl, setStreamUrl,
            connectionState, setConnectionState,
            bitrate, setBitrate,
            bufferHealth, setBufferHealth,
            uptime, listenerCount,
            isBroadcasting, setIsBroadcasting,
            schedule, setSchedule,
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
