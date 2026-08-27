import React from 'react';

export default function ShowcaseColors() {
  return (
    <div className="space-y-12 max-w-5xl mx-auto pb-16">
      <header>
        <h1 className="text-4xl font-heading font-bold text-primary mb-2">Color Palette</h1>
        <p className="text-muted-foreground">The custom OKLCH color system and semantic tokens.</p>
      </header>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold border-b border-border pb-2">Semantic Tokens</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ColorSwatch name="Background" bg="bg-background" text="text-foreground" border />
          <ColorSwatch name="Foreground" bg="bg-foreground" text="text-background" />
          <ColorSwatch name="Card" bg="bg-card" text="text-card-foreground" border />
          <ColorSwatch name="Popover" bg="bg-popover" text="text-popover-foreground" border />
          <ColorSwatch name="Primary" bg="bg-primary" text="text-primary-foreground" />
          <ColorSwatch name="Secondary" bg="bg-secondary" text="text-secondary-foreground" />
          <ColorSwatch name="Muted" bg="bg-muted" text="text-muted-foreground" />
          <ColorSwatch name="Accent" bg="bg-accent" text="text-accent-foreground" />
          <ColorSwatch name="Destructive" bg="bg-destructive" text="text-destructive-foreground" />
          <ColorSwatch name="Border" bg="bg-border" text="text-foreground" border />
          <ColorSwatch name="Input" bg="bg-input" text="text-foreground" border />
          <ColorSwatch name="Ring" bg="bg-ring" text="text-primary-foreground" />
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold border-b border-border pb-2">Core Palettes (50-950)</h2>
        
        <div className="space-y-4">
          <h3 className="font-semibold text-lg text-primary">Primary</h3>
          <div className="flex h-16 rounded-xl overflow-hidden shadow-sm">
            {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(weight => (
              <div key={weight} className="flex-1" style={{ backgroundColor: `oklch(var(--primary-${weight}))` }} title={`primary-${weight}`}></div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg text-secondary">Secondary</h3>
          <div className="flex h-16 rounded-xl overflow-hidden shadow-sm">
            {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(weight => (
              <div key={weight} className="flex-1" style={{ backgroundColor: `oklch(var(--secondary-${weight}))` }} title={`secondary-${weight}`}></div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg text-accent">Accent</h3>
          <div className="flex h-16 rounded-xl overflow-hidden shadow-sm">
            {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(weight => (
              <div key={weight} className="flex-1" style={{ backgroundColor: `oklch(var(--accent-${weight}))` }} title={`accent-${weight}`}></div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg text-foreground">Background & Text</h3>
          <div className="flex h-16 rounded-xl overflow-hidden shadow-sm border border-border">
            {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(weight => (
              <div key={weight} className="flex-1" style={{ backgroundColor: `oklch(var(--background-${weight}))` }} title={`background-${weight}`}></div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold border-b border-border pb-2">Gradients</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 rounded-2xl bg-(image:--linearPrimarySecondary) items-end p-4 font-medium text-white shadow-md">Linear Primary-Secondary</div>
          <div className="h-32 rounded-2xl bg-(image:--linearPrimaryAccent) flex items-end p-4 font-medium text-white shadow-md">Linear Primary-Accent</div>
          <div className="h-32 rounded-2xl bg-(image:--linearSecondaryAccent) flex items-end p-4 font-medium text-white shadow-md">Linear Secondary-Accent</div>
          <div className="h-32 rounded-2xl bg-(image:--radialPrimarySecondary) flex items-end p-4 font-medium text-white shadow-md">Radial Primary-Secondary</div>
          <div className="h-32 rounded-2xl bg-(image:--radialPrimaryAccent) flex items-end p-4 font-medium text-white shadow-md">Radial Primary-Accent</div>
          <div className="h-32 rounded-2xl bg-(image:--radialSecondaryAccent) flex items-end p-4 font-medium text-white shadow-md">Radial Secondary-Accent</div>
        </div>
      </section>
    </div>
  );
}

function ColorSwatch({ name, bg, text, border }) {
  return (
    <div className={`flex flex-col items-center justify-center h-24 rounded-xl ${bg} ${text} ${border ? 'border border-border' : ''} shadow-sm transition-transform hover:scale-105 cursor-pointer`}>
      <span className="font-bold text-sm">{name}</span>
      <span className="text-xs opacity-75 font-mono mt-1">{bg.replace('bg-', '')}</span>
    </div>
  );
}
