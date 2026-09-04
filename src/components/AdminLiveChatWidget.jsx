import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, X, Send, Radio, User, Clock, ShieldCheck, Volume2 } from 'lucide-react';
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
  const [recentToast, setRecentToast] = useState(null);
  const channelRef = useRef(null);
  const inputRef = useRef(null);
  const toastTimeoutRef = useRef(null);

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

  // Supabase Realtime Broadcast subscription
  useEffect(() => {
    if (!admin) return;

    const channel = supabase.channel('admin-live-comms', {
      config: { broadcast: { self: false } }
    });

    channel.on('broadcast', { event: 'admin_message' }, ({ payload }) => {
      if (!payload || !payload.id) return;
      
      const now = Date.now();
      const expiresAt = now + MESSAGE_LIFETIME_MS;
      const newMsg = { ...payload, receivedAt: now, expiresAt };

      setMessages(prev => {
        // Keep unique messages
        if (prev.some(m => m.id === payload.id)) return prev;
        return [...prev, newMsg];
      });

      // Show toast if widget is closed
      setIsOpen(currentIsOpen => {
        if (!currentIsOpen) {
          setRecentToast(newMsg);
          if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
          toastTimeoutRef.current = setTimeout(() => {
            setRecentToast(null);
          }, 5000);
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
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [admin]);

  // Ephemeral garbage collector (purges messages older than 12s)
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setMessages(prev => {
        const remaining = prev.filter(m => m.expiresAt > now);
        return remaining.length === prev.length ? prev : remaining;
      });
    }, 300);

    return () => clearInterval(cleanupInterval);
  }, []);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setRecentToast(null);
      const t = setTimeout(() => inputRef.current?.focus(), 200);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const text = inputMessage.trim();
    if (!text || isSending || !admin) return;

    setIsSending(true);
    const now = Date.now();
    const msgId = `${admin.index_number || admin.id || 'admin'}-${now}-${Math.random().toString(36).slice(2, 6)}`;
    const payload = {
      id: msgId,
      senderName: admin.full_name || admin.name || 'Master Admin',
      senderRole: admin.role || 'Broadcaster',
      senderAvatar: admin.avatar_url || admin.avatarUrl || null,
      senderIndex: admin.index_number || admin.indexNumber || '',
      text,
      timestamp: now,
      expiresAt: now + MESSAGE_LIFETIME_MS
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
      {/* Toast Notification when closed */}
      <AnimatePresence>
        {!isOpen && recentToast && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.25 }}
            onClick={() => {
              setIsOpen(true);
              setRecentToast(null);
            }}
            className="absolute bottom-16 right-0 w-72 sm:w-80 bg-card/95 backdrop-blur-xl border border-primary/40 rounded-2xl p-3 shadow-2xl cursor-pointer hover:border-primary transition-colors flex items-start space-x-3 mb-2"
          >
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0 text-primary font-bold text-xs mt-0.5">
              {recentToast.senderAvatar ? (
                <img src={recentToast.senderAvatar} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                recentToast.senderName.slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground truncate">{recentToast.senderName}</span>
                <span className="text-[10px] uppercase font-bold text-primary tracking-wider">Live Note</span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 font-medium">{recentToast.text}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Morphing Panel Container */}
      <motion.div
        layout
        animate={{
          borderRadius: isOpen ? 24 : 9999,
          width: isOpen ? 'min(90vw, 360px)' : 52,
          height: isOpen ? 'auto' : 52
        }}
        transition={{
          type: 'spring',
          stiffness: 420,
          damping: 32
        }}
        className={`bg-card/95 backdrop-blur-2xl border shadow-(--shadow-ultimate) overflow-hidden ${
          isOpen ? 'border-border/60 p-4' : 'border-primary/40 p-0 flex items-center justify-center cursor-pointer hover:border-primary hover:scale-105 active:scale-95 transition-transform'
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
                <div className="flex items-center space-x-2">
                  <div className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold tracking-tight text-foreground flex items-center gap-1.5">
                      Admin Chat
                    
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-6 h-6 rounded-full bg-foreground/10 hover:bg-foreground/20 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Message Feed */}
              <div className="py-3 flex flex-col space-y-2 max-h-60 overflow-y-auto no-scrollbar min-h-32">
                <AnimatePresence initial={false}>
                  {messages.length === 0 ? (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground space-y-1.5"
                    >
                      <Radio className="w-6 h-6 text-primary/40 animate-pulse" />
                      <p className="text-xs font-semibold text-foreground/80">Channel is Quiet</p>
                      <p className="text-[10px] text-muted-foreground/70 max-w-56 leading-relaxed">
                        Messages broadcast live to active admins and vanish after 12 seconds.
                      </p>
                    </motion.div>
                  ) : (
                    messages.map((msg) => {
                      const timeLeftRatio = Math.max(0, (msg.expiresAt - Date.now()) / MESSAGE_LIFETIME_MS);
                      const isMe = (admin.index_number || admin.id) === msg.senderIndex;

                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 12, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9, filter: 'blur(2px)' }}
                          transition={{ duration: 0.25 }}
                          className={`rounded-xl p-2.5 border text-xs flex flex-col relative overflow-hidden ${
                            isMe
                              ? 'bg-primary/10 border-primary/30 ml-4'
                              : 'bg-background/60 border-border/20 mr-4'
                          }`}
                        >
                          {/* Sender Info */}
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-[11px] text-foreground flex items-center gap-1.5 truncate">
                              {msg.senderName}
                              <span className="text-[8px] font-bold px-1.5 py-0.2 rounded-sm bg-white/10 text-muted-foreground uppercase">
                                {msg.senderRole}
                              </span>
                            </span>
                          </div>

                          {/* Text */}
                          <p className="text-xs text-foreground/90 font-medium wrap-break-word leading-snug">
                            {msg.text}
                          </p>

                          {/* Disappearing Timer Line */}
                          <div className="w-full bg-white/5 h-0.5 rounded-full mt-2 overflow-hidden">
                            <motion.div
                              className="h-full bg-primary"
                              initial={{ width: '100%' }}
                              animate={{ width: '0%' }}
                              transition={{ duration: MESSAGE_LIFETIME_MS / 1000, ease: 'linear' }}
                            />
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </AnimatePresence>
              </div>

              {/* Input Box */}
              <form onSubmit={handleSendMessage} className="pt-2 border-t border-white/5 flex items-center gap-1.5">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type temporary live note..."
                  maxLength={160}
                  className="flex-1 bg-background/60 border border-border/20 rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary/60 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isSending}
                  className="h-8 px-3 rounded-xl bg-primary text-black font-bold text-xs flex items-center justify-center space-x-1 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 active:scale-95 transition-all shadow-[0_0_12px_rgba(var(--primary),0.4)]"
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
              aria-label="Open Admin Intercom"
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
