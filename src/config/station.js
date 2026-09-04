/**
 * Station Configuration & Public Domain Resolution
 *
 * Automatically resolves the public player URL:
 * - Localhost / dev environment: dynamically returns active window.location.origin (e.g. http://localhost:5173)
 * - Production: uses VITE_PUBLIC_URL from env (default: https://vibhavi-tommy.netlify.app)
 *   which can easily be switched to https://vibhavi.isipathanamedia.online in the future.
 */

export const STATION_CONFIG = {
  stationName: 'FM Vibhavi',
  frequency: '102.5',
  defaultProductionUrl: 'https://vibhavi-tommy.netlify.app',
  futureProductionDomain: 'https://vibhavi.isipathanamedia.online'
};

/**
 * Checks if the current host is a local development environment.
 */
export function isLocalhost(hostname = typeof window !== 'undefined' ? window.location.hostname : '') {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname.endsWith('.local')
  );
}

/**
 * Returns the public player URL depending on the environment.
 */
export function getPublicStationUrl() {
  if (typeof window === 'undefined') {
    return import.meta.env.VITE_PUBLIC_URL || STATION_CONFIG.defaultProductionUrl;
  }

  // Dynamic origin for local development
  if (isLocalhost(window.location.hostname)) {
    return window.location.origin;
  }

  // Configured production URL (Netlify or future custom domain)
  return (
    import.meta.env.VITE_PUBLIC_URL ||
    STATION_CONFIG.defaultProductionUrl ||
    window.location.origin
  );
}
