import React, { useState, useEffect, useRef, useMemo } from 'react';

// Universal fallback image
export const DEFAULT_FALLBACK = '/assets/campus_bg.jpg';

// Canonical WebP backgrounds compressed for ultra-fast load and zero quality loss
export const ATMOSPHERE_IMAGES = {
  '12am': '/assets/bgs/campus_12am.webp', // Midnight (stars, moonlit campus)
  '3am': '/assets/bgs/campus_3am.webp',   // Late night twilight (3 AM & 9 PM)
  '6am': '/assets/bgs/campus_6am.webp',   // Dawn / Sunrise (6 AM & 6 PM)
  '9am': '/assets/bgs/campus_9am.webp',   // Morning golden sun
  '12pm': '/assets/bgs/campus_12pm.webp', // Bright midday daylight
  '3pm': '/assets/bgs/campus_3pm.webp',   // Warm afternoon
  '6pm': '/assets/bgs/campus_6am.webp',   // Sunset / Dusk (reuses 6 AM/PM artwork)
  '9pm': '/assets/bgs/campus_3am.webp',   // Evening night (reuses 3 AM/9 PM artwork)
};

/**
 * Calculates the current time phase based on hour and minute.
 * 24-hour continuous timeline with seamless transitions.
 */
export function getTimePhase(date = new Date(), overrideSlug = null) {
  if (overrideSlug && ATMOSPHERE_IMAGES[overrideSlug.toLowerCase()]) {
    const slug = overrideSlug.toLowerCase();
    return {
      slug,
      image: ATMOSPHERE_IMAGES[slug],
      label: `Forced (${slug.toUpperCase()})`
    };
  }

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  // 05:00 - 07:29 -> Dawn (6 AM)
  if (timeInMinutes >= 5 * 60 && timeInMinutes < 7 * 60 + 30) {
    return { slug: '6am', label: 'Dawn / Sunrise', image: ATMOSPHERE_IMAGES['6am'] };
  }
  // 07:30 - 11:29 -> Morning (9 AM)
  if (timeInMinutes >= 7 * 60 + 30 && timeInMinutes < 11 * 60 + 30) {
    return { slug: '9am', label: 'Morning Sun', image: ATMOSPHERE_IMAGES['9am'] };
  }
  // 11:30 - 14:29 -> Midday / High Noon (12 PM)
  if (timeInMinutes >= 11 * 60 + 30 && timeInMinutes < 14 * 60 + 30) {
    return { slug: '12pm', label: 'Midday Noon', image: ATMOSPHERE_IMAGES['12pm'] };
  }
  // 14:30 - 17:29 -> Afternoon (3 PM)
  if (timeInMinutes >= 14 * 60 + 30 && timeInMinutes < 17 * 60 + 30) {
    return { slug: '3pm', label: 'Warm Afternoon', image: ATMOSPHERE_IMAGES['3pm'] };
  }
  // 17:30 - 19:29 -> Sunset / Dusk (6 PM)
  if (timeInMinutes >= 17 * 60 + 30 && timeInMinutes < 19 * 60 + 30) {
    return { slug: '6pm', label: 'Sunset Twilight', image: ATMOSPHERE_IMAGES['6pm'] };
  }
  // 19:30 - 22:59 -> Evening Night (9 PM)
  if (timeInMinutes >= 19 * 60 + 30 && timeInMinutes < 23 * 60) {
    return { slug: '9pm', label: 'Evening Starlight', image: ATMOSPHERE_IMAGES['9pm'] };
  }
  // 23:00 - 01:29 -> Midnight (12 AM)
  if (timeInMinutes >= 23 * 60 || timeInMinutes < 1 * 60 + 30) {
    return { slug: '12am', label: 'Midnight Serenity', image: ATMOSPHERE_IMAGES['12am'] };
  }
  // 01:30 - 04:59 -> Late Night (3 AM)
  return { slug: '3am', label: 'Deep Twilight', image: ATMOSPHERE_IMAGES['3am'] };
}

/**
 * AtmosphereBackground Component
 * 
 * Provides an ultra-smooth, seamless dual-buffer crossfade background
 * that dynamically shifts between campus artwork based on current local time.
 * Falls back safely to DEFAULT_FALLBACK (/assets/campus_bg.jpg) if any asset fails.
 */
