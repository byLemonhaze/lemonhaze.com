import React from 'react';
import { createRoot } from 'react-dom/client';
import TimelineVisualizer from './TimelineVisualizer';
import './chronology-visualizer.css';

createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <TimelineVisualizer />
    </React.StrictMode>,
);
