import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Radio, User, Clock, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { getAuthenticatedAdmin } from '../utils/auth';

const MESSAGE_LIFETIME_MS = 12000; // 12 seconds ephemeral lifetime

export function AdminLiveChatWidget() {
  const [admin, setAdmin] = useState(() => getAuthenticatedAdmin());
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [activePopout, setActivePopout] = useState(null);
  const [now, setNow] = useState(Date.now());
  const channelRef = useRef(null);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const popoutTimeoutRef = useRef(null);

  // Sync authenticated admin status
  useEffect(() => {
    const checkAdmin = () => {
      setAdmin(getAuthenticatedAdmin());
    };
    window.addEventListener('storage', checkAdmin);
    const interval = setInterval(checkAdmin, 2500);
    return () => {
      window.removeEventListener('storage', checkAdmin);
      clearInterval(interval);
    };
  }, []);

  // Tick clock every 500ms for subtle countdown numbers
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setNow(Date.now());
    }, 500);
    return () => clearInterval(clockInterval);
  }, []);

  // Supabase Realtime Broadcast subscription
  useEffect(() => {
    if (!admin) return;

    const channel = supabase.channel('admin-live-comms', {
      config: { broadcast: { self: false } }
    });

    channel.on('broadcast', { event: 'admin_message' }, ({ payload }) => {
      if (!payload || !payload.id) return;
      
      const currentTime = Date.now();
      const expiresAt = currentTime + MESSAGE_LIFETIME_MS;
      const newMsg = { ...payload, receivedAt: currentTime, expiresAt };

      setMessages(prev => {
        if (prev.some(m => m.id === payload.id)) return prev;
        return [...prev, newMsg];
      });

      // Pop out message NEXT to the FAB if the chat is currently closed
      setIsOpen(currentIsOpen => {
        if (!currentIsOpen) {
          setActivePopout(newMsg);
          if (popoutTimeoutRef.current) clearTimeout(popoutTimeoutRef.current);
          popoutTimeoutRef.current = setTimeout(() => {
            setActivePopout(null);
          }, MESSAGE_LIFETIME_MS);
        }
        return currentIsOpen;
      });
    });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channelRef.current = channel;
      }
    });

    return () => {
      if (popoutTimeoutRef.current) clearTimeout(popoutTimeoutRef.current);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [admin]);

  // Ephemeral garbage collector (purges messages older than 12s)
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const currentTime = Date.now();
      setMessages(prev => {
        const remaining = prev.filter(m => m.expiresAt > currentTime);
        return remaining.length === prev.length ? prev : remaining;
      });

      setActivePopout(prev => {
        if (prev && prev.expiresAt <= currentTime) {
          return null;
        }
        return prev;
      });
    }, 300);

    return () => clearInterval(cleanupInterval);
  }, []);

  // Focus input and scroll to bottom when panel opens
  useEffect(() => {
    if (isOpen) {
      setActivePopout(null);
      const t = setTimeout(() => {
        inputRef.current?.focus();
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 200);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Auto-scroll on new message if open
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isOpen]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const text = inputMessage.trim();
    if (!text || isSending || !admin) return;

    setIsSending(true);
    const currentTime = Date.now();
    const msgId = `${admin.index_number || admin.id || 'admin'}-${currentTime}-${Math.random().toString(36).slice(2, 6)}`;
    const payload = {
      id: msgId,
      senderName: admin.full_name || admin.name || 'Master Admin',
      senderRole: admin.role || 'Broadcaster',
      senderAvatar: admin.avatar_url || admin.avatarUrl || null,
      senderIndex: admin.index_number || admin.indexNumber || '',
      text,
      timestamp: currentTime,
      expiresAt: currentTime + MESSAGE_LIFETIME_MS
    };

    // Optimistically add to local messages
    setMessages(prev => [...prev, payload]);
    setInputMessage('');

    try {
      if (channelRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'admin_message',
          payload
        });
      }
    } catch (err) {
      console.warn('[AdminLiveComms] Send failed:', err);
    } finally {
      setIsSending(false);
    }
  };

  // If NOT an authenticated admin, render NOTHING (invisible to public listeners)
  if (!admin) return null;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 pointer-events-auto select-none font-sans">
      {/* Live Speech Bubble Popout NEXT to the FAB when closed */}
      <AnimatePresence>
        {!isOpen && activePopout && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 15, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 450, damping: 28 }}
            onClick={() => {
              setIsOpen(true);
              setActivePopout(null);
            }}
            className="absolute right-15 bottom-0 w-72 sm:w-84 bg-card/95 backdrop-blur-2xl border border-primary/50 rounded-2xl rounded-br-xs p-3.5 shadow-2xl cursor-pointer hover:border-primary transition-all flex flex-col space-y-2 group"
          >
            {/* Popout Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 min-w-0">
                <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0 text-primary font-bold text-[10px]">
                  {activePopout.senderAvatar ? (
                    <img src={activePopout.senderAvatar} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    activePopout.senderName.slice(0, 2).toUpperCase()
                  )}
                </div>
                <span className="text-xs font-bold text-foreground truncate">{activePopout.senderName}</span>
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-muted-foreground uppercase shrink-0">
                  {activePopout.senderRole}
                </span>
              </div>

              {/* Subtle Countdown Number */}
              <div className="flex items-center space-x-1 shrink-0 ml-1.5">
                <Clock className="w-3 h-3 text-primary/60" />
                <span className="text-[10px] font-mono font-bold text-primary tabular-nums">
                  {Math.max(1, Math.ceil((activePopout.expiresAt - now) / 1000))}s
                </span>
              </div>
            </div>

            {/* Popout Message Content */}
            <p className="text-xs text-foreground/95 font-medium line-clamp-2 leading-relaxed pl-1">
              {activePopout.text}
            </p>

            {/* Popout Footer Cue */}
            <div className="flex items-center justify-between pt-0.5 text-[9px] text-muted-foreground/70 font-semibold px-1 border-t border-white/5">
              <span>Click to open live comms</span>
              <span className="text-primary font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Reply <ArrowRight className="w-2.5 h-2.5" />
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Morphing Panel Container */}
      <motion.div
        layout
        animate={{
          borderRadius: isOpen ? 24 : 9999,
          width: isOpen ? 'min(92vw, 390px)' : 52,
          height: isOpen ? 'auto' : 52
        }}
        transition={{
          type: 'spring',
          stiffness: 420,
          damping: 32
        }}
        className={`bg-card/95 backdrop-blur-2xl border shadow-(--shadow-ultimate) overflow-hidden ${
          isOpen ? 'border-border/60 p-4 sm:p-5' : 'border-primary/40 p-0 flex items-center justify-center cursor-pointer hover:border-primary hover:scale-105 active:scale-95 transition-transform'
        }`}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            /* Open Panel */
            <motion.div
              key="panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col w-full"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center space-x-2.5">
                  <div className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
                      Admin Live Comms
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
                        {messages.length} active
                      </span>
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 rounded-full bg-foreground/10 hover:bg-foreground/20 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Message Feed with Generous Space & True Chat Bubbles */}
              <div className="py-3.5 flex flex-col space-y-3 max-h-76 sm:max-h-84 overflow-y-auto no-scrollbar min-h-40">
                <AnimatePresence initial={false}>
                  {messages.length === 0 ? (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground space-y-2"
                    >
                      <Radio className="w-7 h-7 text-primary/40 animate-pulse" />
                      <p className="text-xs font-semibold text-foreground/80">No Active Transmissions</p>
                      <p className="text-[11px] text-muted-foreground/70 max-w-64 leading-relaxed">
                        Messages broadcast live to other admins and disappear after a few seconds.
                      </p>
                    </motion.div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = (admin.index_number || admin.id) === msg.senderIndex;
                      const secondsLeft = Math.max(1, Math.ceil((msg.expiresAt - now) / 1000));

                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 12, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.92, filter: 'blur(2px)' }}
                          transition={{ duration: 0.22 }}
                          className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse self-end' : 'self-start'} max-w-[88%]`}
                        >
                          {/* Avatar for Incoming Messages */}
                          {!isMe && (
                            <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0 text-primary font-bold text-[10px] mt-1 shadow-sm">
                              {msg.senderAvatar ? (
                                <img src={msg.senderAvatar} alt="" className="w-full h-full rounded-full object-cover" />
                              ) : (
                                msg.senderName.slice(0, 2).toUpperCase()
                              )}
                            </div>
                          )}

                          {/* Outer Column: Nametag above, Chat Bubble below */}
                          <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} min-w-28`}>
                            {/* OUTER NAMETAG (Above the Bubble) */}
                            <div className={`flex items-center gap-1.5 mb-1 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                              {!isMe && (
                                <span className="font-bold text-[11px] text-foreground/90 truncate max-w-36">
                                  {msg.senderName}
                                </span>
                              )}
                              
                              <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-white/10 text-muted-foreground uppercase shrink-0">
                                {isMe ? 'You' : msg.senderRole}
                              </span>

                              {/* Subtle Number Duration */}
                              <span className="text-[9px] font-mono font-medium text-muted-foreground/60 tabular-nums ml-0.5">
                                {secondsLeft}s
                              </span>
                            </div>

                            {/* CHAT BUBBLE (Clean text only) */}
                            <div
                              className={`rounded-2xl p-3 shadow-md backdrop-blur-md ${
                                isMe
                                  ? 'bg-linear-to-br from-primary/20 via-primary/15 to-primary/10 border border-primary/40 rounded-tr-xs text-right'
                                  : 'bg-background/80 border border-border/30 rounded-tl-xs text-left'
                              }`}
                            >
                              <p className="text-xs sm:text-[13px] text-foreground font-normal break-words leading-relaxed">
                                {msg.text}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* Input Box with Comfortable Spacing */}
              <form onSubmit={handleSendMessage} className="pt-3 border-t border-white/5 flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type temporary live note..."
                  maxLength={160}
                  className="flex-1 bg-background/70 border border-border/30 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary/60 transition-colors shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isSending}
                  className="h-9 px-3.5 rounded-xl bg-primary text-black font-bold text-xs flex items-center justify-center space-x-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 active:scale-95 transition-all shadow-[0_0_12px_rgba(var(--primary),0.4)] cursor-pointer shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </motion.div>
          ) : (
            /* Closed Floating Action Button (FAB) */
            <button
              key="fab"
              type="button"
              onClick={() => setIsOpen(true)}
              aria-label="Open Admin Live Comms"
              className="w-full h-full flex items-center justify-center relative group"
            >
              <div className="relative flex items-center justify-center">
                <Radio className="w-5 h-5 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.8)] transition-transform group-hover:scale-110" />
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
              </div>

              {/* Active Message Count Badge */}
              {messages.length > 0 && (
                <span className="absolute -top-1 -left-1 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-primary text-black shadow-lg">
                  {messages.length}
                </span>
              )}
            </button>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
