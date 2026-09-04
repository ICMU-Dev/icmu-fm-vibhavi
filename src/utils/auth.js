/**
 * FM-Vibhavi Broadcasting Station Authentication & Clearance Utility
 * 
 * Synchronizes with ICMU Web using shared cookies, SSO handoff tokens,
 * and live validation against the shared Supabase database.
 */

import { supabase } from '../lib/supabase';

export const AUTH_COOKIE_KEYS = {
  SESSION: 'icmu_session',
  USER_INDEX: 'icmu_user_index',
  USER_ROLE: 'icmu_role',
  SSO_TOKEN: 'icmu_sso_token',
};

/**
 * Read a cookie by name from document.cookie
 */
export function getCookie(name) {
  if (typeof document === 'undefined') return null;
  try {
    const match = document.cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]*)'));
    if (!match) return null;
    const decoded = decodeURIComponent(match[2]);
    try {
      return JSON.parse(decoded);
    } catch {
      return decoded;
    }
  } catch {
    return null;
  }
}

/**
 * Set a cookie in document.cookie
 */
export function setCookie(name, value, days = 30) {
  if (typeof document === 'undefined') return;
  try {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
    const encoded = encodeURIComponent(stringValue);

    document.cookie = `${name}=${encoded}; expires=${expires}; path=/; SameSite=Lax${isSecure ? '; Secure' : ''}`;
  } catch (e) {
    console.warn('[Auth] Failed to set cookie:', name, e);
  }
}

/**
 * Remove a cookie from document.cookie
 */
export function removeCookie(name) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

/**
 * Decodes URL-safe base64 SSO token
 */
export function decodeSsoToken(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    let base64 = token.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const json = decodeURIComponent(escape(atob(base64)));
    const payload = JSON.parse(json);
    if (payload.exp && Date.now() > payload.exp) {
      console.warn('[Auth] SSO token has expired');
      return null;
    }
    return payload;
  } catch (err) {
    console.warn('[Auth] Failed to decode SSO token:', err);
    return null;
  }
}

