import './style.css';
import { setupPresentation } from './ui/presentation.js';
import { startApp } from './app/runtime.js';

setupPresentation();
startApp().catch((error) => {
    console.error('App startup failed', error);
});
