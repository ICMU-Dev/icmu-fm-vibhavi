import { Link } from 'react-router-dom';
import { Radio, ArrowLeft, RadioReceiver, ExternalLink, Disc3, ShieldAlert, AlertTriangle, RefreshCw } from 'lucide-react';
import { getCookie, AUTH_COOKIE_KEYS, getRoleLabel } from '../utils/auth';
import { ICMU_PORTAL_URL } from '../utils/constants';
import { AtmosphereBackground } from '../components/layout/AtmosphereBackground';

export function FallbackStatusPage({
  code = "404",
  title = "Station Not Found",
  subtitle = "Frequency 404 • Signal Lost",
  description = "The frequency, operator console, or link you are trying to tune into does not exist or has been decommissioned.",
  variant = "emerald", // "emerald" | "ruby" | "amber"
  icon: CustomIcon,
  detectedRole,
  indexNumber,
  onRetry,
  extraDetails,
  children
}) {
  const userIndex = indexNumber || getCookie(AUTH_COOKIE_KEYS.USER_INDEX);
  const portalUrl = ICMU_PORTAL_URL;

  const is403 = code === "403" || variant === "ruby";
  const is500 = code === "500" || variant === "amber";

  const IconComponent = CustomIcon || (is403 ? ShieldAlert : is500 ? AlertTriangle : Radio);

  return (
    <div className="min-h-dvh w-full font-sans relative overflow-x-hidden flex flex-col justify-between transition-colors duration-1000 bg-[#070b08] text-white select-none">
      
      {/* Visible Blurred Dynamic Campus Background Layer with campus_bg fallback */}
      <AtmosphereBackground variant="subdued" opacity={0.82} blur={true} />

      {/* Top Navigation Bar with Dual Crests & Brand Identity (Floating without Header Island) */}
      <header className="w-full shrink-0 z-40 pt-4 pb-2 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Left: Dual Crests + Title */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="flex items-center space-x-2 shrink-0">
              <img 
                src="/assets/isipathana_crest.png" 
                alt="Isipathana College" 
                className="h-8 sm:h-10 w-auto object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)] group-hover:scale-105 transition-transform"
              />
              <img 
                src="/apple-touch-icon.png" 
                alt="Media Unit" 
                className="h-8 sm:h-10 w-auto object-contain brightness-0 invert drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)] group-hover:scale-105 transition-transform"
              />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.18em] text-white uppercase leading-tight">
                ISIPATHANA COLLEGE
              </span>
              <span className="text-[8px] sm:text-[9px] font-medium tracking-[0.25em] text-white/70 uppercase leading-tight">
                MEDIA UNIT
              </span>
            </div>
          </Link>

          {/* Center: Vibhavi Calligraphy Logo */}
          <div className="hidden md:flex items-center justify-center">
            <Link to="/">
              <img 
                src="/assets/vibhavi_logo.png" 
                alt="FM Vibhavi" 
                className="h-8 sm:h-9 w-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)] hover:opacity-90 transition-opacity"
              />
            </Link>
          </div>

          {/* Right: Quick Action to Tune into Public Stream */}
          <div className="flex items-center gap-3">
            <Link 
              to="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold uppercase tracking-wider text-white transition-all shadow-sm active:scale-95"
            >
              <Radio className="w-3.5 h-3.5 text-primary" />
              <span className="hidden sm:inline">Live Radio</span>
              <span className="text-primary font-bold">102.5</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Floating Center Stage (Matches media_1788566780008.png) */}
      <main className="w-full flex-1 flex flex-col items-center justify-center my-auto px-4 py-8 sm:py-12 relative z-10 text-center select-none">
        
        {/* Title & Subtitle */}
        <div className="flex flex-col items-center space-y-1.5 mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/10 border border-white/15 text-xs uppercase tracking-widest mb-2 shadow-sm">
            {is403 ? (
              <>
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                <span className="text-red-400 font-bold">Security Protocol 403</span>
                {detectedRole && (
                  <span className="text-white/60">({getRoleLabel(detectedRole)})</span>
                )}
              </>
            ) : is500 ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-amber-400 font-bold">System Exception 500</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-white/90 font-bold">{subtitle}</span>
              </>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-white/75 font-medium tracking-wide max-w-md mx-auto">
            {description}
          </p>
        </div>

        {/* Pill Capsule Info/Details */}
        <div className="w-full max-w-xl flex flex-col items-center space-y-2 mb-5">
          <div className="w-xs md:w-full rounded-full bg-black/60 backdrop-blur-2xl border border-white/15 px-6 sm:px-8 py-3.5 sm:py-4 text-center text-xs sm:text-sm text-white/85 font-medium shadow-2xl">
            {is403 ? (
              <span>Clearance restricted • Authorized operator credentials required</span>
            ) : is500 ? (
              <span>Unexpected internal audio studio system exception</span>
            ) : (
              <span>The requested broadcast studio or resource does not exist</span>
            )}
          </div>
          {extraDetails && (
            <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl max-w-md w-full text-center text-[11px] text-white/60 overflow-x-auto">
              {extraDetails}
            </div>
          )}
        </div>

        {/* Primary Action Button (Green Pill) */}
        <div className="mt-1">
          {children ? (
            children
          ) : is403 ? (
            <a
              href={`${portalUrl}/${userIndex || ''}`}
              className="inline-flex items-center space-x-2 px-8 sm:px-10 py-2.5 sm:py-3 rounded-full bg-primary text-black font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(0,255,102,0.4)] hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              <span>Sign In via ICMU Portal</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          ) : is500 ? (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center space-x-2 px-8 sm:px-10 py-2.5 sm:py-3 rounded-full bg-primary text-black font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(0,255,102,0.4)] hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Studio Console</span>
            </button>
          ) : (
            <Link to="/">
              <button
                type="button"
                className="inline-flex items-center space-x-2 px-8 sm:px-10 py-2.5 sm:py-3 rounded-full bg-primary text-black font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(0,255,102,0.4)] hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              >
                <Radio className="w-4 h-4" />
                <span>Tune to Live Radio (102.5)</span>
              </button>
            </Link>
          )}
        </div>

        {/* Floating Secondary Action Pill Button Below (Matches media_1788566780008.png) */}
        <div className="mt-10 sm:mt-12 flex flex-wrap items-center justify-center gap-3">
          {is403 && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center space-x-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-md px-6 py-2.5 text-xs font-semibold text-white/90 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Clearance Audit</span>
            </button>
          )}

          {is403 && (
            <Link to="/">
              <button
                type="button"
                className="inline-flex items-center space-x-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-md px-6 py-2.5 text-xs font-semibold text-white/90 shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Radio className="w-3.5 h-3.5 text-primary" />
                <span>Return to Live Radio</span>
              </button>
            </Link>
          )}

          {!is403 && userIndex && (
            <Link to={`/${userIndex}`}>
              <button
                type="button"
                className="inline-flex items-center space-x-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-md px-6 py-2.5 text-xs font-semibold text-white/90 shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <RadioReceiver className="w-3.5 h-3.5 text-primary" />
                <span>Master Control ({userIndex})</span>
              </button>
            </Link>
          )}

          <a
            href={userIndex ? `${portalUrl}/${userIndex}` : portalUrl}
            className="inline-flex items-center space-x-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-md px-6 py-2.5 text-xs font-semibold text-white/90 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <span>Return to ICMU Website</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="pt-4 pb-4 w-full flex items-center justify-center text-center z-10">
        <p className="text-[9px] sm:text-[10px] font-bold text-white/50 uppercase tracking-[0.25em] flex items-center justify-center space-x-1.5">
          <span>MADE WITH</span>
          <span className="text-primary">💚</span>
          <span>BY ISIPATHANA COLLEGE MEDIA UNIT</span>
        </p>
      </footer>
    </div>
  );
}

export function NotFoundPage(props) {
  return (
    <FallbackStatusPage 
      code="404"
      title="Station Not Found"
      subtitle="Frequency 404 • Signal Lost"
      description="The frequency, operator console, or link you are trying to tune into does not exist or has been decommissioned."
      variant="emerald"
      {...props}
    />
  );
}

export function ForbiddenPage(props) {
  return (
    <FallbackStatusPage 
      code="403"
      title="Clearance Restricted"
      subtitle="Security Protocol 403 • Restricted"
      description={props.reason || "Broadcaster clearance required. Your credentials do not have permission to operate this studio console."}
      variant="ruby"
      {...props}
    />
  );
}

export default NotFoundPage;
