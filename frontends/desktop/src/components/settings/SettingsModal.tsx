import { useEffect } from 'react';
import { Modal } from '@douyinfe/semi-ui';
import { useSettingsStore } from '../../stores/settings';
import './settings.css';
import { AppearanceSection } from './AppearanceSection';
import { FontSizeSection } from './FontSizeSection';
import { LanguageSection } from './LanguageSection';
import { ModelSection } from './ModelSection';
import { FeatureSection } from './FeatureSection';

export function SettingsModal() {
  const { visible, open, close, loadFromBridge } = useSettingsStore();

  useEffect(() => {
    const handler = () => {
      loadFromBridge();
      open();
    };
    const closeHandler = () => close();
    window.addEventListener('ga:open-settings', handler);
    window.addEventListener('ga:close-settings', closeHandler);
    return () => {
      window.removeEventListener('ga:open-settings', handler);
      window.removeEventListener('ga:close-settings', closeHandler);
    };
  }, [open, close, loadFromBridge]);

  return (
    <Modal
      visible={visible}
      onCancel={close}
      title="设置"
      footer={null}
      width={520}
      closeOnEsc
      className="ga-settings-dialog"
    >
      <AppearanceSection />
      <FontSizeSection />
      <LanguageSection />
      <ModelSection />
      <FeatureSection />
    </Modal>
  );
}
