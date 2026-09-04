import React, { useState, useRef, useEffect } from 'react';
import { useStream } from '../context/StreamContext';
import { Power, Lock } from 'lucide-react';
import { MetallicButton } from './motion/button/metallic';

export function BroadcastButton({ disabled }) {
    const { isBroadcasting, setIsBroadcasting, streamUrl } = useStream();
    const [isHolding, setIsHolding] = useState(false);
    const HOLD_DURATION = 3000;
    const holdTimerRef = useRef(null);
    const isBroadcastingRef = useRef(isBroadcasting);

    useEffect(() => {
        isBroadcastingRef.current = isBroadcasting;
    }, [isBroadcasting]);

    useEffect(() => {
        if (isHolding && !disabled) {
            holdTimerRef.current = setTimeout(() => {
                console.log("3 seconds elapsed! Toggling state to:", !isBroadcastingRef.current);
                setIsBroadcasting(!isBroadcastingRef.current);
                setIsHolding(false);
            }, HOLD_DURATION);
        } else {
            if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
        }
        return () => {
            if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
        };
    }, [isHolding, disabled]);

    const handlePointerDown = () => {
        if (disabled) return;
        if (!streamUrl) return;
        setIsHolding(true);
    };

    const handlePointerUpOrLeave = () => {
        setIsHolding(false);
    };

    const radius = 94;
    const circumference = 2 * Math.PI * radius;
    
    // If not broadcasting (turning ON): Starts at circumference (empty), animates to 0 (full) while holding.
    // If broadcasting (turning OFF): Starts at 0 (full), animates to circumference (empty) while holding.
    let strokeDashoffset;
    if (!isBroadcasting) {
        strokeDashoffset = isHolding ? 0 : circumference;
    } else {
        strokeDashoffset = isHolding ? circumference : 0;
    }

    return (
        <div className={`relative  flex flex-col items-center justify-center space-y-4 ${disabled ? 'opacity-50 grayscale' : ''}`}>
            <div className="relative flex items-center justify-center select-none touch-none rounded-full" onContextMenu={(e) => e.preventDefault()} style={{ WebkitTapHighlightColor: 'transparent' }}>
                <svg width="200" height="200" className="transform  -rotate-90 absolute">
                    {/* Background Ring */}
                    <circle cx="100" cy="100" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" className="text-border opacity-20"/>
                    {/* Progress Ring */}
                    <circle 
                        cx="100" cy="100" r={radius} 
                        stroke="currentColor" strokeWidth="6" fill="transparent" 
                        strokeDasharray={circumference} 
                        strokeDashoffset={strokeDashoffset} 
                        className={`transition-[stroke-dashoffset] ${isHolding ? 'duration-3000  ease-linear' : 'duration-500 ease-out'} ${isBroadcasting ? 'text-destructive' : 'text-primary'}`}
                    />
                </svg>

                <MetallicButton 
                    size="icon" 
                    className={`w-40 h-40 m-5 shadow-[0_15px_35px_rgba(0,0,0,0.5)] z-10 ${disabled ? 'cursor-not-allowed' : ''}`} 
                    onPointerDown={handlePointerDown} 
                    onPointerUp={handlePointerUpOrLeave} 
                    onPointerLeave={handlePointerUpOrLeave}
                    onPointerCancel={handlePointerUpOrLeave}
                >
                    {disabled ? (
                        <Lock className="w-16 h-16 text-muted-foreground/30 scale-100 pointer-events-none" strokeWidth={2.5} />
                    ) : (
                        <Power className={`w-16 h-16 pointer-events-none transition-all duration-500 ${isBroadcasting
                            ? 'text-destructive drop-shadow-[0_0_12px_rgba(var(--destructive),0.8)]'
                            : 'text-muted-foreground/50'} ${isHolding ? 'scale-90 opacity-70' : 'scale-100'}`} strokeWidth={2.5}/>
                    )}
                </MetallicButton>
            </div>
            <div className="h-6 text-center">
                <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                    {disabled 
                        ? 'Stream Link Required' 
                        : (isHolding 
                            ? (isBroadcasting ? 'Disconnecting...' : 'Connecting Live...') 
                            : (isBroadcasting ? 'Hold 3s to Stop' : 'Hold 3s to Go Live'))
                    }
                </span>
            </div>
        </div>
    );
}
