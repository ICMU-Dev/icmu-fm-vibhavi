import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

let globalAdmins = [];
let subscribers = new Set();
let channel = null;
const avatarCache = new Map();

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

          // Populate from cache if known
          admins.forEach((a) => {
            if (!a.avatarUrl && a.id && avatarCache.has(a.id)) {
              a.avatarUrl = avatarCache.get(a.id);
            }
          });

          // Fetch only missing avatar_urls from Supabase users table safely
          const missingIds = admins
            .map((a) => a.id)
            .filter((id) => Boolean(id) && !avatarCache.has(id));

          if (missingIds.length > 0) {
            try {
              const { data: dbUsers, error } = await supabase
                .from('users')
                .select('id, avatar_url')
                .in('id', missingIds);

              if (!error && dbUsers) {
                dbUsers.forEach((u) => {
                  if (u.id) avatarCache.set(u.id, u.avatar_url);
                });
                admins.forEach((a) => {
                  if (!a.avatarUrl && a.id && avatarCache.has(a.id)) {
                    a.avatarUrl = avatarCache.get(a.id);
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
