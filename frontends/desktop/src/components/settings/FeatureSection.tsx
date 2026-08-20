import { useEffect, useState } from 'react';
import { Button, Modal, Toast } from '@douyinfe/semi-ui';
import * as bridge from '../../services/bridge';
import { useI18n } from '../../i18n';
import { isTauri } from '../../utils/tauri';

export function FeatureSection() {
  const { t } = useI18n();
  const [gaSource, setGaSource] = useState('');
  const [tauriAvailable, setTauriAvailable] = useState(false);

  useEffect(() => {
    const available = isTauri();
    setTauriAvailable(available);
    if (available) {
      bridge
        .tauriInvoke('get_ga_source', {})
        .then((value) => setGaSource(String(value || '')))
        .catch(() => {});
    }
  }, []);

  const pickDirectory = async (title: string): Promise<string | null> => {
    return (await bridge.tauriInvoke('pick_directory', { title })) as string | null;
  };

  const handleImportMemory = async () => {
    try {
      const sourceDir = await pickDirectory(t('sys.memoryPickTitle'));
      if (!sourceDir) return;

      const result = await bridge.importMemory(sourceDir);
      if (result.ok === false) {
        throw new Error(String(result.error || 'import failed'));
      }

      const details = t('sys.memoryImportedDetail', {
        memory: Number(result.memoryCopied || 0),
        responses: Number(result.responsesCopied || 0),
        sessions: Number(result.sessionsAdded || 0),
      });
      Toast.success({ content: details });
    } catch (error) {
      Toast.error({ content: `${t('err.memoryImport')}: ${String(error)}` });
    }
  };

  const handleConnectSource = async () => {
    try {
      const sourceDir = await pickDirectory(t('sys.gaSourcePickTitle'));
      if (!sourceDir) return;

      const result = await bridge.tauriInvoke('set_ga_source', { dir: sourceDir });
      setGaSource(String(result || sourceDir));
      Toast.success({ content: t('sys.gaSourceSet') });
    } catch (error) {
      Toast.error({ content: `${t('err.gaSourceSet')}: ${String(error)}` });
    }
  };

  const handleClearSource = () => {
    Modal.confirm({
      title: t('confirm.gaSourceClearTitle'),
      content: t('confirm.gaSourceClear'),
      onOk: async () => {
        try {
          await bridge.tauriInvoke('clear_ga_source', {});
          setGaSource('');
          Toast.success({ content: t('sys.gaSourceCleared') });
        } catch (error) {
          Toast.error({ content: `${t('err.gaSourceSet')}: ${String(error)}` });
        }
      },
    });
  };

  const handleMoveRuntime = async () => {
    try {
      const targetParent = await pickDirectory(t('sys.gaRuntimeMoveTitle'));
      if (!targetParent) return;

      const confirmed = await new Promise<boolean>((resolve) => {
        let settled = false;
        const settle = (value: boolean) => {
          if (settled) return;
          settled = true;
          resolve(value);
        };
        Modal.confirm({
          title: t('confirm.gaRuntimeMoveTitle'),
          content: t('confirm.gaRuntimeMove'),
          onOk: () => settle(true),
          onCancel: () => settle(false),
        });
      });
      if (!confirmed) return;

      const result = await bridge.tauriInvoke('move_ga_runtime', { targetParent });
      setGaSource(String(result || ''));
      Toast.success({ content: t('sys.gaRuntimeMoved') });
    } catch (error) {
      Toast.error({ content: `${t('err.gaRuntimeMove')}: ${String(error)}` });
    }
  };

  const handleImportMykey = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.py,text/plain';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        await bridge.saveMykeyContent(await file.text());
        Toast.success({ content: t('sys.mykeyImported') });
      } catch {
        Toast.error({ content: t('err.mykeyImport') });
      }
    };
    input.click();
  };

  const handleExportMykey = async () => {
    try {
      const content = await bridge.getMykeyContent();
      const path = await bridge.tauriInvoke('export_mykey', { content });
      if (path) {
        Toast.success({ content: t('sys.mykeyExported') });
      }
    } catch {
      Toast.error({ content: t('err.mykeyExport') });
    }
  };

  const handleOpenServices = () => {
    window.dispatchEvent(new CustomEvent('ga:go-page', { detail: { page: 'services' } }));
    window.dispatchEvent(new Event('ga:close-settings'));
  };

  return (
    <div className="ga-set-block">
      <div className="ga-set-sec-t">{t('set.features')}</div>
      <div className="ga-feature-buttons">
        <Button type="tertiary" onClick={handleImportMykey}>
          {t('set.importMykey')}
        </Button>
        <Button type="tertiary" onClick={handleExportMykey}>
          {t('set.exportMykey')}
        </Button>
        <Button type="tertiary" onClick={handleImportMemory} disabled={!tauriAvailable}>
          {t('set.importMemory')}
        </Button>
        <Button type="tertiary" onClick={handleConnectSource} disabled={!tauriAvailable}>
          {t('set.gaSource')}
        </Button>
        {gaSource && (
          <Button type="tertiary" onClick={handleClearSource}>
            {t('set.gaSourceClear')}
          </Button>
        )}
        <Button type="tertiary" onClick={handleMoveRuntime} disabled={!tauriAvailable}>
          {t('set.moveGaRuntime')}
        </Button>
        <Button type="tertiary" onClick={handleOpenServices}>
          {t('set.serviceManager')}
        </Button>
      </div>
      {gaSource && (
        <div className="ga-form-locked-hint">
          {t('set.gaSourceCurrent')}: {gaSource}
        </div>
      )}
    </div>
  );
}
