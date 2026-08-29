import React, { useState, useEffect } from 'react';
import { BroadcastButton } from '../components/BroadcastButton';
import { useStream } from '../context/StreamContext';
import { Input } from '../components/motion/input';
import { StatefulButton } from '../components/motion/button/stateful';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/motion/tabs';
import { AnimatedBadge } from '../components/motion/animated-badge';
import { Label } from '../components/ui/label';
import { Radio, Settings, Clock, AlertTriangle } from 'lucide-react';
import { CenterMorphModal, CenterMorphModalContent } from '../components/motion/center-morph-modal';
import { Button } from '../components/motion/button/base';
import { Logo } from '../components/Logo';

export function AdminDashboard() {
  const { streamUrl, setStreamUrl, connectionState, bitrate, bufferHealth, uptime, listenerCount, isBroadcasting, dbError, setDbError } = useStream();
  const [configUrl, setConfigUrl] = useState(streamUrl);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [saveState, setSaveState] = useState('idle');
  const [urlError, setUrlError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      window.location.hash = val;
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
    <div className={`h-dvh w-full font-sans relative overflow-hidden flex flex-col items-center justify-center py-6 transition-colors duration-1000 ease-in-out ${isBroadcasting ? 'bg-accent/10' : 'bg-background'}`}>
      {/* Background Glow */}
      <div className={`absolute inset-0 bg-(image:--radialPrimaryAccent) pointer-events-none mix-blend-screen transition-all duration-1000 ease-in-out ${isBroadcasting ? 'opacity-30 scale-110' : 'opacity-[0.03] scale-100'}`} />
      
      {/* Top Left Logo */}
      <div className="absolute top-6 left-6 md:left-8 z-50 pointer-events-none opacity-50 flex items-center space-x-3">
        <Logo variant="transparent" className="h-6" />
        <span className="text-[10px] uppercase tracking-widest font-bold hidden sm:block">FM Vibhavi</span>
      </div>

      {/* Error Banner */}
      {dbError && (
        <div className="absolute top-6 w-full max-w-lg mx-auto z-50 px-4">
          <div className="bg-destructive-foreground/90 backdrop-blur-md text-destructive px-4 py-3 rounded-xl shadow-lg flex items-center justify-between  border border-destructive/50">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wide">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{dbError}</span>
            </div>
            <button onClick={() => setDbError(null)} className="opacity-70 hover:opacity-100 ml-4 text-xl leading-none">
               &times;
            </button>
          </div>
        </div>
      )}

      <Tabs 
        value={activeTab} 
        onValueChange={handleTabChange}
        variant="pill"
        className="w-full h-full max-w-5xl mx-auto flex flex-col items-center relative z-10 px-4"
      >
        <div className="w-full flex justify-center mb-6 shrink-0">
          <TabsList className="shadow-(--shadow-ultimate) p-1.5 border border-border/40">
            <TabsTrigger value="dashboard" className="px-6 py-2.5">
              <Radio className="w-4 h-4 mr-2" />
              <span className="uppercase tracking-widest text-[11px]">Broadcast Control</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="px-6 py-2.5">
              <Settings className="w-4 h-4 mr-2" />
              <span className="uppercase tracking-widest text-[11px]">Settings</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="dashboard" className="w-full flex-1 flex flex-col justify-center items-center">
          <div className="w-full max-w-3xl flex flex-col items-center h-full justify-center">
            <header className="w-full mb-6 flex flex-col items-center space-y-1.5 border-b border-border/20 pb-4 text-center shrink-0">
              <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase tracking-widest text-foreground">Master Control</h1>
              <p className="text-xs text-muted-foreground">Engineering Operating System</p>
            </header>

            <div className="bg-card/40 border border-border/20 rounded-3xl p-6 md:p-8 shadow-(--shadow-ultimate) w-full flex flex-col items-center backdrop-blur-sm shrink-0">
              {!streamUrl && (
                <div className="w-full mb-6 bg-primary-500/10 border border-primary-500/30 rounded-xl p-3 flex items-center justify-center space-x-2 text-primary-500 max-w-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest mt-0.5">Setup Stream URL First</span>
                </div>
              )}
              
              <BroadcastButton disabled={!streamUrl} />

              {/* Vitals Footer using AnimatedBadge */}
              <div className="mt-8 w-full border-t border-border/20 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                 <div className="flex flex-col space-y-1.5 items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</span>
                    <AnimatedBadge 
                      status={getStatusBadgeType(connectionState, isBroadcasting)} 
                      pulse={isBroadcasting && (connectionState === 'connecting' || connectionState === 'reconnecting')}
                      className="uppercase tracking-widest"
                      size="sm"
                    >
                      {isBroadcasting ? connectionState : 'Standby'}
                    </AnimatedBadge>
                 </div>
                 
                 <div className="flex flex-col space-y-1.5 items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Buffer</span>
                    <AnimatedBadge 
                      status={isBroadcasting ? (bufferHealth > 150 ? 'warning' : 'success') : 'neutral'} 
                      showIcon={false}
                      size="sm"
                    >
                      {isBroadcasting ? `${bufferHealth} ms` : '--'}
                    </AnimatedBadge>
                 </div>

                 <div className="flex flex-col space-y-1.5 items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Bitrate</span>
                    <AnimatedBadge status={isBroadcasting ? 'info' : 'neutral'} showIcon={false} size="sm">
                      {isBroadcasting ? `${bitrate} kbps` : '--'}
                    </AnimatedBadge>
                 </div>

                 <div className="flex flex-col space-y-1.5 items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Listeners</span>
                    <AnimatedBadge status={isBroadcasting ? 'info' : 'neutral'} showIcon={false} contentKey={listenerCount} size="sm">
                      {isBroadcasting ? listenerCount : '--'}
                    </AnimatedBadge>
                 </div>
              </div>
              <div className="w-full flex justify-center mt-6">
                  <AnimatedBadge status="neutral" icon={<Clock className="w-3.5 h-3.5" />} size="sm">
                     Uptime: {formatUptime(uptime)}
                  </AnimatedBadge>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="w-full flex-1 flex flex-col justify-center items-center">
          <div className="w-full max-w-2xl flex flex-col items-center h-full justify-center">
            <header className="w-full mb-6 flex flex-col items-center space-y-1.5 border-b border-border/20 pb-4 text-center shrink-0">
              <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase tracking-widest text-foreground">Stream Configuration</h1>
              <p className="text-xs text-muted-foreground">Mount points and server options</p>
            </header>

            <div className="bg-card/40 border border-border/20 rounded-3xl p-6 md:p-8 shadow-(--shadow-ultimate) flex flex-col backdrop-blur-sm w-full shrink-0">
              <div className="space-y-6 flex-1 flex flex-col">
                <div className="space-y-3">
                  <Label className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase pl-2">Icecast Mount URL</Label>
                  <Input 
                    value={configUrl}
                    onChange={setConfigUrl}
                    error={urlError}
                    placeholder="https://radio.example.com/stream"
                    className="font-mono text-sm bg-background border-border/50 py-5 px-5 rounded-2xl"
                  />
                </div>
                
                <p className="text-xs text-muted-foreground leading-relaxed p-4 bg-muted/20 rounded-2xl border border-border/10">
                  Enter your live streaming endpoint. The URL is saved in the central configuration database. You must configure a valid link here before you can go on air.
                </p>
                
                <div className="pt-4">
                  <button 
                      onClick={handleSaveClick}
                      disabled={saveState === 'loading'}
                      className="w-full uppercase tracking-widest font-bold py-5 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                      {saveState === 'loading' ? 'Saving Configuration...' : saveState === 'success' ? 'Configuration Saved' : 'Save Configuration'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Center Morph Modal for Save Confirmation */}
      <CenterMorphModal open={isModalOpen} onOpenChange={setIsModalOpen}>
        <CenterMorphModalContent
          ariaLabel="Confirm Stream Change"
          backdropClassName="bg-black/60"
        >
          <div className="p-7 sm:p-8">
            <h2 className="text-xl font-semibold text-foreground">Are you sure?</h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              The station is currently <strong>on air</strong>. Changing the stream URL now will instantly disconnect all active listeners and attempt to reconnect them to the new feed.
            </p>
            <div className="mt-7 flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button onClick={executeSave} >Change URL</Button>
            </div>
          </div>
        </CenterMorphModalContent>
      </CenterMorphModal>
    </div>
  );
}
