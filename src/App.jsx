import React, { useState } from 'react';
import { Home as HomeIcon, Palette, Type, Component, Table, Layers, ChevronRight } from 'lucide-react';
import { 
  AnimatedSidebarProvider, 
  AnimatedSidebar, 
  AnimatedSidebarHeader, 
  AnimatedSidebarContent,
  AnimatedSidebarGroup,
  AnimatedSidebarGroupContent,
  AnimatedSidebarGroupLabel,
  AnimatedSidebarMenu, 
  AnimatedSidebarMenuItem, 
  AnimatedSidebarMenuButton, 
  AnimatedSidebarTrigger,
  AnimatedSidebarInset,
  AnimatedSidebarFooter,
  AnimatedSidebarSeparator
} from './components/motion/animated-sidebar';

import Home from './pages/Home';
import Showcase from './pages/Showcase';
import ShowcaseData from './pages/ShowcaseData';
import ShowcaseOverlays from './pages/ShowcaseOverlays';
import ShowcaseColors from './pages/ShowcaseColors';
import ShowcaseTypography from './pages/ShowcaseTypography';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'colors': return <ShowcaseColors />;
      case 'typography': return <ShowcaseTypography />;
      case 'basics': return <Showcase />;
      case 'data': return <ShowcaseData />;
      case 'overlays': return <ShowcaseOverlays />;
      case 'home':
      default: return <Home onNavigate={setCurrentPage} />;
    }
  };

  return (
    <AnimatedSidebarProvider>
      <AnimatedSidebar collapsible="icon">
        <AnimatedSidebarHeader>
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-[0_0_15px_rgba(53,182,14,0.3)]">
              V
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-bold text-foreground">Vibhavi UI</span>
              <span className="truncate text-xs text-muted-foreground">Component Library</span>
            </div>
          </div>
        </AnimatedSidebarHeader>

        <AnimatedSidebarContent>
          <AnimatedSidebarGroup>
            <AnimatedSidebarGroupContent>
              <AnimatedSidebarMenu>
                <AnimatedSidebarMenuItem>
                  <AnimatedSidebarMenuButton 
                    isActive={currentPage === 'home'} 
                    onSelect={() => setCurrentPage('home')}
                    icon={<HomeIcon className="w-4 h-4" />}
                  >
                    Home
                  </AnimatedSidebarMenuButton>
                </AnimatedSidebarMenuItem>
              </AnimatedSidebarMenu>
            </AnimatedSidebarGroupContent>
          </AnimatedSidebarGroup>

          <AnimatedSidebarSeparator />

          <AnimatedSidebarGroup>
            <AnimatedSidebarGroupLabel>Foundations</AnimatedSidebarGroupLabel>
            <AnimatedSidebarGroupContent>
              <AnimatedSidebarMenu>
                <AnimatedSidebarMenuItem>
                  <AnimatedSidebarMenuButton 
                    isActive={currentPage === 'colors'} 
                    onSelect={() => setCurrentPage('colors')}
                    icon={<Palette className="w-4 h-4" />}
                  >
                    Colors & Theme
                  </AnimatedSidebarMenuButton>
                </AnimatedSidebarMenuItem>
                <AnimatedSidebarMenuItem>
                  <AnimatedSidebarMenuButton 
                    isActive={currentPage === 'typography'} 
                    onSelect={() => setCurrentPage('typography')}
                    icon={<Type className="w-4 h-4" />}
                  >
                    Typography
                  </AnimatedSidebarMenuButton>
                </AnimatedSidebarMenuItem>
              </AnimatedSidebarMenu>
            </AnimatedSidebarGroupContent>
          </AnimatedSidebarGroup>

          <AnimatedSidebarSeparator />

          <AnimatedSidebarGroup>
            <AnimatedSidebarGroupLabel>Components</AnimatedSidebarGroupLabel>
            <AnimatedSidebarGroupContent>
              <AnimatedSidebarMenu>
                <AnimatedSidebarMenuItem>
                  <AnimatedSidebarMenuButton 
                    isActive={currentPage === 'basics'} 
                    onSelect={() => setCurrentPage('basics')}
                    icon={<Component className="w-4 h-4" />}
                  >
                    Basics & Inputs
                  </AnimatedSidebarMenuButton>
                </AnimatedSidebarMenuItem>
                <AnimatedSidebarMenuItem>
                  <AnimatedSidebarMenuButton 
                    isActive={currentPage === 'data'} 
                    onSelect={() => setCurrentPage('data')}
                    icon={<Table className="w-4 h-4" />}
                  >
                    Data & Tables
                  </AnimatedSidebarMenuButton>
                </AnimatedSidebarMenuItem>
                <AnimatedSidebarMenuItem>
                  <AnimatedSidebarMenuButton 
                    isActive={currentPage === 'overlays'} 
                    onSelect={() => setCurrentPage('overlays')}
                    icon={<Layers className="w-4 h-4" />}
                  >
                    Overlays
                  </AnimatedSidebarMenuButton>
                </AnimatedSidebarMenuItem>
              </AnimatedSidebarMenu>
            </AnimatedSidebarGroupContent>
          </AnimatedSidebarGroup>
        </AnimatedSidebarContent>

        <AnimatedSidebarFooter className="gap-3 border-none p-3">
          <button
            type="button"
            className="flex min-h-11 w-full items-center gap-3 overflow-hidden rounded-xl p-1 text-left outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-200 text-xs font-bold text-primary-800">
              ME
            </span>
            <span className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
              <span className="block truncate text-sm font-medium text-foreground">
                Developer
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                dev@vibhavi.local
              </span>
            </span>
            <ChevronRight
              aria-hidden="true"
              className="size-4 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden"
            />
          </button>
        </AnimatedSidebarFooter>
      </AnimatedSidebar>

      <AnimatedSidebarInset className="relative flex min-h-svh flex-1 flex-col bg-background">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
          <AnimatedSidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground transition-colors" />
          <div className="w-full flex justify-between items-center">
            <span className="font-semibold text-sm capitalize text-muted-foreground">{currentPage.replace('-', ' ')}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-12 relative">
          {renderPage()}
        </main>
      </AnimatedSidebarInset>
    </AnimatedSidebarProvider>
  );
}
