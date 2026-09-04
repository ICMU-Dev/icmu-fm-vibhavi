import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { verifyOperatorAccess, getRoleLabel } from '../../utils/auth';
import { AdminDashboard } from '../../pages/AdminDashboard';
import { NotFoundPage } from '../../pages/NotFoundPage';
import { Loader } from '../motion/loader';
import { ShieldAlert, ArrowLeft, Radio, ExternalLink, RefreshCw } from 'lucide-react';
import { AnimatedBadge } from '../motion/animated-badge';

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

    // Clean up SSO token from URL after capture so address bar stays clean
    if (ssoToken && typeof window !== 'undefined') {
      try {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      } catch (_) {}
    }

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
      <div className="flex flex-col items-center justify-center min-h-dvh bg-background text-foreground space-y-4 px-4 text-center">
        <div className="relative flex items-center justify-center">
          <div className="w-20 h-20 rounded-full border border-primary/20 animate-ping absolute"></div>
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/30">
            <Radio className="w-7 h-7 text-primary animate-pulse" />
          </div>
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-heading font-bold uppercase tracking-widest text-foreground">
            Verifying Operator Clearance
          </h2>
          <p className="text-xs text-muted-foreground font-mono">
            Auditing credentials with central ICMU database...
          </p>
        </div>
        <Loader variant="spinner" size={28} className="text-primary mt-2" />
      </div>
    );
  }

  if (!authorized) {
    const portalUrl =
      typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'http://localhost:5173'
        : 'https://dev.isipathanacollegemediaunit.com';

    return (
      <div className="min-h-dvh w-full bg-background flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden font-sans text-foreground">
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-destructive/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2" />

        <div className="w-full max-w-md bg-card/60 border border-destructive/30 rounded-3xl p-8 sm:p-10 shadow-(--shadow-ultimate) backdrop-blur-md flex flex-col items-center text-center space-y-6 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/30 flex items-center justify-center text-destructive shadow-[0_0_30px_rgba(239,68,68,0.25)]">
            <ShieldAlert className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-destructive">
                Security Protocol 403
              </span>
              {errorDetails.detectedRole && (
                <AnimatedBadge status="danger" size="sm" className="text-[9px] uppercase font-mono">
                  {getRoleLabel(errorDetails.detectedRole)}
                </AnimatedBadge>
              )}
            </div>
            <h1 className="text-2xl font-heading font-bold uppercase tracking-wider text-foreground">
              Clearance Restricted
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1">
              {errorDetails.reason}
            </p>
          </div>

          <div className="w-full border-t border-border/20 pt-4 flex flex-col gap-2.5">
            <a
              href={`${portalUrl}/${indexNumber || ''}`}
              className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-primary/90 transition-all active:scale-95 shadow-md">
              <span>Sign In via ICMU Portal</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              onClick={checkClearance}
              className="w-full py-3 px-4 rounded-xl bg-muted/40 border border-border/40 text-foreground font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-muted/70 transition-all active:scale-95">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Clearance Audit</span>
            </button>

            <Link
              to="/"
              className="w-full py-2 text-[11px] text-muted-foreground hover:text-foreground font-medium uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 pt-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Listen to Public Stream</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Clearance approved: render master control dashboard
  return <AdminDashboard operator={operator} />;
}

export default AdminRouteGuard;
