import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { verifyOperatorAccess, getRoleLabel } from '../../utils/auth';
import { AdminDashboard } from '../../pages/AdminDashboard';
import { NotFoundPage, ForbiddenPage } from '../../pages/NotFoundPage';
import { Loader } from '../motion/loader';
import { ShieldAlert, ArrowLeft, Radio, ExternalLink, RefreshCw } from 'lucide-react';
import { AnimatedBadge } from '../motion/animated-badge';
import { ICMU_PORTAL_URL } from '../../utils/constants';
import { AtmosphereBackground } from '../layout/AtmosphereBackground';

export function AdminRouteGuard() {
  const { indexNumber } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [checking, setChecking] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [operator, setOperator] = useState(null);
  const [errorDetails, setErrorDetails] = useState({
    reason: '',
    detectedRole: '',
  });

  const checkClearance = async () => {
    setChecking(true);
    setIsNotFound(false);
    const ssoToken = searchParams.get('sso_token');

    const result = await verifyOperatorAccess(indexNumber, ssoToken);

    if (result.notFound) {
      setIsNotFound(true);
      setChecking(false);
      return;
    }

    if (result.authorized && result.operator) {
      setAuthorized(true);
      setOperator(result.operator);

      // If accessed via /admin without an index in the path, update URL to their dynamic index
      if (!indexNumber && result.operator.index_number) {
        navigate(`/${result.operator.index_number}`, { replace: true });
      } else if (ssoToken && typeof window !== 'undefined') {
        // Clean up SSO token from URL after verification so address bar stays clean
        try {
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        } catch (_) {}
      }
    } else {
      setAuthorized(false);
      setErrorDetails({
        reason: result.reason || 'Broadcaster clearance required.',
        detectedRole: result.detectedRole || '',
      });
    }

    setChecking(false);
  };

  useEffect(() => {
    checkClearance();
  }, [indexNumber]);

  if (isNotFound) {
    return <NotFoundPage />;
  }

  if (checking) {
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
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-primary font-bold">Security Clearance</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
              Auditing Operator
            </h1>
            <p className="text-xs sm:text-sm text-white/75 font-medium tracking-wide max-w-md mx-auto">
              Verifying credentials with central ICMU database...
            </p>
          </div>

          {/* Pill Capsule Info with Loader */}
          <div className="w-full max-w-xl flex flex-col items-center space-y-2 mb-5">
            <div className="w-full rounded-full bg-black/60 backdrop-blur-2xl border border-white/15 px-6 sm:px-8 py-3.5 sm:py-4 flex items-center justify-center gap-3 text-center text-xs sm:text-sm text-white/85 font-medium shadow-2xl">
              <Loader variant="spinner" size={18} className="text-primary shrink-0" />
              <span>Connecting to secure station directory...</span>
            </div>
          </div>

          {/* Floating Secondary Action Pill Button Below */}
          <div className="mt-10 sm:mt-12 flex flex-wrap items-center justify-center gap-3">
            <Link to="/">
              <button
                type="button"
                className="inline-flex items-center space-x-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-md px-6 py-2.5 text-xs font-semibold text-white/90 shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Radio className="w-3.5 h-3.5 text-primary" />
                <span>Cancel & Return to Live Radio</span>
              </button>
            </Link>
          </div>
        </main>

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

  if (!authorized) {
    return (
      <ForbiddenPage 
        reason={errorDetails.reason} 
        detectedRole={errorDetails.detectedRole} 
        indexNumber={indexNumber} 
        onRetry={checkClearance} 
      />
    );
  }

  // Clearance approved: render master control dashboard
  return <AdminDashboard operator={operator} />;
}

export default AdminRouteGuard;
