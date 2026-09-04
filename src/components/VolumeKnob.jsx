import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useAudioVolume } from '../context/AudioContext';
import { Volume2, VolumeX, Volume1, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

// SVG Gauge Arc Math for Desktop Knob:
// Radius = 25, Circumference = 2 * PI * 25 ~= 157.08
// 270deg arc = 75% of circumference = 117.81
const ARC_LENGTH = 117.81;
const CIRCUMFERENCE = 157.08;

/**
 * MobileVolumeSlider: Samsung One UI style pill volume slider with
 * spring morphing animations, fluid fill bar, and direct touch gestures.
 */
function MobileVolumeSlider() {
  const { volume, setVolume, isMuted, toggleMute } = useAudioVolume();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const sliderTrackRef = useRef(null);
  const containerRef = useRef(null);
  const autoCloseTimerRef = useRef(null);
  const rafIdRef = useRef(null);

  const effectiveVolume = isMuted ? 0 : volume;

  // Auto-collapse after 4 seconds of inactivity
  const resetAutoClose = useCallback(() => {
    if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    autoCloseTimerRef.current = setTimeout(() => {
      setIsExpanded(false);
    }, 4000);
  }, []);

  useEffect(() => {
    if (isExpanded) {
      resetAutoClose();
    } else {
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    }
    return () => {
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [isExpanded, resetAutoClose]);

  // Collapse on tapping outside
  useEffect(() => {
    if (!isExpanded) return;
    const handlePointerDownOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsExpanded(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDownOutside);
    return () => document.removeEventListener('pointerdown', handlePointerDownOutside);
  }, [isExpanded]);

  const updateVolumeFromPointer = (clientX) => {
    const rect = sliderTrackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const rawRatio = (clientX - rect.left) / rect.width;
    const clamped = Math.max(0, Math.min(1, Math.round(rawRatio * 1000) / 1000));
    setVolume(clamped);
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    resetAutoClose();
    isDraggingRef.current = true;
    setIsDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
    updateVolumeFromPointer(e.clientX);
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;
    resetAutoClose();
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = requestAnimationFrame(() => {
      updateVolumeFromPointer(e.clientX);
      rafIdRef.current = null;
    });
  };

  const handlePointerUp = (e) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    resetAutoClose();
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}
  };

  return (
    <div ref={containerRef} className="flex flex-col items-center select-none touch-none w-full px-2">
      <AnimatePresence mode="wait" initial={false}>
        {!isExpanded ? (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 600, damping:40 }}
            className="flex flex-col items-center"
          >
            <motion.button
              layoutId="samsung-volume-capsule"
              type="button"
              onClick={() => setIsExpanded(true)}
              className="h-8 px-3 rounded-full bg-card/50 border border-white/10 backdrop-blur-xl flex items-center gap-2 shadow-(--shadow-ultimate) active:scale-95 transition-all cursor-pointer group"
              aria-label="Open Volume Slider"
            >
              {isMuted || effectiveVolume === 0 ? (
                <VolumeX className="w-3.5 h-3.5 text-destructive" />
              ) : effectiveVolume < 0.5 ? (
                <Volume1 className="w-3.5 h-3.5 text-primary" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-primary" />
              )}
              <span className="font-mono text-[11px] font-bold text-foreground">
                {isMuted ? 'MUTE' : `${Math.round(effectiveVolume * 100)}%`}
              </span>
              {/* Mini level preview pill */}
              <div className="w-6 h-1 rounded-full bg-white/10 overflow-hidden ml-0.5">
                <div
                  className="h-full bg-(image:--linearPrimaryAccent) rounded-full transition-all duration-150"
                  style={{ width: `${Math.max(0, Math.min(100, effectiveVolume * 100))}%` }}
                />
              </div>
            </motion.button>
            <span className="text-[7.5px]  mt-3 sm:mt-0 sm:font-bold tracking-[0.2em] text-muted-foreground/50 uppercase">
              Volume
            </span>
          </motion.div>
        ) : (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 600, damping: 30 }}
            className="w-full flex flex-col items-center"
          >
            <motion.div
              layoutId="samsung-volume-capsule"
              ref={sliderTrackRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="relative h-10 w-full max-w-61.25 rounded-full bg-card/60 border border-white/15 backdrop-blur-2xl shadow-(--shadow-ultimate) overflow-hidden flex items-center justify-between px-1.5 cursor-pointer"
            >
              {/* Samsung Pill Progress Fill with Design System Primary Accent Gradient */}
              <div
                className="absolute inset-y-0 left-0 bg-(image:--linearPrimaryAccent) rounded-full pointer-events-none shadow-[0_0_14px_rgba(var(--primary),0.35)]"
                style={{
                  width: `${Math.max(0, Math.min(100, effectiveVolume * 100))}%`,
                  transition: isDragging ? 'none' : 'width 150ms ease-out',
                  willChange: isDragging ? 'width' : 'auto',
                }}
              />

              {/* Mute Toggle Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  resetAutoClose();
                  toggleMute();
                }}
                className="relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-foreground hover:bg-black/20 active:scale-90 transition-transform"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || effectiveVolume === 0 ? (
                  <VolumeX className="w-3.5 h-3.5 text-destructive" />
                ) : effectiveVolume < 0.5 ? (
                  <Volume1 className="w-3.5 h-3.5 text-foreground" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-foreground" />
                )}
              </button>

              {/* Volume Percentage Readout */}
              <span className="relative z-10 font-mono text-[11px] font-bold tracking-wider text-foreground drop-shadow-md select-none pointer-events-none px-1">
                {isMuted ? 'MUTED' : `${Math.round(effectiveVolume * 100)}%`}
              </span>

              {/* Dismiss / Close Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(false);
                }}
                className="relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-foreground/75 hover:text-foreground hover:bg-black/20 active:scale-90 transition-transform"
                title="Close Volume Control"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
            <span className="text-[7.5px] mt-3 sm:mt-0 font-bold tracking-[0.2em] text-muted-foreground/50 uppercase">
              Slide to adjust
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * DesktopVolumeKnob: Tactile Hi-Fi rotary knob with 270° illuminated SVG gauge arc,
 * zero-latency hardware accelerated drag tracking, and keyboard/wheel support.
 */
function DesktopVolumeKnob() {
  const { volume, setVolume, isMuted, toggleMute } = useAudioVolume();
  const knobRef = useRef(null);
  const isDraggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ y: 0, x: 0, startVolume: 0 });
  const rafIdRef = useRef(null);

  const effectiveVolume = isMuted ? 0 : volume;

  // Knob rotation: -135deg (0%) to +135deg (100%), total 270deg span
  const angle = -135 + effectiveVolume * 270;
  const strokeOffset = ARC_LENGTH * (1 - effectiveVolume);

  // Clean up any pending RAF on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  // Pointer drag handler (instant 1:1 touch & mouse tracking)
  const handlePointerDown = (e) => {
    e.preventDefault();
    isDraggingRef.current = true;
    setIsDragging(true);

    // Check if pointer tapped directly on the circular arc track
    const rect = knobRef.current?.getBoundingClientRect();
    if (rect) {
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const dist = Math.hypot(dx, dy);

      // If clicked on the arc outer area (radius > 18px), snap immediately to that angle
      if (dist > 18) {
        const mathAngle = Math.atan2(dy, dx) * (180 / Math.PI);
        let visualAngle = mathAngle + 90;
        if (visualAngle > 180) visualAngle -= 360;

        if (visualAngle >= -135 && visualAngle <= 135) {
          const tappedVol = (visualAngle + 135) / 270;
          const cleanVol = Math.max(0, Math.min(1, tappedVol));
          setVolume(cleanVol);
          dragStartRef.current = {
            y: e.clientY,
            x: e.clientX,
            startVolume: cleanVol,
          };
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch (_) {}
          return;
        }
      }
    }

    dragStartRef.current = {
      y: e.clientY,
      x: e.clientX,
      startVolume: effectiveVolume,
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;

    const deltaY = dragStartRef.current.y - e.clientY;
    const deltaX = e.clientX - dragStartRef.current.x;

    // Dominant axis tracking: avoids diagonal vector cancellation
    const delta = Math.abs(deltaY) >= Math.abs(deltaX) ? deltaY : deltaX;

    // 150px of movement covers 0% to 100% range
    const sensitivity = 1 / 150;
    const nextVolume = Math.max(0, Math.min(1, dragStartRef.current.startVolume + delta * sensitivity));

    // Batch with requestAnimationFrame for 60/120fps display sync
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }
    rafIdRef.current = requestAnimationFrame(() => {
      setVolume(nextVolume);
      rafIdRef.current = null;
    });
  };

  const handlePointerUp = (e) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);

    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}
  };

  // Mouse wheel adjustment
  const handleWheel = (e) => {
    e.preventDefault();
    const step = 0.03;
    const change = -Math.sign(e.deltaY) * step;
    setVolume(Math.max(0, Math.min(1, volume + change)));
  };

  // Keyboard accessibility
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      e.preventDefault();
      setVolume(Math.min(1, volume + 0.05));
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      e.preventDefault();
      setVolume(Math.max(0, volume - 0.05));
    } else if (e.key === 'PageUp') {
      e.preventDefault();
      setVolume(Math.min(1, volume + 0.1));
    } else if (e.key === 'PageDown') {
      e.preventDefault();
      setVolume(Math.max(0, volume - 0.1));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setVolume(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setVolume(1);
    } else if (e.key === ' ' || e.key.toLowerCase() === 'm') {
      e.preventDefault();
      toggleMute();
    }
  };

  return (
    <div className="flex flex-col items-center select-none touch-none">
      <div className="flex items-center justify-center gap-2.5 bg-card/40 border border-border/30 backdrop-blur-md px-3 py-1 rounded-full shadow-(--shadow-ultimate)">
        {/* Mute / Unmute Button */}
        <button
          type="button"
          onClick={toggleMute}
          className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center transition-all duration-150 focus:outline-none active:scale-90",
            isMuted || effectiveVolume === 0
              ? "bg-destructive/15 text-destructive border border-destructive/30 hover:bg-destructive/25"
              : "text-muted-foreground hover:text-foreground hover:bg-white/5 active:bg-white/10"
          )}
          title={isMuted ? "Unmute Audio" : "Mute Audio"}
          aria-label={isMuted ? "Unmute Audio" : "Mute Audio"}
        >
          {isMuted || effectiveVolume === 0 ? (
            <VolumeX className="w-3.5 h-3.5 transition-transform" />
          ) : effectiveVolume < 0.5 ? (
            <Volume1 className="w-3.5 h-3.5 transition-transform" />
          ) : (
            <Volume2 className="w-3.5 h-3.5 transition-transform" />
          )}
        </button>

        {/* Rotary Knob with SVG Gauge Arc */}
        <div
          ref={knobRef}
          role="slider"
          tabIndex={0}
          aria-valuenow={Math.round(effectiveVolume * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Volume Control Knob"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
          onKeyDown={handleKeyDown}
          className={cn(
            "relative w-11 h-11 flex items-center justify-center cursor-grab active:cursor-grabbing focus:outline-none group",
            isDragging && "cursor-grabbing"
          )}
        >
          {/* Circular Gauge SVG */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r="25"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeDasharray={`${ARC_LENGTH} ${CIRCUMFERENCE}`}
              strokeDashoffset="0"
              strokeLinecap="round"
              className="text-white/10"
              transform="rotate(135 32 32)"
            />

            <circle
              cx="32"
              cy="32"
              r="25"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={`${ARC_LENGTH} ${CIRCUMFERENCE}`}
              strokeDashoffset={strokeOffset}
              strokeLinecap="round"
              style={{
                willChange: isDragging ? 'stroke-dashoffset' : 'auto',
              }}
              className={cn(
                isDragging
                  ? "transition-none"
                  : "transition-[stroke-dashoffset] duration-150 ease-out",
                isMuted || effectiveVolume === 0
                  ? "text-muted-foreground/30"
                  : "text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.75)]"
              )}
              transform="rotate(135 32 32)"
            />
          </svg>

          {/* Outer Scale Container */}
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-150 ease-out",
              isDragging ? "scale-105" : "group-hover:scale-102"
            )}
          >
            {/* Rotary Knob Face */}
            <div
              className={cn(
                "w-full h-full rounded-full bg-linear-to-b from-card via-background to-black/70 border border-white/15 shadow-md flex items-center justify-center relative",
                isDragging
                  ? "transition-none border-primary/60 shadow-[0_0_16px_rgba(var(--primary),0.35)]"
                  : "transition-transform duration-150 ease-out group-hover:border-primary/40 group-focus:ring-2 group-focus:ring-primary/40"
              )}
              style={{
                transform: `rotate(${angle}deg)`,
                willChange: isDragging ? 'transform' : 'auto',
              }}
            >
              <div className="absolute inset-1 rounded-full border border-white/5 bg-linear-to-tr from-black/40 via-transparent to-white/10 pointer-events-none" />

              <div
                className={cn(
                  "absolute top-0.5 w-0.5 h-1.5 rounded-full transition-colors duration-150",
                  isMuted || effectiveVolume === 0
                    ? "bg-muted-foreground/40"
                    : "bg-primary shadow-[0_0_6px_rgba(var(--primary),0.9)]"
                )}
              />

              <div className="w-1 h-1 rounded-full bg-foreground/20 border border-black/50" />
            </div>
          </div>
        </div>

        {/* Volume Percentage Readout Pill */}
        <button
          type="button"
          onClick={() => setVolume(effectiveVolume >= 0.99 ? 0.75 : 1)}
          className={cn(
            "min-w-11 px-1.5 py-0.5 rounded-full font-mono text-[9px] font-bold tracking-wider text-center border transition-all duration-150 active:scale-95",
            isMuted || effectiveVolume === 0
              ? "bg-destructive/10 text-destructive border-destructive/25"
              : "bg-background/60 text-muted-foreground hover:text-foreground border-border/30 hover:border-primary/40"
          )}
          title="Click to toggle max volume"
        >
          {isMuted ? 'MUTE' : `${Math.round(effectiveVolume * 100)}%`}
        </button>
      </div>

      <span className="text-[7px] font-bold tracking-[0.2em] text-muted-foreground/50 uppercase mt-0.5">
        Volume
      </span>
    </div>
  );
}

/**
 * VolumeKnob Component:
 * - On Mobile (< 640px): Samsung One UI style morphing pill volume slider
 * - On PC (>= 640px): Sleek tactile Hi-Fi rotary volume knob
 */
export function VolumeKnob({ className }) {
  return (
    <div className={cn("w-full flex flex-col items-center", className)}>
      {/* Mobile Experience: Samsung One UI Morphing Pill Slider */}
      <div className="block sm:hidden w-full justify-center">
        <MobileVolumeSlider />
      </div>

      {/* PC / Desktop Experience: Rotary Volume Knob */}
      <div className="hidden sm:flex sm:flex-col sm:items-center">
        <DesktopVolumeKnob />
      </div>
    </div>
  );
}

export default VolumeKnob;

