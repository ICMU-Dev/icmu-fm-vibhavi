import React from 'react';
import { AnimatedBadge } from '../components/motion/animated-badge';
import { NumberTicker } from '../components/motion/number-ticker';

// Note: Loaders (Loader, ThinkingShimmer, TextShimmer) are installing in the background
// Once they install, we can import them here.

export default function ShowcaseLoaders() {
  return (
    <div className="space-y-12 max-w-4xl mx-auto">
      <header>
        <h1 className="text-4xl font-heading font-bold text-primary mb-2">Loaders & Status</h1>
        <p className="text-muted-foreground">Spinners, badges, and progress indicators.</p>
      </header>
      
      <section className="space-y-4">
        <h2 className="text-2xl font-bold border-b border-border pb-2">Status Badges</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <AnimatedBadge status="success">Active Status</AnimatedBadge>
          <AnimatedBadge status="warning">Warning</AnimatedBadge>
          <AnimatedBadge status="danger">Error</AnimatedBadge>
          <AnimatedBadge status="loading">Loading</AnimatedBadge>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold border-b border-border pb-2">Animated Values</h2>
        <div className="flex gap-8 items-center">
          <div className="bg-muted p-4 rounded-xl border border-border text-3xl font-bold font-heading">
            $<NumberTicker value={14250.75} duration={1.5} />
          </div>
          <div className="bg-muted p-4 rounded-xl border border-border text-3xl font-bold font-heading text-primary">
            +<NumberTicker value={245} pad={3} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold border-b border-border pb-2">Spinners & Shimmers</h2>
        <p className="text-sm text-muted-foreground">
          Installing new beUI loaders from the registry... (they will appear here once ready)
        </p>
      </section>
    </div>
  );
}
