import React from 'react';
import { Link } from 'react-router-dom';
import { Radio, ArrowLeft, RadioReceiver, ExternalLink, Disc3 } from 'lucide-react';
import { Logo } from '../components/Logo';
import { getCookie, AUTH_COOKIE_KEYS } from '../utils/auth';

export function NotFoundPage() {
  const userIndex = getCookie(AUTH_COOKIE_KEYS.USER_INDEX);
  const portalUrl =
    typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? 'http://localhost:5173'
      : 'https://dev.isipathanacollegemediaunit.com';

  return (
    <div className="h-dvh w-full font-sans relative overflow-hidden flex flex-col items-center justify-center p-6 bg-background text-foreground">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-(image:--radialPrimaryAccent) pointer-events-none mix-blend-screen opacity-20 scale-100" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
      
      {/* Top Left Logo */}
      <div className="absolute top-6 left-6 md:left-8 z-50 flex items-center space-x-3">
        <Link to="/" className="flex items-center space-x-3 opacity-70 hover:opacity-100 transition-opacity">
          <Logo variant="transparent" className="h-6" />
          <span className="text-[10px] uppercase tracking-widest font-bold hidden sm:block">FM Vibhavi</span>
        </Link>
      </div>

      <div className="w-full max-w-lg mx-auto flex flex-col items-center text-center relative z-10 space-y-6">
        {/* Animated Radio Graphic */}
        <div className="relative flex items-center justify-center">
          <div className="w-24 h-24 rounded-full border border-primary/20 animate-ping absolute" />
          <div className="w-20 h-20 rounded-3xl bg-card/60 border border-border/40 backdrop-blur-md flex items-center justify-center shadow-(--shadow-ultimate) text-primary">
            <Radio className="w-10 h-10 animate-pulse" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-mono uppercase tracking-widest">
            <Disc3 className="w-3.5 h-3.5 animate-spin" />
            <span>Frequency 404 • Signal Lost</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold uppercase tracking-wider text-foreground">
            Station Not Found
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
            The frequency, operator console, or link you are trying to tune into does not exist or has been decommissioned.
          </p>
        </div>

        <div className="w-full max-w-sm flex flex-col gap-2.5 pt-2">
          <Link
            to="/"
            className="w-full py-3.5 px-5 rounded-2xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-primary/90 transition-all active:scale-95 shadow-(--shadow-ultimate)">
            <Radio className="w-4 h-4" />
            <span>Tune to Live Radio</span>
          </Link>

          {userIndex ? (
            <>
              <Link
                to={`/${userIndex}`}
                className="w-full py-3 px-5 rounded-2xl bg-card/60 hover:bg-card border border-border/30 text-foreground font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95">
                <RadioReceiver className="w-4 h-4 text-primary" />
                <span>Master Control ({userIndex})</span>
              </Link>

              <a
                href={`${portalUrl}/${userIndex}`}
                className="w-full py-2.5 text-xs text-muted-foreground hover:text-foreground font-medium uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 pt-1">
                <span>Return to ICMU Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </>
          ) : (
            <a
              href={portalUrl}
              className="w-full py-2.5 text-xs text-muted-foreground hover:text-foreground font-medium uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 pt-1">
              <span>Return to ICMU Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
