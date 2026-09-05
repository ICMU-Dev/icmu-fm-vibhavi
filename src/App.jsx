import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { PublicView } from './pages/PublicView';
import { useStream } from './context/StreamContext';
import { Loader } from './components/motion/loader';
import { AtmosphereBackground } from './components/layout/AtmosphereBackground';
import { AdminLiveChatWidget } from './components/AdminLiveChatWidget';

const AdminRouteGuard = lazy(() => import('./components/auth/AdminRouteGuard').then(m => ({ default: m.AdminRouteGuard })));
import { NotFoundPage, ForbiddenPage } from './pages/NotFoundPage';

function GlobalLoader({ size = 42 }) {
    return (
        <div className="min-h-dvh w-full font-sans relative overflow-hidden flex flex-col items-center justify-center bg-[#070b08] text-white">
            <AtmosphereBackground variant="subdued" opacity={0.6} blur={true} />
            <div className="relative z-10 flex flex-col items-center space-y-4">
                <Loader variant="spinner" size={size} className="text-primary drop-shadow-[0_0_15px_rgba(0,255,102,0.6)]" />
            </div>
        </div>
    );
}

function App() {
    const { isInitializing } = useStream();

    if (isInitializing) {
        return <GlobalLoader size={48} />;
    }

    return (
        <>
            <Suspense fallback={<GlobalLoader size={36} />}>
                <Routes>
                  <Route path="/" element={<PublicView />}/>
                  <Route path="/admin" element={<AdminRouteGuard />}/>
                  <Route path="/403" element={<ForbiddenPage />}/>
                  <Route path="/404" element={<NotFoundPage />}/>
                  <Route path="/:indexNumber" element={<AdminRouteGuard />}/>
                  <Route path="*" element={<NotFoundPage />}/>
                </Routes>
            </Suspense>
            <AdminLiveChatWidget />
        </>
    );
}
export default App;
