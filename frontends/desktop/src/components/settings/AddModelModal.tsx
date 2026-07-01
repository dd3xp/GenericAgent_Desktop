import { useState, useEffect } from 'react';
import { Modal, Input, RadioGroup, Radio, Toast } from '@douyinfe/semi-ui';
import { useSettingsStore } from '../../stores/settings';
import * as bridge from '../../services/bridge';
import type { ModelProfile } from '../../services/bridge';

interface Props {
  visible: boolean;
  editingId: number | null;
  onClose: () => void;
}

export function AddModelModal({ visible, editingId, onClose }: Props) {
  const setModelProfiles = useSettingsStore((s) => s.setModelProfiles);
  const modelProfiles = useSettingsStore((s) => s.modelProfiles);

  const [form, setForm] = useState({
    model: '',
    apikey: '',
    apibase: '',
    name: '',
    protocol: 'oai' as 'oai' | 'claude',
    stream: true,
  });

  useEffect(() => {
    if (!visible) return;
    if (editingId != null) {
      const profile = modelProfiles.find((p) => p.id === editingId);
      if (profile) {
        setForm({
          model: profile.model || '',
          apikey: '',
          apibase: profile.apibase || '',
          name: profile.name || '',
          protocol: profile.protocol || 'oai',
          stream: profile.stream !== false,
        });
      }
    } else {
      setForm({ model: '', apikey: '', apibase: '', name: '', protocol: 'oai', stream: true });
    }
  }, [visible, editingId, modelProfiles]);

  const handleSubmit = async () => {
    if (!form.model || !form.apibase) {
      Toast.warning({ content: '请填写必填项' });
      return;
    }
    if (!editingId && !form.apikey) {
      Toast.warning({ content: '请填写 API Key' });
      return;
    }

    try {
      const data: Partial<ModelProfile> = {
        model: form.model,
        apibase: form.apibase,
        name: form.name || undefined,
        protocol: form.protocol,
        stream: form.stream,
      };
      if (form.apikey) data.apikey = form.apikey;

      let profiles: ModelProfile[];
      if (editingId != null) {
        profiles = await bridge.editModelProfile(editingId, data);
      } else {
        profiles = await bridge.addModelProfile(data);
      }
      setModelProfiles(profiles);
      Toast.success({ content: editingId ? '已保存' : '已添加' });
      onClose();
    } catch {
      Toast.error({ content: '操作失败' });
    }
  };

  return (
    <Modal
      visible={visible}
      onCancel={onClose}
      title={editingId ? '编辑模型' : '添加模型'}
      onOk={handleSubmit}
      okText="保存"
      cancelText="取消"
      width={480}
      className="ga-add-model-dialog"
    >
      <div className="ga-form">
        <div className="ga-form-field">
          <label className="ga-form-label">模型名称 <span className="ga-form-req">*</span></label>
          <Input
            value={form.model}
            onChange={(val) => setForm(f => ({ ...f, model: val }))}
            placeholder="如 deepseek-chat, claude-sonnet-4-5"
            maxLength={50}
          />
        </div>

        <div className="ga-form-field">
          <label className="ga-form-label">
            API Key {!editingId && <span className="ga-form-req">*</span>}
          </label>
          <Input
            mode="password"
            value={form.apikey}
            onChange={(val) => setForm(f => ({ ...f, apikey: val }))}
            placeholder={editingId ? '留空则不修改' : '输入 API Key'}
            maxLength={200}
          />
        </div>

        <div className="ga-form-field">
          <label className="ga-form-label">API Base URL <span className="ga-form-req">*</span></label>
          <Input
            value={form.apibase}
            onChange={(val) => setForm(f => ({ ...f, apibase: val }))}
            placeholder="如 https://api.deepseek.com/v1"
            maxLength={200}
          />
        </div>

        <div className="ga-form-field">
          <label className="ga-form-label">协议</label>
          <RadioGroup
            value={form.protocol}
            onChange={(e) => setForm(f => ({ ...f, protocol: e.target.value }))}
          >
            <Radio value="oai">OpenAI 兼容</Radio>
            <Radio value="claude">Claude</Radio>
          </RadioGroup>
        </div>

        <div className="ga-form-field">
          <label className="ga-form-label">流式输出</label>
          <RadioGroup
            value={form.stream}
            onChange={(e) => setForm(f => ({ ...f, stream: e.target.value }))}
          >
            <Radio value={true}>开启</Radio>
            <Radio value={false}>关闭</Radio>
          </RadioGroup>
        </div>

        <div className="ga-form-field">
          <label className="ga-form-label">显示名称</label>
          <Input
            value={form.name}
            onChange={(val) => setForm(f => ({ ...f, name: val }))}
            placeholder="可选，用于界面显示"
            maxLength={50}
          />
        </div>
      </div>
    </Modal>
  );
}
