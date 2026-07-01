import '../static/styles.css';
import '../static/app.js';

// CSS 已同步加载，恢复 transition
setTimeout(() => {
  document.body.classList.remove('no-transition');
}, 0);

import { createRoot } from 'react-dom/client';
import { SettingsModal } from './components/settings/SettingsModal';

const settingsRoot = document.createElement('div');
settingsRoot.id = 'settings-react-root';
document.body.appendChild(settingsRoot);
createRoot(settingsRoot).render(<SettingsModal />);
