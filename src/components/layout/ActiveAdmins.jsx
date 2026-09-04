import React, { useState, useEffect, useRef } from 'react';
import { useAdminPresence } from '../../hooks/useAdminPresence';
import { Users, Radio } from 'lucide-react';
import { getRoleLabel } from '../../utils/auth';

function SafeAvatar({ src, name }) {
  const [hasError, setHasError] = useState(false);
  const initial = name ? name.trim().charAt(0).toUpperCase() : 'A';
  const isSafe = src && typeof src === 'string' && (src.startsWith('https:') || src.startsWith('http:') || src.startsWith('/') || src.startsWith('data:image/'));

  if (isSafe && !hasError) {
    return (
      <img
        src={src}
        alt={name || 'Admin'}
        className="w-full h-full object-cover"
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-primary/20 text-primary font-bold text-[10px] select-none">
      {initial}
    </div>
  );
}

export const ActiveAdmins = ({ user, isMobile = false }) => {
  const onlineAdmins = useAdminPresence(user);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter out the current user ("myself") so only other online admins are displayed
  // (The current user already has their own ProfileCard displayed right next to this stack)
  const currentUserId = user?.id ? String(user.id) : null;
  const currentIndex = (user?.index_number || user?.indexNumber)
    ? String(user?.index_number || user?.indexNumber)
    : null;

  const otherAdmins = (onlineAdmins || []).filter((admin) => {
    const adminId = admin.id ? String(admin.id) : null;
    const adminIndex = (admin.indexNumber || admin.index_number)
      ? String(admin.indexNumber || admin.index_number)
      : null;

    const isSelf =
      (currentUserId && adminId && currentUserId === adminId) ||
      (currentIndex && adminIndex && currentIndex === adminIndex);

    return !isSelf;
  });

  if (otherAdmins.length === 0) return null;

  const maxAvatars = 3;
  const displayAdmins = otherAdmins.slice(0, maxAvatars);
  const remaining = otherAdmins.length - displayAdmins.length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatars Stack Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 group transition-all duration-200 focus:outline-none p-1 rounded-full hover:bg-card/40 active:scale-95"
        title="View Other Active Admins"
        aria-label="View Other Active Admins"
      >
        <div className="flex -space-x-2">
          {displayAdmins.map((admin, idx) => {
            const pic = admin.avatarUrl || admin.avatar_url;
            return (
              <div
                key={admin.id || admin.indexNumber || idx}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-card border-2 border-background flex items-center justify-center text-[10px] font-bold text-foreground relative group-hover:border-primary/40 transition-colors shadow-sm overflow-hidden"
                style={{ zIndex: 10 - idx }}
              >
                <SafeAvatar src={pic} name={admin.name} />
                {/* Live green dot */}
                <div className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-background ring-1 ring-emerald-500/40 pointer-events-none" />
              </div>
            );
          })}
          {remaining > 0 && (
            <div
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[9px] font-bold text-muted-foreground shadow-sm"
              style={{ zIndex: 10 - maxAvatars }}
            >
              +{remaining}
            </div>
          )}
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute z-100 py-2 w-64 rounded-2xl border border-border/40 bg-card/95 backdrop-blur-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-150 ${
            isMobile
              ? 'right-0 top-full mt-2'
              : 'right-0 top-full mt-2 sm:right-0 sm:top-full'
          }`}
        >
          <div className="px-3.5 pb-2 mb-1 border-b border-border/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Active Admins ({otherAdmins.length})
              </span>
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto no-scrollbar px-1.5 space-y-1">
            {otherAdmins.map((admin) => {
              const pic = admin.avatarUrl || admin.avatar_url;

              return (
                <div
                  key={admin.id || admin.indexNumber || admin.name}
                  className="flex items-center justify-between gap-2.5 px-2 py-2 rounded-xl hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-card border border-border/40 flex items-center justify-center text-[10px] font-bold text-foreground shrink-0 relative overflow-hidden">
                      <SafeAvatar src={pic} name={admin.name} />
                      <div className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-emerald-500 ring-1 ring-background pointer-events-none" />
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-foreground truncate">
                        {admin.name || 'Admin'}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate">
                        {getRoleLabel(admin.role)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveAdmins;
