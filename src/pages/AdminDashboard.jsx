import React, { useState, useEffect } from 'react';
import { BroadcastButton } from '../components/BroadcastButton';
import { useStream } from '../context/StreamContext';
import { Input } from '../components/motion/input';
import { StatefulButton } from '../components/motion/button/stateful';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/motion/tabs';
import { AnimatedBadge } from '../components/motion/animated-badge';
import { Label } from '../components/ui/label';
import { Radio, Settings, Clock, AlertTriangle, Heart, ArrowUpRight, Globe, Copy, Check, ExternalLink } from 'lucide-react';
import { CenterMorphModal, CenterMorphModalContent } from '../components/motion/center-morph-modal';
import { Button } from '../components/motion/button/base';
import { Logo } from '../components/Logo';
import { getRoleLabel } from '../utils/auth';
import { ActiveAdmins } from '../components/layout/ActiveAdmins';
import { ProfileCard } from '../components/layout/ProfileCard';
import { NumberTicker } from '../components/motion/number-ticker';
import { supabase } from '../lib/supabase';
import { getPublicStationUrl, isLocalhost } from '../config/station';

export function AdminDashboard({ operator = null }) {
  const { streamUrl, setStreamUrl, connectionState, bitrate, bufferHealth, uptime, listenerCount, isBroadcasting, currentTrack, dbError, setDbError } = useStream();
  const [configUrl, setConfigUrl] = useState(streamUrl);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [saveState, setSaveState] = useState('idle');
  const [urlError, setUrlError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [activeOperator, setActiveOperator] = useState(operator);
  const [copiedLink, setCopiedLink] = useState(false);

  const publicStationUrl = getPublicStationUrl();
  const isLocal = isLocalhost();

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

  // Sync hash routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'settings' || hash === 'dashboard') {
        setActiveTab(hash);
      }
    };
    handleHashChange(); // initial check
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
      } catch (e) {
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
    } catch (err) {
        setSaveState('idle');
        // dbError is automatically set by context
    }
  };

  const formatUptime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getStatusBadgeType = (state, isBroadcasting) => {
    if (!isBroadcasting) return 'neutral';
    if (state === 'connected') return 'success';
    if (state === 'connecting' || state === 'reconnecting') return 'loading';
    return 'danger';
  };

  return (
    <div className={`min-h-dvh w-full font-sans relative overflow-x-hidden flex flex-col transition-colors duration-1000 ease-in-out pb-6 no-scrollbar ${isBroadcasting ? 'bg-accent/10' : 'bg-background'}`}>
      
      {/* Network Offline Overlay */}
      {isOffline && (
        <div className="absolute inset-0 z-100 bg-background/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
          <AlertTriangle className="w-16 h-16 text-destructive mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold text-foreground mb-2 tracking-tight">Studio Disconnected</h2>
          <p className="text-muted-foreground text-sm max-w-sm">
            Your connection to the studio has been lost. The dashboard is locked until the network reconnects.
          </p>
        </div>
      )}

      {/* Background Glow */}
      <div className={`absolute inset-0 bg-(image:--radialPrimaryAccent) pointer-events-none mix-blend-screen transition-all duration-1000 ease-in-out ${isBroadcasting ? 'opacity-30 scale-110' : 'opacity-[0.03] scale-100'}`} />

      {/* Crisp, Separated Top Navigation Bar */}
      <header className="w-full border-b border-border/20 bg-card/40 backdrop-blur-xl shrink-0 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between">
          {/* Left: Logo & Station Title */}
          <div className="flex items-center space-x-3">
            <Logo variant="transparent" className="h-7 shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs font-heading font-bold uppercase tracking-wider text-foreground">FM Vibhavi</span>
              <span className="text-[10px] text-muted-foreground font-medium hidden sm:inline">102.5 MHz Studio</span>
            </div>
            {isBroadcasting && (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold tracking-wider uppercase ml-1 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                On Air
              </span>
            )}
          </div>

          {/* Right: Active Admins Stack + Profile Card */}
          <div className="flex items-center gap-3">
            <ActiveAdmins user={activeOperator} />
            <ProfileCard operator={activeOperator} />
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {dbError && (
        <div className="w-full max-w-lg mx-auto z-30 px-4 mt-3">
          <div className="bg-destructive/10 backdrop-blur-md text-destructive px-4 py-2.5 rounded-2xl shadow-lg flex items-center justify-between border border-destructive/30">
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

      <Tabs 
        value={activeTab} 
        onValueChange={handleTabChange}
        variant="pill"
        className="w-full flex-1 flex flex-col items-center relative z-10"
      >
        {/* Main Workspace Section with Clear Breathing Room */}
        <main className="w-full flex-1 flex flex-col items-center justify-start max-w-4xl mx-auto px-4 py-5 sm:py-7 no-scrollbar">
          {/* Studio Navigation Tabs */}
          <div className="w-full flex justify-center mb-6 sm:mb-8 shrink-0">
            <TabsList className="shadow-(--shadow-ultimate) p-1 border border-border/40 bg-card/60 backdrop-blur-md">
              <TabsTrigger value="dashboard" className="px-6 py-2">
                <Radio className="w-3.5 h-3.5 mr-2" />
                <span className="font-semibold text-xs tracking-wide">Broadcast</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="px-6 py-2">
                <Settings className="w-3.5 h-3.5 mr-2" />
                <span className="font-semibold text-xs tracking-wide">Settings</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab 1: Broadcast Studio */}
          <TabsContent value="dashboard" className="w-full flex flex-col items-center mt-0">
          <div className="w-full max-w-2xl flex flex-col items-center">
            <div className="w-full mb-4 sm:mb-6 flex flex-col items-center space-y-1 border-b border-border/20 pb-3 text-center shrink-0">
              <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase tracking-wider text-foreground">Broadcast Studio</h1>
              <p className="text-xs text-muted-foreground">FM Vibhavi 102.5 MHz • Live Radio Console</p>
            </div>

            <div className="bg-card/40 border border-border/20 rounded-3xl p-6 md:p-8 shadow-(--shadow-ultimate) w-full flex flex-col items-center backdrop-blur-sm shrink-0">
              {!streamUrl && (
                <div className="w-full mb-6 bg-primary-500/10 border border-primary-500/30 rounded-xl p-3 flex items-center justify-center space-x-2 text-primary-500 max-w-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span className="text-[11px] font-semibold">Please add your stream link in Settings to go live</span>
                </div>
              )}
              
              <BroadcastButton disabled={!streamUrl} />

              {currentTrack ? (
                <div className="mt-4 justify-center flex items-center shadow-ultimate space-x-2 bg-background/50 backdrop-blur-sm rounded-full px-3 py-1.5 border border-border/10 max-w-[65%]">
                   {currentTrack.cover && <img src={currentTrack.cover} alt="Cover" className="w-5 h-5 rounded-full object-cover shadow-sm shrink-0" />}
                   <marquee key={`${currentTrack.title}-${currentTrack.artist}`} behavior="scroll" direction="left" scrollamount="5">
                     <span className="flex items-center text-xs font-body text-muted-foreground uppercase tracking-widest">
                        {currentTrack.artist ? `${currentTrack.artist} - ${currentTrack.title}` : currentTrack.title}
                     </span>
                   </marquee>
                </div>
              ) : (
                <Heart className="w-6 h-6 text-primary mt-4 drop-shadow-[0_0_12px_rgba(var(--primary),0.6)] cursor-pointer hover:scale-110 transition-transform"/>
              )}  

              {/* Studio Metrics */}
              <div className="mt-6 sm:mt-8 w-full border-t border-border/20 pt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                 <div className="flex flex-col space-y-1.5 items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</span>
                    <AnimatedBadge 
                      status={getStatusBadgeType(connectionState, isBroadcasting)} 
                      pulse={isBroadcasting && (connectionState === 'connecting' || connectionState === 'reconnecting')}
                      className="shadow-ultimate uppercase tracking-wider"
                      size="sm"
                    >
                      {isBroadcasting ? (connectionState === 'connected' ? 'On Air' : connectionState === 'connecting' ? 'Connecting...' : connectionState) : 'Off Air'}
                    </AnimatedBadge>
                 </div>
                 
                 <div className="flex flex-col space-y-1.5 items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Audio Delay</span>
                    <AnimatedBadge 
                      status={isBroadcasting ? (bufferHealth > 150 ? 'warning' : 'success') : 'neutral'} 
                      showIcon={false}
                      size="sm" className={"shadow-ultimate"}
                    >
                      {isBroadcasting ? `${bufferHealth} ms` : '--'}
                    </AnimatedBadge>
                 </div>

                 <div className="flex flex-col space-y-1.5 items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Audio Quality</span>
                    <AnimatedBadge status={isBroadcasting ? 'info' : 'neutral'} showIcon={false} size="sm" className={"shadow-ultimate"}>
                      {isBroadcasting ? `${bitrate} kbps` : '--'}
                    </AnimatedBadge>
                 </div>

                 <div className="flex flex-col space-y-1.5 items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active Listeners</span>
                    <AnimatedBadge status={isBroadcasting ? 'info' : 'neutral'} showIcon={false} size="sm" className={"shadow-ultimate font-mono"}>
                      {isBroadcasting ? (
                        <NumberTicker value={Number(listenerCount) || 0} />
                      ) : '--'}
                    </AnimatedBadge>
                 </div>
              </div>

              <div className="w-full flex justify-center mt-6">
                  <AnimatedBadge status="neutral" icon={<Clock className="w-3.5 h-3.5" />} size="sm">
                     Live Duration: {formatUptime(uptime)}
                  </AnimatedBadge>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Settings */}
        <TabsContent value="settings" className="w-full flex flex-col items-center mt-0">
          <div className="w-full max-w-2xl flex flex-col items-center">
            <div className="w-full mb-4 sm:mb-6 flex flex-col items-center space-y-1 border-b border-border/20 pb-3 text-center shrink-0">
              <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase tracking-wider text-foreground">Stream Settings</h1>
              <p className="text-xs text-muted-foreground">Configure your live audio broadcast link</p>
            </div>

            <div className="bg-card/40 border border-border/20 rounded-3xl p-6 md:p-8 shadow-(--shadow-ultimate) flex flex-col backdrop-blur-sm w-full shrink-0">
              <div className="space-y-6 flex-1 flex flex-col">
                <div className="space-y-3">
                  <Label className="text-xs font-semibold tracking-wide text-muted-foreground pl-1">Live Stream Audio Link</Label>
                  <Input 
                    value={configUrl}
                    onChange={setConfigUrl}
                    error={urlError}
                    placeholder="https://play.radioking.io/your-radio-station"
                    className="font-mono text-sm bg-background border-border/50 py-5 px-5 rounded-2xl"
                  />
                </div>
                
                <p className="text-xs text-muted-foreground leading-relaxed p-4 bg-muted/20 rounded-2xl border border-border/10">
                  Enter your live stream audio link (Icecast or RadioKing). This link is used by all listeners on the public radio player. You must save a valid link before going on air.
                </p>
                
                <div className="pt-4">
                  <StatefulButton 
                      onClick={handleSaveClick}
                      state={saveState}
                      loadingText="Saving Stream Link..."
                      successText="Stream Link Saved!"
                      disabled={configUrl === streamUrl}
                      className="w-full uppercase tracking-wider font-bold py-5 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                      Save Stream Link
                  </StatefulButton>
                </div>
              </div>
            </div>

            {/* Public Player Share Card */}
            <div className="bg-card/40 border border-border/20 rounded-3xl p-6 md:p-8 shadow-(--shadow-ultimate) flex flex-col backdrop-blur-sm w-full shrink-0 mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-primary" />
                    <h2 className="text-sm font-semibold tracking-wide text-foreground">Public Station Link</h2>
                  </div>
                
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  Share this link with your listeners. On localhost, it dynamically points to your local server port; in production, it routes to your live domain (<span className="text-foreground font-mono font-bold">{publicStationUrl}</span>).
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                  <div className="flex-1 bg-background border border-border/50 py-3 px-4 rounded-2xl font-mono text-xs text-foreground select-all truncate flex items-center shadow-inner">
                    {publicStationUrl}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-4 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all active:scale-95 shadow-sm cursor-pointer"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-black" />
                          <span className="text-black font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>

                    <a
                      href={publicStationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center p-3 rounded-2xl bg-muted/40 hover:bg-muted/70 text-foreground border border-border/30 transition-colors"
                      title="Open Public Player in New Tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        </main>
      </Tabs>
      
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
