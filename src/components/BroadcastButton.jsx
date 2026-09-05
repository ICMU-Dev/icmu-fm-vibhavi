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

    const radius = 86;
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
        <div className={`relative flex flex-col items-center justify-center space-y-3 ${disabled ? 'opacity-50 grayscale' : ''}`}>
            <div 
                className="relative flex items-center justify-center select-none touch-none rounded-full cursor-pointer group"
                onContextMenu={(e) => e.preventDefault()} 
                onPointerDown={handlePointerDown} 
                onPointerUp={handlePointerUpOrLeave} 
                onPointerLeave={handlePointerUpOrLeave}
                onPointerCancel={handlePointerUpOrLeave}
                style={{ WebkitTapHighlightColor: 'transparent' }}
            >
                {/* SVG Concentric Rings & Hold Progress */}
                <svg width="200" height="200" className="transform -rotate-90 pointer-events-none drop-shadow-2xl">
                    {/* Outer ambient guide ring */}
                    <circle 
                        cx="100" cy="100" r={radius + 4} 
                        stroke="currentColor" strokeWidth="1.5" fill="transparent" 
                        className={isBroadcasting ? "text-red-500/20" : "text-primary/20"}
                    />

                    {/* Progress Fill Ring */}
                    <circle 
                        cx="100" cy="100" r={radius} 
                        stroke="currentColor" strokeWidth="5" fill="transparent" 
                        strokeDasharray={circumference} 
                        strokeDashoffset={strokeDashoffset} 
                        strokeLinecap="round"
                        className={`transition-[stroke-dashoffset] ${isHolding ? 'duration-3000 ease-linear' : 'duration-500 ease-out'} ${
                            isBroadcasting 
                                ? 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.75)]' 
                                : 'text-primary drop-shadow-[0_0_10px_rgba(0,255,102,0.75)]'
                        }`}
                    />

                    {/* Inset Concentric Accent Ring */}
                    <circle 
                        cx="100" cy="100" r={radius - 8} 
                        stroke="currentColor" strokeWidth="1.5" fill="transparent" 
                        className={isBroadcasting ? "text-red-500/40" : "text-primary/30"}
                    />
                </svg>

                {/* Center Sleek Metallic Power Button with Silver Bezel Texture */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <MetallicButton 
                        size="icon"
                        className={`w-36 h-36 rounded-full transition-all duration-300 pointer-events-none ${
                            isBroadcasting 
                                ? 'shadow-[0_0_35px_rgba(239,68,68,0.35)]' 
                                : 'shadow-[0_0_30px_rgba(0,255,102,0.25)]'
                        } ${isHolding ? 'scale-95' : 'group-hover:scale-[1.02]'}`}
                        innerClassName={
                            isBroadcasting
                                ? 'bg-gradient-to-b from-[#1c0808] to-[#0a0303]'
                                : 'bg-gradient-to-b from-[#141416] to-[#0a0a0c]'
                        }
                    >
                        {disabled ? (
                            <Lock className="w-14 h-14 text-white/30" strokeWidth={2.2} />
                        ) : (
                            <Power 
                                className={`w-14 h-14 transition-all duration-500 ${
                                    isBroadcasting
                                        ? 'text-red-500 drop-shadow-[0_0_22px_rgba(239,68,68,0.95)]'
                                        : 'text-primary drop-shadow-[0_0_16px_rgba(0,255,102,0.85)]'
                                } ${isHolding ? 'scale-90 opacity-80' : 'scale-100'}`} 
                                strokeWidth={2.5}
                            />
                        )}
                    </MetallicButton>
                </div>
            </div>

            {/* Status & Hold Indicator */}
            <div className="h-5 text-center flex items-center justify-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${
                    disabled ? 'bg-white/20' : (isBroadcasting ? 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-primary shadow-[0_0_8px_rgba(0,255,102,0.8)]')
                }`} />
                <span className={`text-[11px] uppercase tracking-[0.2em] font-bold ${
                    disabled ? 'text-white/40' : (isBroadcasting ? 'text-red-400' : 'text-white/80')
                }`}>
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
