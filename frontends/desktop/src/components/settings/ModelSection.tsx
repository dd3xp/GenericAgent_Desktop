import { useState } from 'react';
import { Button, Tag, Toast } from '@douyinfe/semi-ui';
import { useSettingsStore } from '../../stores/settings';
import * as bridge from '../../services/bridge';
import { AddModelModal } from './AddModelModal';

function profileLabel(name: string | undefined): string {
  if (!name) return '未命名模型';
  const idx = name.indexOf('/');
  return idx >= 0 ? name.slice(idx + 1) : name;
}

export function ModelSection() {
  const modelProfiles = useSettingsStore((s) => s.modelProfiles);
  const selectedModelNo = useSettingsStore((s) => s.selectedModelNo);
  const selectModel = useSettingsStore((s) => s.selectModel);
  const setModelProfiles = useSettingsStore((s) => s.setModelProfiles);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`删除模型 "${name}"？`)) return;
    try {
      const profiles = await bridge.deleteModelProfile(id);
      setModelProfiles(profiles);
      Toast.success({ content: '已删除' });
    } catch {
      Toast.error({ content: '删除失败' });
    }
  };

  const handleEdit = (id: number) => {
    setEditingId(id);
    setAddModalVisible(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setAddModalVisible(true);
  };

  const mixin = modelProfiles.find((p) => p.kind === 'mixin');
  const natives = modelProfiles.filter((p) => p.kind !== 'mixin');

  return (
    <div className="ga-set-block">
      <div className="ga-set-sec-t">模型</div>

      {mixin && (
        <div className="ga-model-mixin">
          <Tag color="blue" size="small">聚合</Tag>
          <span className="ga-model-mixin-name">{profileLabel(mixin.name || mixin.model)}</span>
        </div>
      )}

      <div className="ga-model-list">
        {natives.map((profile) => {
          const actualIdx = modelProfiles.indexOf(profile);
          const isSelected = actualIdx === selectedModelNo;
          return (
            <div
              key={profile.id}
              className={isSelected ? 'ga-model-item ga-model-item--selected' : 'ga-model-item'}
              onClick={() => selectModel(actualIdx)}
            >
              <div className="ga-model-row-content">
                <span className="ga-model-name">{profileLabel(profile.name || profile.model)}</span>
                {isSelected && <Tag color="green" size="small">当前</Tag>}
              </div>
              <span className="ga-model-actions">
                <Button
                  size="small"
                  type="tertiary"
                  theme="borderless"
                  onClick={(e) => { e.stopPropagation(); handleEdit(profile.id); }}
                >
                  编辑
                </Button>
                <Button
                  size="small"
                  type="danger"
                  theme="borderless"
                  onClick={(e) => { e.stopPropagation(); handleDelete(profile.id, profile.name || profile.model); }}
                >
                  删除
                </Button>
              </span>
            </div>
          );
        })}
      </div>

      <Button
        type="tertiary"
        onClick={handleAdd}
        className="ga-add-model-btn"
      >
        + 添加模型
      </Button>

      <AddModelModal
        visible={addModalVisible}
        editingId={editingId}
        onClose={() => setAddModalVisible(false)}
      />
    </div>
  );
}