export function hasBroadcasterClearance(roleStr) {
  if (!roleStr) return false;
  
  let roles = [];
  if (Array.isArray(roleStr)) {
    roles = roleStr.map((r) => String(r).trim().toLowerCase());
  } else if (typeof roleStr === 'string') {
    const cleaned = roleStr.replace(/[\[\]{}"';]/g, '').toLowerCase();
    roles = cleaned.split(',').map((r) => r.trim());
  } else {
    try {
      const cleaned = String(roleStr).replace(/[\[\]{}"';]/g, '').toLowerCase();
      roles = cleaned.split(',').map((r) => r.trim());
    } catch {
      return false;
    }
  }

  return roles.some(
    (r) =>
      r === 'broadcaster' ||
      r === 'super-admin' ||
      r === 'superadmin' ||
      r === 'super_admin'
  );
}

export function getRoleLabel(roleStr) {
  if (!roleStr) return 'Unassigned';
  
  let roles = [];
  if (Array.isArray(roleStr)) {
    roles = roleStr.map((r) => String(r).trim().toLowerCase());
  } else if (typeof roleStr === 'string') {
    const cleaned = roleStr.replace(/[\[\]{}"';]/g, '').toLowerCase();
    roles = cleaned.split(',').map((r) => r.trim());
  } else {
    try {
      const cleaned = String(roleStr).replace(/[\[\]{}"';]/g, '').toLowerCase();
      roles = cleaned.split(',').map((r) => r.trim());
    } catch {
      return 'Unassigned';
    }
  }

  if (roles.some((r) => r === 'super-admin' || r === 'superadmin' || r === 'super_admin')) {
    return 'Super Admin';
  }
  const hasAdmin = roles.includes('admin');
  const hasBroadcaster = roles.includes('broadcaster');

  if (hasAdmin && hasBroadcaster) return 'Admin + Broadcaster';
  if (hasBroadcaster) return 'Broadcaster';
  if (hasAdmin) return 'Admin';
  return String(roleStr);
}

/**
 * Verifies an operator's access for the FM-Vibhavi Master Control terminal.
 * Checks URL SSO token, cookies, and verifies live identity with the shared Supabase DB.
 * 
 * @param {string} routeIndexNumber - e.g. "000000" from route /:indexNumber
 * @param {string|null} ssoTokenFromUrl - ?sso_token=... from URL
 * @returns {Promise<{ authorized: boolean, operator: object|null, reason?: string, detectedRole?: string }>}
 */
export async function verifyOperatorAccess(routeIndexNumber, ssoTokenFromUrl = null) {
  try {
    let resolvedIndex = routeIndexNumber;
    let ssoPayload = null;

    // Helper for safe, type-agnostic index number matching
    const matchIndices = (a, b) => {
      if (a == null || b == null) return false;
      return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
    };

    // If route segment is non-numeric (and not 'admin'), treat as 404 page
    if (routeIndexNumber && !/^\d+$/.test(routeIndexNumber) && routeIndexNumber !== 'admin') {
      return {
        notFound: true,
        authorized: false,
        operator: null,
        reason: 'Page not found.',
      };
    }

    // 1. Process SSO token: check URL first, then fall back to saved cookie / localStorage
    let activeToken = ssoTokenFromUrl || getCookie(AUTH_COOKIE_KEYS.SSO_TOKEN) || null;
    if (!activeToken && typeof localStorage !== 'undefined') {
      try {
        activeToken = localStorage.getItem('icmu_sso_token') || null;
      } catch (_) {}
    }

    if (activeToken) {
      const decoded = decodeSsoToken(activeToken);
      if (decoded && decoded.indexNumber) {
        ssoPayload = decoded;
        resolvedIndex = resolvedIndex || ssoPayload.indexNumber;
      } else if (ssoTokenFromUrl) {
        console.warn('[Auth] SSO token provided in URL was invalid or expired');
      }
    }

    // 2. Fetch existing session from cookies/storage
    const cookieIndex = getCookie(AUTH_COOKIE_KEYS.USER_INDEX);
    const cookieRole = getCookie(AUTH_COOKIE_KEYS.USER_ROLE);
    const cookieSession = getCookie(AUTH_COOKIE_KEYS.SESSION);
    let localSession = null;

    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem('icmu_session');
        if (raw) {
          localSession = JSON.parse(raw);
        }
      } catch (_) {}
    }

    let existingSessionIndex = 
      cookieIndex || 
      cookieSession?.indexNumber || 
      cookieSession?.index_number || 
      localSession?.indexNumber || 
      localSession?.index_number || 
      null;

    // If no route index was provided (e.g. /admin), resolve to known session or SSO index
    if (!resolvedIndex || resolvedIndex === 'admin') {
      resolvedIndex = existingSessionIndex || ssoPayload?.indexNumber || null;
    }

    if (!resolvedIndex || resolvedIndex === 'admin') {
      return {
        authorized: false,
        operator: null,
        reason: 'No operator identity provided. Please sign in via the ICMU Portal.',
      };
    }

    // SECURITY GATE: Verify operator owns the requested index
    const hasValidSsoToken = Boolean(ssoPayload && matchIndices(ssoPayload.indexNumber, resolvedIndex));
    const hasValidExistingSession = Boolean(existingSessionIndex && matchIndices(existingSessionIndex, resolvedIndex));

    if (!hasValidSsoToken && !hasValidExistingSession) {
      return {
        authorized: false,
        operator: null,
        reason: 'Unverified Access. You must launch the broadcasting studio from your authenticated ICMU Portal.',
      };
    }

    // 3. Fast-path: If valid non-expired SSO token matches resolved index and has clearance
    if (hasValidSsoToken && hasBroadcasterClearance(ssoPayload.role)) {
      // Persist SSO token
      if (activeToken) {
        setCookie(AUTH_COOKIE_KEYS.SSO_TOKEN, activeToken);
        if (typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem('icmu_sso_token', activeToken);
          } catch (_) {}
        }
      }

      const avatar = ssoPayload.avatarUrl || cookieSession?.avatarUrl || cookieSession?.avatar_url || localSession?.avatarUrl || localSession?.avatar_url || null;
      const normalizedOp = {
        id: ssoPayload.id || cookieSession?.id || localSession?.id,
        full_name: ssoPayload.name || cookieSession?.name || cookieSession?.full_name || localSession?.name || localSession?.full_name || 'Broadcaster',
        name: ssoPayload.name || cookieSession?.name || cookieSession?.full_name || localSession?.name || localSession?.full_name || 'Broadcaster',
        index_number: ssoPayload.indexNumber,
        indexNumber: ssoPayload.indexNumber,
        role: ssoPayload.role,
        avatar_url: avatar,
        avatarUrl: avatar,
      };

      setCookie(AUTH_COOKIE_KEYS.USER_INDEX, ssoPayload.indexNumber);
      setCookie(AUTH_COOKIE_KEYS.USER_ROLE, ssoPayload.role);
      setCookie(AUTH_COOKIE_KEYS.SESSION, normalizedOp);

      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem('icmu_session', JSON.stringify(normalizedOp));
        } catch (_) {}
      }

      // Background verify and sync avatar/details without blocking UI
      supabase
        .from('users')
        .select('id, full_name, index_number, role, is_active, avatar_url, email')
        .eq('index_number', resolvedIndex)
        .maybeSingle()
        .then(({ data }) => {
          if (data && data.is_active !== false) {
            const updated = {
              id: data.id,
              full_name: data.full_name,
              name: data.full_name,
              role: data.role,
              index_number: data.index_number,
              indexNumber: data.index_number,
              avatar_url: data.avatar_url,
              avatarUrl: data.avatar_url,
            };
            setCookie(AUTH_COOKIE_KEYS.SESSION, updated);
            if (typeof localStorage !== 'undefined') {
              try {
                localStorage.setItem('icmu_session', JSON.stringify(updated));
              } catch (_) {}
            }
          }
        })
        .catch(() => {});

      return {
        authorized: true,
        operator: normalizedOp,
      };
    }

    // 4. Query the shared Supabase database for the live user record
    const { data: dbUser, error } = await supabase
      .from('users')
      .select('id, full_name, index_number, role, is_active, avatar_url, email')
      .eq('index_number', resolvedIndex)
      .maybeSingle();

    if (error || !dbUser) {
      // Supabase query failed or was blocked by Row Level Security (RLS)
      if (error) {
        console.warn('[Auth] Supabase verification query notice:', error.message);
      }

      // Graceful fallback to verified SSO token
      if (hasValidSsoToken && hasBroadcasterClearance(ssoPayload.role)) {
        return {
          authorized: true,
          operator: {
            id: ssoPayload.id,
            full_name: ssoPayload.name,
            name: ssoPayload.name,
            index_number: ssoPayload.indexNumber,
            indexNumber: ssoPayload.indexNumber,
            role: ssoPayload.role,
            avatar_url: cookieSession?.avatar_url || localSession?.avatar_url || null,
            avatarUrl: cookieSession?.avatarUrl || localSession?.avatarUrl || null,
          },
        };
      }

      // Graceful fallback to verified existing session
      const savedRole = cookieRole || cookieSession?.role || localSession?.role;
      if (hasValidExistingSession && hasBroadcasterClearance(savedRole)) {
        const fallbackOp = {
          id: cookieSession?.id || localSession?.id || resolvedIndex,
          full_name: cookieSession?.name || cookieSession?.full_name || localSession?.name || localSession?.full_name || `Operator ${resolvedIndex}`,
          name: cookieSession?.name || cookieSession?.full_name || localSession?.name || localSession?.full_name || `Operator ${resolvedIndex}`,
          index_number: resolvedIndex,
          indexNumber: resolvedIndex,
          role: savedRole,
          avatar_url: cookieSession?.avatar_url || cookieSession?.avatarUrl || localSession?.avatar_url || localSession?.avatarUrl || null,
          avatarUrl: cookieSession?.avatarUrl || cookieSession?.avatar_url || localSession?.avatarUrl || localSession?.avatar_url || null,
        };
        return {
          authorized: true,
          operator: fallbackOp,
        };
      }

      if (!dbUser && !error) {
        return {
          notFound: true,
          authorized: false,
          operator: null,
          reason: `Operator identity [${resolvedIndex}] not registered in central database.`,
        };
      }

      return {
        authorized: false,
        operator: null,
        reason: 'Database verification failed: ' + (error?.message || 'Unauthorized'),
      };
    }

    // 5. Check if account is suspended
    if (dbUser.is_active === false) {
      return {
        authorized: false,
        operator: null,
        reason: 'Your operator clearance has been suspended by an administrator.',
      };
    }

    // 6. Verify role clearance includes Broadcaster
    const isAuthorized = hasBroadcasterClearance(dbUser.role);
    if (!isAuthorized) {
      return {
        authorized: false,
        operator: null,
        detectedRole: dbUser.role,
        reason: `Clearance level [${getRoleLabel(dbUser.role)}] is restricted. Broadcaster clearance required to operate Master Control.`,
      };
    }

    // 7. Persist verified session in local cookies and storage
    const normalizedDbUser = {
      id: dbUser.id,
      full_name: dbUser.full_name,
      name: dbUser.full_name,
      role: dbUser.role,
      index_number: dbUser.index_number,
      indexNumber: dbUser.index_number,
      avatar_url: dbUser.avatar_url,
      avatarUrl: dbUser.avatar_url,
    };

    setCookie(AUTH_COOKIE_KEYS.USER_INDEX, dbUser.index_number);
    setCookie(AUTH_COOKIE_KEYS.USER_ROLE, dbUser.role);
    setCookie(AUTH_COOKIE_KEYS.SESSION, normalizedDbUser);

    if (activeToken) {
      setCookie(AUTH_COOKIE_KEYS.SSO_TOKEN, activeToken);
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem('icmu_sso_token', activeToken);
        } catch (_) {}
      }
    }

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('icmu_session', JSON.stringify(normalizedDbUser));
      } catch (_) {}
    }

    return {
      authorized: true,
      operator: normalizedDbUser,
    };
  } catch (err) {
    console.error('[Auth] Verification unexpected exception:', err);
    return {
      authorized: false,
      operator: null,
      reason: 'Authentication failed: ' + (err.message || 'Unknown error'),
    };
  }
}

/**
 * Synchronously returns the currently authenticated admin/operator, if any.
 */
export function getAuthenticatedAdmin() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('icmu_session');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.index_number || parsed.indexNumber || parsed.role)) {
        return parsed;
      }
    }
    const cookieSession = getCookie(AUTH_COOKIE_KEYS.SESSION);
    if (cookieSession && (cookieSession.index_number || cookieSession.indexNumber || cookieSession.role)) {
      return cookieSession;
    }
  } catch (_) {}
  return null;
}

