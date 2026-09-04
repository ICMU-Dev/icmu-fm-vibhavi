import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { PublicView } from './pages/PublicView';
import { useStream } from './context/StreamContext';
import { Loader } from './components/motion/loader';
import { AdminLiveChatWidget } from './components/AdminLiveChatWidget';

const AdminRouteGuard = lazy(() => import('./components/auth/AdminRouteGuard').then(m => ({ default: m.AdminRouteGuard })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

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
            <Suspense fallback={
                <div className="flex flex-col items-center justify-center min-h-dvh bg-background">
                    <Loader variant="spinner" size={36} className="text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                </div>
            }>
                <Routes>
                  <Route path="/" element={<PublicView />}/>
                  <Route path="/admin" element={<AdminRouteGuard />}/>
                  <Route path="/:indexNumber" element={<AdminRouteGuard />}/>
                  <Route path="*" element={<NotFoundPage />}/>
                </Routes>
            </Suspense>
            <AdminLiveChatWidget />
        </>
    );
}
export default App;
