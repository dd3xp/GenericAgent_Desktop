import '@semi-css';
import './global.css';

if (document.documentElement.dataset.appearance === 'dark') {
  document.body.setAttribute('theme-mode', 'dark');
}

setTimeout(() => {
  document.body.classList.remove('no-transition');
}, 0);

import { createRoot } from 'react-dom/client';
import { App } from './App';

const appRoot = document.getElementById('app')!;
createRoot(appRoot).render(<App />);
