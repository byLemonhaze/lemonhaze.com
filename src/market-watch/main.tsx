import React from 'react';
import {createRoot} from 'react-dom/client';
import Dashboard from './Dashboard';
import './market-watch.css';
createRoot(document.getElementById('market-watch-root')!).render(<Dashboard apiBase="/api/market-watch"/>);
