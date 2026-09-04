import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { PublicView } from './pages/PublicView';
import { AdminRouteGuard } from './components/auth/AdminRouteGuard';
import { NotFoundPage } from './pages/NotFoundPage';
import { useStream } from './context/StreamContext';
import { Loader } from './components/motion/loader';
import { AdminLiveChatWidget } from './components/AdminLiveChatWidget';

function App() {
    const { isInitializing } = useStream();

    if (isInitializing) {
        return (
            <div className="flex flex-col items-center justify-center min-h-dvh bg-background">
                <Loader variant="spinner" size={48} className="text-primary drop-shadow-[0_0_12px_rgba(var(--primary),0.6)]" />
            </div>
        );
    }

    return (
        <>
            <Routes>
              <Route path="/" element={<PublicView />}/>
              <Route path="/admin" element={<AdminRouteGuard />}/>
              <Route path="/:indexNumber" element={<AdminRouteGuard />}/>
              <Route path="*" element={<NotFoundPage />}/>
            </Routes>
            <AdminLiveChatWidget />
        </>
    );
}
export default App;
