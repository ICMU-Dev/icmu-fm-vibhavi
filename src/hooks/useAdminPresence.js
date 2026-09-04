import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

let globalAdmins = [];
let subscribers = new Set();
let channel = null;

const notifySubscribers = () => {
  subscribers.forEach((fn) => fn([...globalAdmins]));
};

export const useAdminPresence = (user) => {
  const [onlineAdmins, setOnlineAdmins] = useState(globalAdmins);

  useEffect(() => {
    if (!user || !supabase) return;

    const handler = (admins) => setOnlineAdmins(admins);
    subscribers.add(handler);

    if (!channel) {
      channel = supabase.channel('admin_presence_global', {
        config: { presence: { key: String(user.id || user.index_number || user.indexNumber || 'anon') } },
      });

      channel
        .on('presence', { event: 'sync' }, async () => {
          const state = channel.presenceState();
          const admins = Object.values(state).flatMap((p) => p);

          // Fetch latest avatar_url from Supabase users table safely
          const adminIds = admins.map((a) => a.id).filter(Boolean);
          if (adminIds.length > 0) {
            try {
              const { data: dbUsers, error } = await supabase
                .from('users')
                .select('id, avatar_url')
                .in('id', adminIds);

              if (!error && dbUsers) {
                admins.forEach((a) => {
                  const dbU = dbUsers.find((u) => u.id === a.id);
                  if (dbU) {
                    a.avatarUrl = a.avatarUrl || dbU.avatar_url || null;
                  }
                });
              }
            } catch (err) {
              console.warn('[Presence] Failed to enrich admin avatars:', err);
            }
          }

          globalAdmins = Array.from(new Map(admins.map((a) => [a.id || a.indexNumber, a])).values());
          notifySubscribers();
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            try {
              await channel.track({
                id: user.id || user.index_number || user.indexNumber,
                name: user.full_name || user.name || 'Operator',
                role: user.role || 'Broadcaster',
                indexNumber: user.index_number || user.indexNumber || null,
                avatarUrl: user.avatar_url || user.avatarUrl || null,
                onlineAt: new Date().toISOString(),
                location: 'FM Vibhavi Studio',
              });
            } catch (trackErr) {
              console.warn('[Presence] Failed to track presence:', trackErr);
            }
          }
        });
    }

    return () => {
      subscribers.delete(handler);
      if (subscribers.size === 0 && channel) {
        supabase.removeChannel(channel);
        channel = null;
        globalAdmins = [];
      }
    };
  }, [user]);

  return onlineAdmins;
};
