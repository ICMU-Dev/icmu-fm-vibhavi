import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useAudioVolume } from '../context/AudioContext';
import { Volume2, VolumeX, Volume1 } from 'lucide-react';
import { cn } from '../lib/utils';

// SVG Gauge Arc Math:
// Radius = 25, Circumference = 2 * PI * 25 ~= 157.08
// 270deg arc = 75% of circumference = 117.81
const ARC_LENGTH = 117.81;
const CIRCUMFERENCE = 157.08;

export function VolumeKnob({ className }) {
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

    // Upward drag or rightward drag increases volume; downward/leftward decreases
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
    <div className={cn("flex flex-col items-center select-none touch-none", className)}>
      <div className="flex items-center justify-center gap-3.5 sm:gap-4 bg-card/40 border border-white/5 sm:border-border/30 backdrop-blur-md px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full shadow-(--shadow-ultimate)">
        
        {/* Mute / Unmute Button */}
        <button
          type="button"
          onClick={toggleMute}
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 focus:outline-none active:scale-90",
            isMuted || effectiveVolume === 0
              ? "bg-destructive/15 text-destructive border border-destructive/30 hover:bg-destructive/25"
              : "text-muted-foreground hover:text-foreground hover:bg-white/5 active:bg-white/10"
          )}
          title={isMuted ? "Unmute Audio" : "Mute Audio"}
          aria-label={isMuted ? "Unmute Audio" : "Mute Audio"}
        >
          {isMuted || effectiveVolume === 0 ? (
            <VolumeX className="w-4 h-4 transition-transform" />
          ) : effectiveVolume < 0.5 ? (
            <Volume1 className="w-4 h-4 transition-transform" />
          ) : (
            <Volume2 className="w-4 h-4 transition-transform" />
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
            "relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center cursor-grab active:cursor-grabbing focus:outline-none group",
            isDragging && "cursor-grabbing"
          )}
        >
          {/* Circular Gauge SVG */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 64 64">
            {/* Background 270deg Arc Track */}
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

            {/* Active Filled Arc Track */}
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

          {/* Outer Scale Container (isolates scale animation from rotation) */}
          <div
            className={cn(
              "w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-transform duration-150 ease-out",
              isDragging ? "scale-105" : "group-hover:scale-102"
            )}
          >
            {/* Rotary Knob Face (pure rotation with zero-latency drag) */}
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
              {/* Knob metallic concentric ring texture */}
              <div className="absolute inset-1 rounded-full border border-white/5 bg-linear-to-tr from-black/40 via-transparent to-white/10 pointer-events-none" />

              {/* Indicator Notch */}
              <div
                className={cn(
                  "absolute top-1 w-1 h-2 rounded-full transition-colors duration-150",
                  isMuted || effectiveVolume === 0
                    ? "bg-muted-foreground/40"
                    : "bg-primary shadow-[0_0_6px_rgba(var(--primary),0.9)]"
                )}
              />

              {/* Center Cap Dot */}
              <div className="w-1.5 h-1.5 rounded-full bg-foreground/20 border border-black/50" />
            </div>
          </div>
        </div>

        {/* Volume Percentage Readout Pill */}
        <button
          type="button"
          onClick={() => setVolume(effectiveVolume >= 0.99 ? 0.75 : 1)}
          className={cn(
            "min-w-13 sm:min-w-14 px-2 py-1 rounded-full font-mono text-[10px] sm:text-[11px] font-bold tracking-wider text-center border transition-all duration-150 active:scale-95",
            isMuted || effectiveVolume === 0
              ? "bg-destructive/10 text-destructive border-destructive/25"
              : "bg-background/60 text-muted-foreground hover:text-foreground border-border/30 hover:border-primary/40"
          )}
          title="Click to toggle max volume"
        >
          {isMuted ? 'MUTE' : `${Math.round(effectiveVolume * 100)}%`}
        </button>
      </div>

      {/* Tactile Hi-Fi Micro Label */}
      <span className="text-[8px] font-bold tracking-[0.2em] text-muted-foreground/50 uppercase mt-1">
        Volume
      </span>
    </div>
  );
}

export default VolumeKnob;

