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

    // If route segment is non-numeric (and not 'admin'), treat as 404 page
    if (routeIndexNumber && !/^\d+$/.test(routeIndexNumber) && routeIndexNumber !== 'admin') {
      return {
        notFound: true,
        authorized: false,
        operator: null,
        reason: 'Page not found.',
      };
    }

    // 1. Process SSO token from URL parameter if present
    if (ssoTokenFromUrl) {
      ssoPayload = decodeSsoToken(ssoTokenFromUrl);
      if (ssoPayload?.indexNumber) {
        resolvedIndex = resolvedIndex || ssoPayload.indexNumber;
      }
    }

    // 2. Fetch existing session from cookies/storage
    const cookieIndex = getCookie(AUTH_COOKIE_KEYS.USER_INDEX);
    const cookieSession = getCookie(AUTH_COOKIE_KEYS.SESSION);
    let existingSessionIndex = cookieIndex || cookieSession?.indexNumber || null;

    if (!existingSessionIndex && typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem('icmu_session');
        if (raw) {
          const parsed = JSON.parse(raw);
          existingSessionIndex = parsed.indexNumber || null;
        }
      } catch (_) {}
    }

    // If no route index was provided, try to use existing session index
    if (!resolvedIndex || resolvedIndex === 'admin') {
      resolvedIndex = existingSessionIndex;
    }

    if (!resolvedIndex || resolvedIndex === 'admin') {
      return {
        authorized: false,
        operator: null,
        reason: 'No operator identity provided. Please sign in via the ICMU Portal.',
      };
    }

    // SECURITY GATE: If they requested a specific index via URL, we MUST verify they own it.
    // They must either provide a valid SSO token for it, OR their existing session must match it.
    const hasValidSsoToken = ssoPayload && ssoPayload.indexNumber === resolvedIndex;
    const hasValidExistingSession = existingSessionIndex === resolvedIndex;

    if (!hasValidSsoToken && !hasValidExistingSession) {
      return {
        authorized: false,
        operator: null,
        reason: 'Unverified Access. You must launch the broadcasting studio from your authenticated ICMU Portal.',
      };
    }

    // 3. Fast-path: If valid non-expired SSO token matches resolved index and has clearance
    if (hasValidSsoToken && hasBroadcasterClearance(ssoPayload.role)) {
      setCookie(AUTH_COOKIE_KEYS.USER_INDEX, ssoPayload.indexNumber);
      setCookie(AUTH_COOKIE_KEYS.USER_ROLE, ssoPayload.role);
      setCookie(AUTH_COOKIE_KEYS.SESSION, {
        id: ssoPayload.id,
        name: ssoPayload.name,
        role: ssoPayload.role,
        indexNumber: ssoPayload.indexNumber,
      });

      // Background verify without blocking
      supabase
        .from('users')
        .select('id, full_name, index_number, role, is_active, avatar_url, email')
        .eq('index_number', resolvedIndex)
        .maybeSingle()
        .then(({ data }) => {
          if (data && data.is_active !== false) {
            setCookie(AUTH_COOKIE_KEYS.SESSION, {
              id: data.id,
              name: data.full_name,
              role: data.role,
              indexNumber: data.index_number,
              avatarUrl: data.avatar_url,
            });
          }
        })
        .catch(() => {});

      return {
        authorized: true,
        operator: {
          id: ssoPayload.id,
          full_name: ssoPayload.name,
          index_number: ssoPayload.indexNumber,
          role: ssoPayload.role,
          avatar_url: null,
        },
      };
    }

    // 4. Query the shared Supabase database for the live user record
    const { data: dbUser, error } = await supabase
      .from('users')
      .select('id, full_name, index_number, role, is_active, avatar_url, email')
      .eq('index_number', resolvedIndex)
      .maybeSingle();

    if (error) {
      console.error('[Auth] Supabase verification query failed:', error.message);
      // If network error but we have a valid recent SSO token matching index, fallback gracefully
      if (hasValidSsoToken && hasBroadcasterClearance(ssoPayload.role)) {
        return {
          authorized: true,
          operator: {
            id: ssoPayload.id,
            full_name: ssoPayload.name,
            index_number: ssoPayload.indexNumber,
            role: ssoPayload.role,
            avatar_url: null,
          },
        };
      }
      return {
        authorized: false,
        operator: null,
        reason: 'Database verification failed: ' + error.message,
      };
    }

    if (!dbUser) {
      return {
        notFound: true,
        authorized: false,
        operator: null,
        reason: `Operator identity [${resolvedIndex}] not registered in central database.`,
      };
    }

    // 4. Check if account is suspended
    if (dbUser.is_active === false) {
      return {
        authorized: false,
        operator: null,
        reason: 'Your operator clearance has been suspended by an administrator.',
      };
    }

    // 5. Verify role clearance includes Broadcaster
    const isAuthorized = hasBroadcasterClearance(dbUser.role);
    if (!isAuthorized) {
      return {
        authorized: false,
        operator: null,
        detectedRole: dbUser.role,
        reason: `Clearance level [${getRoleLabel(dbUser.role)}] is restricted. Broadcaster clearance required to operate Master Control.`,
      };
    }

    // 6. Persist verified session in local cookies and storage
    setCookie(AUTH_COOKIE_KEYS.USER_INDEX, dbUser.index_number);
    setCookie(AUTH_COOKIE_KEYS.USER_ROLE, dbUser.role);
    setCookie(AUTH_COOKIE_KEYS.SESSION, {
      id: dbUser.id,
      name: dbUser.full_name,
      role: dbUser.role,
      indexNumber: dbUser.index_number,
      avatarUrl: dbUser.avatar_url,
    });

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('icmu_session', JSON.stringify({
          id: dbUser.id,
          name: dbUser.full_name,
          role: dbUser.role,
          indexNumber: dbUser.index_number,
          avatarUrl: dbUser.avatar_url,
        }));
      } catch (_) {}
    }

    return {
      authorized: true,
      operator: dbUser,
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