export function AtmosphereBackground({
  opacity,
  className = '',
  timeOverride = null,
  showVignette = true,
  variant = 'public', // 'public' | 'admin' | 'subdued'
  blur = null, // boolean | number
}) {
  // Default opacity based on variant: 1 for public, 0.82 for admin/subdued to make bg clearly visible
  const effectiveOpacity = opacity !== undefined 
    ? opacity 
    : (variant === 'public' ? 1 : 0.82);

  // Determine blur: default subtle 2.5px blur for admin/subdued
  const shouldBlur = blur !== null 
    ? Boolean(blur) 
    : (variant === 'admin' || variant === 'subdued');

  // Check URL query param for quick dev/testing override e.g. ?time=6am or ?bg=sunset
  const activeOverride = useMemo(() => {
    if (timeOverride) return timeOverride;
    if (typeof window !== 'undefined' && window.location) {
      const params = new URLSearchParams(window.location.search);
      const qTime = params.get('time') || params.get('bg');
      if (qTime) {
        const lower = qTime.toLowerCase();
        if (lower === 'sunset' || lower === 'dusk') return '6pm';
        if (lower === 'dawn' || lower === 'sunrise') return '6am';
        if (lower === 'noon' || lower === 'midday') return '12pm';
        if (lower === 'midnight') return '12am';
        if (lower === 'morning') return '9am';
        if (lower === 'afternoon') return '3pm';
        if (lower === 'night') return '9pm';
        if (ATMOSPHERE_IMAGES[lower]) return lower;
      }
    }
    return null;
  }, [timeOverride]);

  const initialPhase = useMemo(() => getTimePhase(new Date(), activeOverride), [activeOverride]);
  
  // Dual-layer crossfade buffer
  const [currentImg, setCurrentImg] = useState(initialPhase.image || DEFAULT_FALLBACK);
  const [nextImg, setNextImg] = useState(null);
  const [isCrossFading, setIsCrossFading] = useState(false);
  const crossFadeTimerRef = useRef(null);

  // Preload all 6 background assets once on idle/mount
  useEffect(() => {
    const urls = [DEFAULT_FALLBACK, ...Object.values(ATMOSPHERE_IMAGES)];
    urls.forEach((url) => {
      const preloadImg = new Image();
      preloadImg.src = url;
    });
  }, []);

  // Time ticker: check time every 30 seconds
  useEffect(() => {
    const checkTime = () => {
      const phase = getTimePhase(new Date(), activeOverride);
      const targetImage = phase.image || DEFAULT_FALLBACK;

      if (targetImage !== currentImg && targetImage !== nextImg) {
        // Trigger seamless crossfade
        const imgPreloader = new Image();
        imgPreloader.src = targetImage;

        const applyNext = (resolvedSrc) => {
          setNextImg(resolvedSrc);
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setIsCrossFading(true);
            });
          });

          if (crossFadeTimerRef.current) clearTimeout(crossFadeTimerRef.current);
          crossFadeTimerRef.current = setTimeout(() => {
            setCurrentImg(resolvedSrc);
            setNextImg(null);
            setIsCrossFading(false);
          }, 3200);
        };

        imgPreloader.onload = () => applyNext(targetImage);
        imgPreloader.onerror = () => {
          console.warn(`[Atmosphere] Failed to load ${targetImage}, falling back to ${DEFAULT_FALLBACK}`);
          applyNext(DEFAULT_FALLBACK);
        };
      }
    };

    checkTime();
    const interval = setInterval(checkTime, 30000);
    return () => {
      clearInterval(interval);
      if (crossFadeTimerRef.current) clearTimeout(crossFadeTimerRef.current);
    };
  }, [currentImg, nextImg, activeOverride]);

  const blurStyle = shouldBlur
    ? { filter: 'blur(2.5px)', transform: 'scale(1.05)' }
    : {};

  return (
    <div className={`fixed inset-0 pointer-events-none overflow-hidden select-none z-0 ${className}`}>
      {/* Primary Active Background Layer */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-[opacity,transform] duration-1000 ease-in-out will-change-transform"
        style={{
          backgroundImage: `url('${currentImg}'), url('${DEFAULT_FALLBACK}')`,
          opacity: effectiveOpacity,
          ...blurStyle,
        }}
      />

      {/* Cross-fade Morph Layer (fades in smoothly over 3 seconds) */}
      {nextImg && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-[3000ms] ease-in-out will-change-[opacity]"
          style={{
            backgroundImage: `url('${nextImg}'), url('${DEFAULT_FALLBACK}')`,
            opacity: isCrossFading ? effectiveOpacity : 0,
            ...blurStyle,
          }}
        />
      )}

      {/* Atmospheric Vignette & Gradient Overlays based on variant */}
      {showVignette && variant === 'public' && (
        <>
          {/* Desktop: Smooth radial vignette & subtle bottom contrast lift */}
          <div className="hidden lg:block absolute inset-0 bg-radial-[circle_at_center,_transparent_35%,_rgba(0,0,0,0.55)_100%]" />
          <div className="hidden lg:block absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/40" />
          {/* Mobile: Seamless fade into dark base container */}
          <div className="lg:hidden absolute inset-0 bg-gradient-to-b from-black/25 via-black/80 to-[#070b08]" />
        </>
      )}

      {showVignette && (variant === 'admin' || variant === 'subdued') && (
        <>
          {/* Soft, cinematic vignette that preserves vibrant green foliage and architecture */}
          <div className="absolute inset-0 bg-radial-[circle_at_center,_transparent_35%,_rgba(0,0,0,0.5)_100%]" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/35 to-black/80" />
        </>
      )}
    </div>
  );
}
