import React, { useState, useEffect, useRef } from 'react';
import { ICMU_PORTAL_URL } from '../../utils/constants';
import { getRoleLabel } from '../../utils/auth';
import { ArrowUpRight, Radio, Sparkles } from 'lucide-react';
import { Button } from '../motion/button';

function SafeAvatar({ src, name }) {
  const [hasError, setHasError] = useState(false);
  const initial = name ? name.trim().charAt(0).toUpperCase() : 'O';
  const isSafe = src && typeof src === 'string' && (src.startsWith('https:') || src.startsWith('http:') || src.startsWith('/') || src.startsWith('data:image/'));

  if (isSafe && !hasError) {
    return (
      <img
        src={src}
        alt={name || 'Operator'}
        className="w-full h-full object-cover"
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-primary/20 text-primary font-bold text-xs select-none">
      {initial}
    </div>
  );
}

export function ProfileCard({ operator }) {
  const [isOpen, setIsOpen] = useState(false);
  const cardRef = useRef(null);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cardRef.current && !cardRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!operator) return null;

  const indexNumber = operator.index_number || operator.indexNumber || 'OP';
  const fullName = operator.full_name || operator.name || 'Station Operator';
  const avatarUrl = operator.avatar_url || operator.avatarUrl;
  const roleLabel = getRoleLabel(operator.role);
  const portalUrl = `${ICMU_PORTAL_URL}/${encodeURIComponent(indexNumber)}`;

  return (
    <div className="relative" ref={cardRef}>
      {/* Profile Avatar Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-0.5 rounded-full hover:bg-card/60 transition-all focus:outline-none group active:scale-95"
        title={`${fullName} (${indexNumber})`}
        aria-label="Open Operator Profile"
      >
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-card border-2 border-primary/40 flex items-center justify-center text-xs font-bold text-foreground shrink-0 relative overflow-hidden shadow-sm group-hover:border-primary group-hover:ring-2 group-hover:ring-primary/20 group-hover:shadow-[0_0_12px_rgba(var(--primary),0.3)] transition-all">
          <SafeAvatar src={avatarUrl} name={fullName} />
          {/* Active online indicator */}
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-background pointer-events-none" />
        </div>
      </button>

      {/* Popover Profile Card */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2.5 w-72 sm:w-80 rounded-3xl border border-border/40 bg-card/95 backdrop-blur-2xl shadow-2xl p-4 sm:p-5 z-100 animate-in fade-in zoom-in-95 duration-150">
          {/* User Header */}
          <div className="flex items-center gap-3.5 pb-4 border-b border-border/20">
            <div className="w-12 h-12 rounded-full bg-primary/10 border-2 border-primary/40 flex items-center justify-center text-base font-bold text-foreground shrink-0 relative overflow-hidden shadow-inner">
              <SafeAvatar src={avatarUrl} name={fullName} />
              <div className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-background pointer-events-none" />
            </div>

            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-foreground truncate leading-snug">
                {fullName}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-mono text-[11px] font-bold text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded border border-border/20">
                  {indexNumber}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 truncate">
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>

     

          {/* Primary Action: ICMU Hub Link */}
          <div className="space-y-2 pt-1">
            <Button
              onClick={() => window.open(portalUrl, '_self')}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl font-semibold text-xs shadow-md hover:bg-primary/90 active:scale-98 transition-all group"
            >
              <div className="flex items-center gap-2">
                <span>Go to ICMU Hub</span>
              </div>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Button>

            <p className="text-[10px] text-center text-muted-foreground/70 pt-1">
              Connected via central ICMU SSO clearance
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileCard;
