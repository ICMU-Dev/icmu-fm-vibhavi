import React from 'react';
import { Button } from './components/motion/button/base.jsx';
import { ChevronRight } from 'lucide-react';
import { Magnetic } from './components/motion/magnetic.jsx';

export default function App() {
  return (
    <main className="flex min-h-svh w-full flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
      
      {/* Decorative ambient background */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,rgba(53,182,14,0.15)_0%,rgba(0,0,0,0)_70%)] pointer-events-none" />

      <div className="z-10 flex flex-col items-center space-y-8 max-w-3xl text-center">
        
        <div className="space-y-4">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-heading font-bold text-primary tracking-tighter drop-shadow-sm">
            Get started FM Vibhavi here
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground font-medium max-w-xl mx-auto">
            Implement Admin Panel and Implement Public Page
          </p>
        </div>

        <Magnetic strength={0.2}>
          <Button 
            variant="primary" 
            size="lg" 
            className="rounded-full px-10 py-6 text-lg shadow-ultimate"
          >
            Enter Workspace
            <ChevronRight className="ml-2 w-5 h-5" />
          </Button>
        </Magnetic>
      </div>
    </main>
  );
}
