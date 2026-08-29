import React from 'react';
import { cn } from '../lib/utils';

export function Logo({ variant = 'transparent', className, whiteMask = true }) {
    let src = '/apple-touch-icon.png';
    if (variant === 'filled-small') {
        src = '/web-app-manifest-192x192.png';
    } else if (variant === 'filled-large') {
        src = '/web-app-manifest-512x512.png';
    }

    return (
        <img 
            src={src} 
            alt="FM Vibhavi" 
            draggable={false}
            fetchpriority="high"
            className={cn(
                "object-contain", 
                (whiteMask && variant === 'transparent') ? "brightness-0 invert" : "",
                className
            )} 
        />
    );
}
