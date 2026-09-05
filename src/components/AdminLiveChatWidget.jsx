import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Radio, User, Clock, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { getAuthenticatedAdmin } from '../utils/auth';

const BASE_MESSAGE_LIFETIME_MS = 60000; // 60 seconds base lifetime (extended from 12s)
const CHAT_ACTIVITY_INCREMENT_MS = 20000; // +20 seconds increment to preserve active conversations
const MAX_LIFETIME_CEILING_MS = 180000; // 3 minutes maximum ceiling

const calculateMessageLifetime = (text) => {
  const textBonusMs = Math.min(30000, Math.floor((text || '').length / 10) * 2000);
  return Math.min(MAX_LIFETIME_CEILING_MS, BASE_MESSAGE_LIFETIME_MS + textBonusMs);
};

const formatCountdown = (expiresAt, currentTime) => {
  const diffMs = Math.max(0, expiresAt - currentTime);
  const totalSeconds = Math.max(1, Math.ceil(diffMs / 1000));
  if (totalSeconds >= 60) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs > 0 ? `${secs}s` : ''}`;
  }
  return `${totalSeconds}s`;
};

const MAX_MESSAGE_LENGTH = 160;
const MIN_SEND_INTERVAL_MS = 1200; // 1.2s cooldown between sends
const BURST_WINDOW_MS = 10000; // 10s burst window
const MAX_BURST_COUNT = 4; // Max 4 messages per 10s

function isSafeUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const trimmed = url.trim();
    if (trimmed.startsWith('/') || trimmed.startsWith('data:image/')) return true;
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function AdminLiveChatWidget() {
  const [admin, setAdmin] = useState(() => getAuthenticatedAdmin());
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [rateLimitWarning, setRateLimitWarning] = useState('');
  const [activePopout, setActivePopout] = useState(null);
  const [now, setNow] = useState(Date.now());
  const channelRef = useRef(null);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const popoutTimeoutRef = useRef(null);
  const lastSendTimeRef = useRef(0);
  const recentSendsRef = useRef([]);

  const hasLongChat = messages.length >= 3 || messages.some(m => (m.text || '').length > 60);

  const handleExtendDuration = () => {
    const currentTime = Date.now();
    setMessages(prev =>
      prev.map(m => ({
        ...m,
        expiresAt: Math.min(currentTime + MAX_LIFETIME_CEILING_MS, Math.max(m.expiresAt, currentTime) + 30000)
      }))
    );
  };

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

  // Performance: Tick clock every 500ms ONLY when active messages or popout exist
  useEffect(() => {
    if (messages.length === 0 && !activePopout) return;
    const clockInterval = setInterval(() => {
      setNow(Date.now());
    }, 500);
    return () => clearInterval(clockInterval);
  }, [messages.length, activePopout]);

  // Supabase Realtime Broadcast subscription
  useEffect(() => {
    if (!admin) return;

    const channel = supabase.channel('admin-live-comms', {
      config: { broadcast: { self: false } }
    });

    channel.on('broadcast', { event: 'admin_message' }, ({ payload }) => {
      if (!payload || !payload.id) return;
      
      const currentTime = Date.now();
      const lifetime = calculateMessageLifetime(payload.text);
      const expiresAt = payload.expiresAt && payload.expiresAt > currentTime
        ? payload.expiresAt
        : currentTime + lifetime;

      const newMsg = { ...payload, receivedAt: currentTime, expiresAt };

      setMessages(prev => {
        // Extend existing active messages so the active thread is preserved!
        const extended = prev.map(m => ({
          ...m,
          expiresAt: Math.min(currentTime + MAX_LIFETIME_CEILING_MS, Math.max(m.expiresAt, currentTime + CHAT_ACTIVITY_INCREMENT_MS))
        }));
        if (extended.some(m => m.id === payload.id)) return extended;
        return [...extended, newMsg];
      });

      // Pop out message NEXT to the FAB if the chat is currently closed
      setIsOpen(currentIsOpen => {
        if (!currentIsOpen) {
          setActivePopout(newMsg);
          if (popoutTimeoutRef.current) clearTimeout(popoutTimeoutRef.current);
          popoutTimeoutRef.current = setTimeout(() => {
            setActivePopout(null);
          }, Math.min(30000, lifetime)); // Stays visible up to 30s next to FAB
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

  // Ephemeral garbage collector (purges expired messages)
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
    }, 500);

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
    setRateLimitWarning('');
    const rawText = inputMessage.trim();
    if (!rawText || isSending || !admin) return;

    // Rate Limit 1: Minimum cooldown between messages (1.2s)
    const currentTime = Date.now();
    if (currentTime - lastSendTimeRef.current < MIN_SEND_INTERVAL_MS) {
      setRateLimitWarning('Please wait 1s before transmitting again.');
      setTimeout(() => setRateLimitWarning(''), 2500);
      return;
    }

    // Rate Limit 2: Burst protection (max 4 messages in 10s)
    recentSendsRef.current = recentSendsRef.current.filter(t => currentTime - t < BURST_WINDOW_MS);
    if (recentSendsRef.current.length >= MAX_BURST_COUNT) {
      setRateLimitWarning('Rate limit reached (max 4 messages / 10s).');
      setTimeout(() => setRateLimitWarning(''), 3000);
      return;
    }

    // Input sanitization: strip control characters and clamp length
    const sanitizedText = rawText
      .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, '')
      .slice(0, MAX_MESSAGE_LENGTH)
      .trim();

    if (!sanitizedText) return;

    lastSendTimeRef.current = currentTime;
    recentSendsRef.current.push(currentTime);

    setIsSending(true);
    const lifetime = calculateMessageLifetime(sanitizedText);
    const expiresAt = currentTime + lifetime;

    const rawAvatar = admin.avatar_url || admin.avatarUrl || null;
    const safeAvatar = isSafeUrl(rawAvatar) ? rawAvatar : null;

    const msgId = `${admin.index_number || admin.id || 'admin'}-${currentTime}-${Math.random().toString(36).slice(2, 6)}`;
    const payload = {
      id: msgId,
      senderName: String(admin.full_name || admin.name || 'Master Admin').slice(0, 48),
      senderRole: String(admin.role || 'Broadcaster').slice(0, 32),
      senderAvatar: safeAvatar,
      senderIndex: String(admin.index_number || admin.indexNumber || '').slice(0, 20),
      text: sanitizedText,
      timestamp: currentTime,
      expiresAt
    };

    // Optimistically add to local messages and extend existing messages by activity increment
    setMessages(prev => {
      const extended = prev.map(m => ({
        ...m,
        expiresAt: Math.min(currentTime + MAX_LIFETIME_CEILING_MS, Math.max(m.expiresAt, currentTime + CHAT_ACTIVITY_INCREMENT_MS))
      }));
      return [...extended, payload];
    });
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
            className="absolute right-14 sm:right-15 bottom-0 w-[calc(100vw-5rem)] max-w-72 sm:max-w-84 bg-black/75 backdrop-blur-2xl border border-primary/40 rounded-2xl rounded-br-xs p-3 sm:p-3.5 shadow-2xl cursor-pointer hover:border-primary transition-all flex flex-col space-y-2 group text-white"
          >
            {/* Popout Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 min-w-0">
                <div className="w-6 h-6 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center shrink-0 text-primary font-bold text-[10px] overflow-hidden">
                  {activePopout.senderAvatar && isSafeUrl(activePopout.senderAvatar) ? (
                    <img src={activePopout.senderAvatar} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    activePopout.senderName.slice(0, 2).toUpperCase()
                  )}
                </div>
                <span className="text-xs font-bold text-white truncate max-w-28 sm:max-w-36">{activePopout.senderName}</span>
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-white/70 uppercase shrink-0">
                  {activePopout.senderRole}
                </span>
              </div>

              {/* Subtle Countdown Number */}
              <div className="flex items-center space-x-1 shrink-0 ml-1.5">
                <Clock className="w-3 h-3 text-primary/80" />
                <span className="text-[10px] font-bold text-primary tabular-nums">
                  {formatCountdown(activePopout.expiresAt, now)}
                </span>
              </div>
            </div>

            {/* Popout Message Content with Text Wrapping */}
            <p className="text-xs text-white/95 font-medium line-clamp-3 leading-relaxed pl-1 wrap-break-word whitespace-pre-wrap">
              {activePopout.text}
            </p>

            {/* Popout Footer Cue */}
            <div className="flex items-center justify-between pt-0.5 text-[9px] text-white/50 font-semibold px-1 border-t border-white/10">
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
          width: isOpen ? 'min(calc(100vw - 1.5rem), 400px)' : 52,
          height: isOpen ? 'auto' : 52
        }}
        transition={{
          type: 'spring',
          stiffness: 420,
          damping: 32
        }}
        className={`bg-black/75 backdrop-blur-2xl border shadow-2xl overflow-hidden max-h-[min(85dvh,620px)] flex flex-col ${
          isOpen ? 'border-white/15 p-3.5 sm:p-5' : 'border-primary/40 p-0 flex items-center justify-center cursor-pointer hover:border-primary hover:scale-105 active:scale-95 transition-transform bg-black/60 shadow-[0_0_20px_rgba(0,255,102,0.25)]'
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
                    <h3 className="text-xs sm:text-sm font-bold tracking-tight text-white flex items-center gap-2">
                      Admin Live Comms
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
                        {messages.length} active
                      </span>
                    </h3>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {messages.length > 0 && (
                    <button
                      type="button"
                      onClick={handleExtendDuration}
                      title="Extend message timers (+30s)"
                      className="px-2 py-0.5 rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/25 text-primary text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>+30s</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    aria-label="Close"
                    className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Message Feed with Dynamic Height & True Chat Bubbles */}
              <div
                className={`py-3 flex flex-col space-y-3 overflow-y-auto no-scrollbar transition-all duration-300 ${
                  messages.length === 0
                    ? 'min-h-36 max-h-48'
                    : hasLongChat
                    ? 'min-h-60 max-h-[min(65dvh,480px)] sm:max-h-125'
                    : 'min-h-44 max-h-[min(52dvh,380px)] sm:max-h-105'
                }`}
              >
                <AnimatePresence initial={false}>
                  {messages.length === 0 ? (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center py-10 text-center text-white/40 space-y-2"
                    >
                      <Radio className="w-7 h-7 text-primary/40 animate-pulse" />
                      <p className="text-xs font-semibold text-white/80">No Active Transmissions</p>
                      <p className="text-[11px] text-white/50 max-w-64 leading-relaxed">
                        Messages broadcast live to other admins and disappear after a short while.
                      </p>
                    </motion.div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = (admin.index_number || admin.id) === msg.senderIndex;
                      const timeString = formatCountdown(msg.expiresAt, now);

                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 12, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.92, filter: 'blur(2px)' }}
                          transition={{ duration: 0.22 }}
                          className={`flex items-start gap-2 sm:gap-2.5 ${isMe ? 'flex-row-reverse self-end' : 'self-start'} max-w-[92%] sm:max-w-[85%]`}
                        >
                          {/* Avatar for Incoming Messages */}
                          {!isMe && (
                            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center shrink-0 text-primary font-bold text-[9px] sm:text-[10px] mt-1 shadow-sm overflow-hidden">
                              {msg.senderAvatar && isSafeUrl(msg.senderAvatar) ? (
                                <img src={msg.senderAvatar} alt="" className="w-full h-full rounded-full object-cover" />
                              ) : (
                                msg.senderName.slice(0, 2).toUpperCase()
                              )}
                            </div>
                          )}

                          {/* Outer Column: Nametag above, Chat Bubble below */}
                          <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} min-w-0 max-w-full`}>
                            {/* OUTER NAMETAG (Above the Bubble) */}
                            <div className={`flex items-center gap-1.5 mb-1 px-1 ${isMe ? 'justify-end' : 'justify-start'} max-w-full overflow-hidden`}>
                              {!isMe && (
                                <span className="font-bold text-[11px] text-white truncate max-w-28 sm:max-w-36">
                                  {msg.senderName}
                                </span>
                              )}
                              
                              <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-white/10 text-white/60 uppercase shrink-0">
                                {isMe ? 'You' : msg.senderRole}
                              </span>

                              {/* Subtle Number Duration */}
                              <span className="text-[9px] font-medium text-white/40 tabular-nums ml-0.5 shrink-0">
                                {timeString}
                              </span>
                            </div>

                            {/* CHAT BUBBLE with complete text wrapping */}
                            <div
                              className={`rounded-2xl p-2.5 sm:p-3 shadow-md backdrop-blur-md max-w-full wrap-break-word ${
                                isMe
                                  ? 'bg-primary/20 border border-primary/40 rounded-tr-xs text-left'
                                  : 'bg-white/10 border border-white/15 rounded-tl-xs text-left'
                              }`}
                            >
                              <p className="text-xs sm:text-[13px] text-white font-normal wrap-break-word whitespace-pre-wrap leading-relaxed">
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

              {/* Rate Limit Notice */}
              {rateLimitWarning && (
                <div className="px-2 py-1 mb-1 rounded-lg bg-destructive/15 border border-destructive/30 text-[10px] text-destructive font-bold animate-pulse">
                  {rateLimitWarning}
                </div>
              )}

              {/* Input Box with Comfortable Spacing and Mobile-Friendly Font Size */}
              <form onSubmit={handleSendMessage} className="pt-2.5 border-t border-white/10 flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type temporary live note..."
                  maxLength={160}
                  className="flex-1 bg-white/5 border border-white/15 focus:border-primary rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 text-[14px] sm:text-xs text-white placeholder:text-white/40 outline-none transition-colors shadow-inner min-w-0"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isSending}
                  className="h-8.5 sm:h-9 px-3 sm:px-3.5 rounded-xl bg-primary text-black font-bold text-xs flex items-center justify-center space-x-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 active:scale-95 transition-all shadow-[0_0_12px_rgba(0,255,102,0.4)] cursor-pointer shrink-0"
                >
                  <Send className="w-3.5 h-3.5 text-black" />
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
