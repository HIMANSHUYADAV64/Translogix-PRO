import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initGoogleAuth } from './services/googleAuth';

// Initialize Capacitor Google Auth plugin
initGoogleAuth();

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
