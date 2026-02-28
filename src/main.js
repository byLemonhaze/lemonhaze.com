import './style.css';
import { startApp } from './app/runtime.js';

startApp().catch((error) => {
    console.error('App startup failed', error);
});
