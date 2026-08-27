import React from 'react';

export default function Home({ onNavigate }) {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-6xl font-heading font-bold text-primary mb-6 text-center">Vibhavi</h1>
      <p className="text-muted-foreground text-lg mb-10 max-w-lg text-center leading-relaxed">
        A custom motion boilerplate equipped with Shadcn tokens, a custom OKLCH palette, and premium beUI interactive components.
      </p>
      <button 
        onClick={() => onNavigate('basics')}
        className="px-8 py-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all font-bold text-md shadow-lg shadow-primary/20 hover:scale-105 active:scale-95"
      >
        Explore Components
      </button>
    </div>
  );
}
