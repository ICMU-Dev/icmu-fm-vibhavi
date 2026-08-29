import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { StreamProvider } from './context/StreamContext';
import { AudioProvider } from './context/AudioContext';
createRoot(document.getElementById('root')).render(<StrictMode>
    <BrowserRouter>
      <StreamProvider>
        <AudioProvider>
            <App />
        </AudioProvider>
      </StreamProvider>
    </BrowserRouter>
  </StrictMode>);
