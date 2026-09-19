import React from 'react';
import {createRoot} from 'react-dom/client';
import Dashboard from './Dashboard';
import './market-watch.css';
export function mountMarketWatch(element:HTMLElement) {
    const root = createRoot(element);
    root.render(<Dashboard apiBase="/api/market-watch"/>);
    return root;
}
