import { useState, useEffect } from 'react';
import { BroadcastButton } from '../components/BroadcastButton';
import { useStream } from '../context/StreamContext';
import { Input } from '../components/motion/input';
import { StatefulButton } from '../components/motion/button/stateful';
import { Label } from '../components/ui/label';
import { Radio, Settings, AlertTriangle, Globe, Copy, Check, ExternalLink, Send } from 'lucide-react';
import { CenterMorphModal, CenterMorphModalContent } from '../components/motion/center-morph-modal';
import { Button } from '../components/motion/button/base';
import { ActiveAdmins } from '../components/layout/ActiveAdmins';
import { ProfileCard } from '../components/layout/ProfileCard';
import { AtmosphereBackground } from '../components/layout/AtmosphereBackground';
import { NumberTicker } from '../components/motion/number-ticker';
import { useAdminPresence } from '../hooks/useAdminPresence';
import { supabase } from '../lib/supabase';
import { getPublicStationUrl } from '../config/station';
import fallbackDemo from '../data/demo.json';

export function AdminDashboard({ operator = null }) {
  const { streamUrl, setStreamUrl, bitrate, bufferHealth, uptime, listenerCount, isBroadcasting, currentTrack, dbError, setDbError } = useStream();
  const [configUrl, setConfigUrl] = useState(streamUrl);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [saveState, setSaveState] = useState('idle');
  const [urlError, setUrlError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeOperator, setActiveOperator] = useState(operator);
  const [copiedLink, setCopiedLink] = useState(false);
  const [demoData, setDemoData] = useState(fallbackDemo);

  const onlineAdmins = useAdminPresence(activeOperator);
  const totalAdminsOnline = Math.max(1, onlineAdmins?.length || 1);

  const publicStationUrl = getPublicStationUrl();

  // Load external demo.json if present
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

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicStationUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (_) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = publicStationUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } catch (_) {}
    }
  };

  useEffect(() => {
    if (operator) {
      setActiveOperator(operator);
    }
    const syncOperatorData = async () => {
      try {
        let op = operator;
        if (!op && typeof window !== 'undefined') {
          const raw = localStorage.getItem('icmu_session');
          if (raw) op = JSON.parse(raw);
        }
        
        if (op) {
          const indexNum = op.index_number || op.indexNumber;
          if (indexNum && (!op.avatar_url && !op.avatarUrl)) {
            const { data } = await supabase
              .from('users')
              .select('id, full_name, index_number, role, avatar_url')
              .eq('index_number', indexNum)
              .maybeSingle();

            if (data) {
              op = {
                ...op,
                id: data.id || op.id,
                full_name: data.full_name || op.name || op.full_name,
                avatar_url: data.avatar_url,
                avatarUrl: data.avatar_url,
                role: data.role || op.role,
              };
            }
          }
          setActiveOperator(op);
        }
      } catch (err) {
        console.warn('[AdminDashboard] Failed to sync operator details:', err);
      }
    };
    syncOperatorData();
  }, [operator]);

  // Sync hash routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'settings' || hash === 'dashboard') {
        setActiveTab(hash);
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleTabChange = (val) => {
    if (val) {
      setActiveTab(val);
      try {
        window.history.replaceState(null, '', `#${val}`);
      } catch (_) {}
    }
  };

  const handleSaveClick = async () => {
    if (configUrl) {
      try {
        const url = new URL(configUrl);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
          throw new Error('Must be http or https');
        }
        setUrlError('');
      } catch {
        setUrlError('Please enter a valid HTTP/HTTPS URL');
        return;
      }
    } else {
      setUrlError('');
    }

    if (isBroadcasting) {
      setIsModalOpen(true);
    } else {
      await executeSave();
    }
  };

  const executeSave = async () => {
    setSaveState('loading');
    setIsModalOpen(false);
    try {
        await setStreamUrl(configUrl);
        setSaveState('success');
        setTimeout(() => setSaveState('idle'), 2000);
    } catch {
        setSaveState('idle');
    }
  };

  const formatLiveDuration = (secs) => {
    if (!secs || isNaN(secs) || secs < 0) return "00:00:00";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const displayTrackTitle = isBroadcasting
    ? (currentTrack?.title || demoData.nowPlaying?.title || "Adare Karanna Igena Gann..")
    : (currentTrack?.title || "Station Offline");
  const upcomingShows = demoData.upcoming || [];

  return (
    <div className="min-h-dvh w-full font-sans relative overflow-x-hidden flex flex-col justify-between transition-colors duration-1000 bg-[#070b08] text-white select-none">
      
      {/* Visible Blurred Dynamic Campus Background Layer with campus_bg fallback */}
      <AtmosphereBackground variant="admin" opacity={isBroadcasting ? 0.82 : 0.42} blur={true} />

      {/* Header Bar */}
      <header className="w-full shrink-0 z-40 pt-4 pb-2 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Top Left: Dual Crests + Brand Title (Desktop) */}
          <div className="hidden md:flex items-center space-x-3 shrink-0">
            <div className="flex items-center space-x-2 shrink-0">
              <img 
                src="/assets/isipathana_crest.png" 
                alt="Isipathana College" 
                className="h-9 sm:h-10 w-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
              />
              <img 
                src="/apple-touch-icon.png" 
                alt="Media Unit" 
                className="h-9 sm:h-10 w-auto object-contain brightness-0 invert drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
              />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-bold tracking-[0.18em] text-white uppercase leading-tight drop-shadow-sm">
                ISIPATHANA COLLEGE
              </span>
              <span className="text-[9px] font-medium tracking-[0.25em] text-white/70 uppercase leading-tight drop-shadow-sm">
                MEDIA UNIT
              </span>
            </div>
          </div>

          {/* Center: Frosted Glass Unified Capsule (FM Vibhavi + Admins Online) + Profile Avatar */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-black/45 backdrop-blur-2xl border border-white/10 rounded-full px-4 sm:px-5 py-1.5 sm:py-2 gap-3 sm:gap-4 shadow-2xl min-w-2xs justify-between">
              {/* Sinhala Calligraphy Logo with Green FM */}
              <img 
                src="/assets/vibhavi_logo.png" 
                alt="FM Vibhavi" 
                className="h-6 sm:h-7 w-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
              />
              

              {/* Online Admins Info & Avatar Stack */}
              <div className="flex items-center gap-2">
                <div className="flex flex-col text-right">
                  <span className="text-[10px] sm:text-[11px] font-bold text-white leading-tight">
                    {totalAdminsOnline} {totalAdminsOnline === 1 ? 'Admin' : 'Admins'}
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-semibold tracking-wider text-primary uppercase leading-tight">
                    Online
                  </span>
                </div>
                <ActiveAdmins user={activeOperator} />
              </div>
            </div>

            {/* Operator Profile Circle */}
            <ProfileCard operator={activeOperator} />
          </div>

          {/* Right: Pill Switcher (Broadcast / Settings) */}
          <div className="flex items-center shrink-0">
            <div className="rounded-full p-1 bg-black/45 backdrop-blur-2xl border border-white/10 flex items-center shadow-xl">
              <button
                type="button"
                onClick={() => handleTabChange('dashboard')}
                className={`rounded-full px-4 sm:px-5 py-1.5 sm:py-2 text-xs font-bold tracking-wider uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-primary text-black shadow-[0_0_18px_rgba(0,255,102,0.45)]'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Broadcast</span>
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('settings')}
                className={`rounded-full px-4 sm:px-5 py-1.5 sm:py-2 text-xs font-bold tracking-wider uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-primary text-black shadow-[0_0_18px_rgba(0,255,102,0.45)]'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {dbError && (
        <div className="w-full max-w-lg mx-auto z-30 px-4 mt-2">
          <div className="bg-destructive/15 backdrop-blur-md text-destructive px-4 py-2.5 rounded-2xl shadow-lg flex items-center justify-between border border-destructive/30">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wide">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{dbError}</span>
            </div>
            <button onClick={() => setDbError(null)} className="opacity-70 hover:opacity-100 ml-4 text-xl leading-none cursor-pointer" aria-label="Dismiss error">
               &times;
            </button>
          </div>
        </div>
      )}

      {/* Main Studio Viewport */}
      <main className="w-full flex-1 flex flex-col justify-center items-center relative z-10 px-4 sm:px-6 py-4 sm:py-6">
        
        {/* TAB 1: BROADCAST STUDIO CONSOLE (Matches Reference Images) */}
        {activeTab === 'dashboard' && (
          <div className="w-full max-w-6xl mx-auto flex flex-col justify-center">
            
            {/* Desktop: 3-Column Layout */}
            <div className="hidden lg:grid grid-cols-12 gap-8 items-center justify-between w-full">
              
              {/* LEFT COLUMN: Clean Stacked Metrics */}
              <div className="col-span-3 flex flex-col space-y-6 text-left pl-2">
                <div className="flex flex-col">
                  <span className="text-xs sm:text-sm font-medium text-white/60 tracking-wider">
                    Audio Delay
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-white tracking-tight drop-shadow-sm">
                    {isBroadcasting ? (bufferHealth ? `${bufferHealth} ms` : '100 ms') : '--'}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-xs sm:text-sm font-medium text-white/60 tracking-wider">
                    Audio Quality
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-white tracking-tight drop-shadow-sm">
                    {isBroadcasting ? (bitrate ? `${bitrate} kbps` : '128 kbps') : '--'}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-xs sm:text-sm font-medium text-white/60 tracking-wider">
                    Live Duration:
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-white tracking-tight drop-shadow-sm tabular-nums">
                    {isBroadcasting ? formatLiveDuration(uptime) : '00:00:00'}
                  </span>
                </div>
              </div>

              {/* CENTER COLUMN: Frosted Glass Console Card */}
              <div className="col-span-6 flex justify-center">
                <div className="w-full max-w-105 rounded-[36px] bg-black/55 backdrop-blur-2xl border border-white/10 p-7 sm:p-4 shadow-2xl flex flex-col items-center text-center relative overflow-hidden space-y-4">
                  
                  {/* On Air / Off Air Badge */}
                  <div>
                    {isBroadcasting ? (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-bold tracking-widest uppercase shadow-[0_0_14px_rgba(239,68,68,0.4)] animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        On Air +
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-white/60 text-[10px] font-bold tracking-widest uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                        Off Air
                      </span>
                    )}
                  </div>

                  {/* Title & Frequency */}
                  <div className="space-y-0.5">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-normal text-white drop-shadow-md">
                      FM Vibhavi
                    </h2>
                    <p className="text-xs sm:text-sm text-white/60 font-medium tracking-wide">
                      102.5 MHz | Live Radio Console
                    </p>
                  </div>

                  {/* Concentric Broadcast Power Button (No Waveform) */}
                  <div className="py-2">
                    <BroadcastButton disabled={!streamUrl} />
                  </div>

                  {/* Now Playing Section */}
                  <div className="w-full flex flex-col items-center space-y-2">
                    <span className="text-[11px] font-medium text-white/50 tracking-wider uppercase">
                      Now Playing
                    </span>
                    <div className="rounded-full bg-white/10 hover:bg-white/15 border border-white/15 backdrop-blur-md px-5 py-2 text-xs sm:text-sm text-white font-medium max-w-xs truncate shadow-inner">
                      {displayTrackTitle}
                    </div>
                  </div>

                  {/* Active Listeners Count */}
                  <div className="flex items-center justify-center space-x-2 pt-1">
                    <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-sm tabular-nums">
                      <NumberTicker value={isBroadcasting ? (Number(listenerCount) || 0) : 0} />
                    </span>
                    <span className="text-xs text-left   text-white/60 font-medium">
                      Active <br/>Listeners
                    </span>
                  </div>

                  {/* Share Link Button */}
                  <div>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="relative inline-flex items-center space-x-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-md px-5 py-2 text-xs font-semibold text-white/90 shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5  text-white/80" />
                      <span>{copiedLink ? 'Copied!' : 'Share Link'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Coming Up Next Stack */}
              <div className="col-span-3 flex flex-col space-y-3 text-left pr-2">
                <h3 className="text-sm sm:text-base font-semibold text-white/90 tracking-wide mb-1">
                  Coming Up Next
                </h3>
                <div className="flex flex-col space-y-2.5">
                  {upcomingShows.map((show, idx) => (
                    <div
                      key={show.id || idx}
                      className="rounded-full bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/10 px-4 py-2.5 flex items-center justify-between text-xs sm:text-sm text-white/90 shadow-lg transition-all"
                    >
                      <div className="flex items-center min-w-0 pr-2">
                        {show.number && (
                          <span className="text-white/40 text-[11px] mr-2 font-bold shrink-0">
                            {show.number}
                          </span>
                        )}
                        <span className="font-medium truncate text-white/95">
                          {show.title}
                        </span>
                      </div>
                      <span className="text-[10px] sm:text-[11px] text-white/50 shrink-0 ml-2">
                        {show.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile: Stacked Layout (Matches media_1788564158100.png) */}
            <div className="lg:hidden flex flex-col items-center w-full max-w-sm mx-auto space-y-6 pb-8">
              
              {/* Center Console Card */}
              <div className="w-full rounded-4xl bg-black/55 backdrop-blur-2xl border border-white/10 p-6 shadow-2xl flex flex-col items-center text-center space-y-3.5">
                
                {/* On Air / Off Air Badge */}
                <div>
                  {isBroadcasting ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-bold tracking-widest uppercase shadow-[0_0_12px_rgba(239,68,68,0.4)] animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                      On Air +
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-white/60 text-[10px] font-bold tracking-widest uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                      Off Air
                    </span>
                  )}
                </div>

                {/* Title & Frequency */}
                <div className="space-y-0.5">
                  <h2 className="text-2xl font-bold tracking-normal text-white">
                    FM Vibhavi
                  </h2>
                  <p className="text-xs text-white/60 font-medium">
                    102.5 MHz | Live Radio Console
                  </p>
                </div>

                {/* Concentric Broadcast Power Button */}
                <div className="py-1">
                  <BroadcastButton disabled={!streamUrl} />
                </div>

                {/* Now Playing */}
                <div className="w-full flex flex-col items-center space-y-1.5">
                  <span className="text-[11px] font-medium text-white/50 tracking-wider uppercase">
                    Now Playing
                  </span>
                  <div className="rounded-full bg-white/10 border border-white/15 backdrop-blur-md px-4 py-1.5 text-xs text-white font-medium max-w-full truncate shadow-inner">
                    {displayTrackTitle}
                  </div>
                </div>

                {/* Active Listeners Count */}
                <div className="flex items-center justify-center space-x-2 pt-1">
                  <span className="text-3xl font-extrabold text-white tracking-tight tabular-nums">
                    <NumberTicker value={isBroadcasting ? (Number(listenerCount) || 0) : 0} />
                  </span>
                  <span className="text-xs text-left text-white/60 font-medium">
                    Active <br/>Listeners
                  </span>
                </div>

                {/* Share Link Button */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center space-x-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-md px-5 py-2 text-xs font-semibold text-white/90 shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 rotate-45 text-white/80" />
                    <span>{copiedLink ? 'Copied!' : 'Share Link'}</span>
                  </button>
                </div>
              </div>

              {/* Mobile Lower Section: Split Metrics & Coming Up */}
              <div className="w-full grid grid-cols-4 gap-4 items-start pt-2 px-2">
                
                {/* Left: Metrics */}
                <div className="flex flex-col space-y-4  col-span-1 text-left">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-white/60">Audio Delay</span>
                    <span className="text-base sm:text-lg font-bold text-white">
                      {isBroadcasting ? (bufferHealth ? `${bufferHealth} ms` : '100 ms') : '--'}
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-white/60">Audio Quality</span>
                    <span className="text-base sm:text-lg font-bold text-white">
                      {isBroadcasting ? (bitrate ? `${bitrate} kbps` : '128 kbps') : '--'}
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-white/60">Live Duration:</span>
                    <span className="text-base sm:text-lg font-bold text-white tabular-nums">
                      {isBroadcasting ? formatLiveDuration(uptime) : '00:00:00'}
                    </span>
                  </div>
                </div>

                {/* Right: Coming Up */}
                <div className="flex flex-col col-span-3 space-y-2 text-left">
                  <h3 className="text-xs font-semibold text-white/90 tracking-wide uppercase">
                    Coming Up
                  </h3>
                  <div className="flex flex-col space-y-1.5">
                    {upcomingShows.map((show, idx) => (
                      <div
                        key={`mob-show-${idx}`}
                        className="rounded-xl bg-white/10 border border-white/10 px-2.5 py-1.5 flex flex-col text-[11px] shadow-sm"
                      >
                        <span className="font-medium truncate text-white/95">
                          {show.title}
                        </span>
                        <span className="text-[9px] text-white/50">
                          {show.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STREAM SETTINGS (Matches media_1788566780008.png) */}
        {activeTab === 'settings' && (
          <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center my-auto py-8 sm:py-12 text-center select-none">
            
            {/* Title & Subtitle */}
            <div className="flex flex-col items-center space-y-1.5 mb-8">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
                Streaming Settings
              </h1>
              <p className="text-xs sm:text-sm text-white/75 font-medium tracking-wide">
                Configure Live Audio Broadcasting Link
              </p>
            </div>

            {/* Pill Capsule Input */}
            <div className="w-full max-w-xl flex flex-col items-center space-y-2">
              <div className="w-full relative flex items-center justify-center">
                <input
                  type="text"
                  value={configUrl}
                  onChange={(e) => {
                    setConfigUrl(e.target.value);
                    if (urlError) setUrlError('');
                  }}
                  placeholder="https://play.radioking.io/your-radio-station"
                  className="w-full rounded-full bg-black/60 backdrop-blur-2xl border border-white/15 px-6 sm:px-8 py-3.5 sm:py-4 text-center text-sm sm:text-base text-white font-medium shadow-2xl focus:outline-none focus:border-primary/60 transition-all placeholder:text-white/40 select-all"
                />
              </div>
              {urlError && (
                <p className="text-xs text-destructive font-bold animate-pulse">{urlError}</p>
              )}
            </div>

            {/* Save Changes Green Pill Button */}
            <div className="mt-5">
              <button
                type="button"
                onClick={handleSaveClick}
                disabled={configUrl === streamUrl || saveState === 'loading'}
                className="px-8 sm:px-10 py-2.5 sm:py-3 rounded-full bg-primary text-black font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(0,255,102,0.4)] hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {saveState === 'loading' ? 'Saving Changes...' : saveState === 'success' ? 'Changes Saved!' : 'Save Changes'}
              </button>
            </div>

            {/* Floating Share Link Pill Button */}
            <div className="mt-12 sm:mt-16">
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center space-x-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-md px-6 py-2.5 text-xs font-semibold text-white/90 shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 rotate-45 text-white/80" />
                <span>{copiedLink ? 'Copied!' : 'Share Link'}</span>
              </button>
            </div>

            {/* Prototype Mode Pill */}
            <div className="mt-8 sm:mt-10">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/40 font-medium tracking-wider uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60 animate-pulse" />
                <span>Running in Prototype Mode</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Admin Footer */}
      <footer className="py-4 pb-6 sm:pb-4 w-full flex items-center justify-center text-center z-10">
        <p className="text-[9px] sm:text-[10px] font-bold text-white/50 uppercase tracking-[0.25em] flex items-center justify-center space-x-1.5 drop-shadow-sm">
          <span>MADE WITH</span>
          <span className="text-primary">💚</span>
          <span>BY ISIPATHANA COLLEGE MEDIA UNIT</span>
        </p>
      </footer>

      {/* Center Morph Modal for Save Confirmation */}
      <CenterMorphModal open={isModalOpen} onOpenChange={setIsModalOpen}>
        <CenterMorphModalContent
          ariaLabel="Confirm Stream Change"
          backdropClassName="bg-black/60"
        >
          <div className="p-7 sm:p-8">
            <h2 className="text-xl font-semibold text-foreground">Change Active Stream URL?</h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              The station is currently <strong>on air</strong>. Changing the stream URL now will instantly disconnect all active listeners and attempt to reconnect them to the new feed.
            </p>
            <div className="mt-7 flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button onClick={executeSave}>Change Link</Button>
            </div>
          </div>
        </CenterMorphModalContent>
      </CenterMorphModal>
    </div>
  );
}
