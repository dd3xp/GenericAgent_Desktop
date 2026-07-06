import { useState, useRef, useEffect, useCallback } from 'react';
import { useSettingsStore } from '../../../stores/settings';

interface Skill {
  id: string;
  icon: string;
  title: string;
  desc: string;
  prompt: string;
}

const CUSTOM_PRESETS_KEY = 'ga_custom_presets';

function getCustomSkills(): Skill[] {
  try {
    const raw = localStorage.getItem(CUSTOM_PRESETS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function getBuiltinSkills(lang: 'zh' | 'en'): Skill[] {
  if (lang === 'en') {
    return [
      { id: 'plan', icon: '🗺️', title: 'Plan Mode', desc: 'Explore → Plan → Execute → Verify', prompt: 'Enter Plan mode: read memory/plan_sop.md, follow Explore → Plan → Execute → Verify flow for the task I describe next.' },
      { id: 'goal', icon: '🎯', title: 'Goal Mode', desc: 'Set a goal, achieve it autonomously', prompt: 'Enter Goal mode: read L3 goal mode SOP, autonomously achieve the goal I describe next.' },
      { id: 'autonomous', icon: '🤖', title: 'Autonomous', desc: 'Plan and execute tasks per SOP', prompt: '🤖 Enter autonomous mode: read memory/autonomous_operation_sop.md, select or plan tasks, execute independently and produce a report.' },
      { id: 'hive', icon: '🐝', title: 'Hive Collab', desc: 'Multi-worker collaboration', prompt: 'Start Goal Hive mode: follow hive SOP, spawn multiple workers to collaboratively achieve my next goal.' },
      { id: 'review', icon: '🔍', title: 'Deep Review', desc: 'Critical quality review', prompt: 'Enter reviewer mode: rigorously critique the latest output, check each item and report issues.' },
      { id: 'findwork', icon: '💡', title: 'Find Work', desc: 'Analyze situation, suggest TODOs', prompt: 'Analyze my situation using the autonomous planning approach, generate a batch of TODOs that would interest me.' },
    ];
  }
  return [
    { id: 'plan', icon: '🗺️', title: 'Plan 模式', desc: '按探索→规划→执行→验证流程', prompt: '进入 Plan 模式：先读 memory/plan_sop.md，按其中「探索→规划→执行→验证」流程，等我接下来描述要做的任务。' },
    { id: 'goal', icon: '🎯', title: 'Goal 模式', desc: '设定目标，自主完成', prompt: '进入 Goal 模式：读 L3 goal mode SOP，自主达成我接下来描述的目标。' },
    { id: 'autonomous', icon: '🤖', title: '自主行动', desc: '按 SOP 规划/执行任务', prompt: '🤖 进入自主行动模式：阅读 memory/autonomous_operation_sop.md，按 SOP 选取或规划任务,独立执行并产出报告。' },
    { id: 'hive', icon: '🐝', title: 'Hive 协作', desc: '多 worker 协同攻坚', prompt: '启动 Goal Hive 模式：按 hive SOP 拉起多个 worker 协同完成我接下来的目标。' },
    { id: 'review', icon: '🔍', title: '深度复核', desc: '挑刺式质量把关', prompt: '进入监察者模式：对刚才的产出严格挑刺、逐项复核并报告问题。' },
    { id: 'findwork', icon: '💡', title: '找点事做', desc: '分析情况，推荐 TODO', prompt: '按照自主行动的规划部分，充分分析我的情况，给我生成一批 TODO，务必让我感兴趣。' },
  ];
}

interface Props {
  onSelect: (prompt: string) => void;
}

export function SkillPanel({ onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [focusIdx, setFocusIdx] = useState(-1);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const lang = useSettingsStore((s) => s.lang);

  const builtins = getBuiltinSkills(lang);
  const customs = getCustomSkills();
  const allSkills = [...builtins, ...customs];

  const toggle = useCallback(() => {
    setOpen((v) => !v);
    setFocusIdx(-1);
  }, []);

  const handleSelect = useCallback((prompt: string) => {
    onSelect(prompt);
    setOpen(false);
  }, [onSelect]);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node) &&
          btnRef.current && !btnRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeydown(e: KeyboardEvent) {
      if (e.key === 'Escape') { setOpen(false); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setFocusIdx((v) => Math.min(v + 1, allSkills.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setFocusIdx((v) => Math.max(v - 1, 0)); }
      if (e.key === 'Enter' && focusIdx >= 0 && focusIdx < allSkills.length) {
        e.preventDefault();
        handleSelect(allSkills[focusIdx].prompt);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKeydown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeydown);
    };
  }, [open, focusIdx, allSkills, handleSelect]);

  return (
    <div data-slot="skill-wrap">
      <button
        ref={btnRef}
        data-slot="skill-trigger"
        onClick={toggle}
        aria-label={lang === 'zh' ? '技能' : 'Skills'}
        title={lang === 'zh' ? '技能面板' : 'Skills panel'}
      >
        <SkillIcon />
      </button>

      {open && (
        <div ref={panelRef} data-slot="skill-panel">
          <div data-slot="skill-section">
            <div data-slot="skill-section-title">
              {lang === 'zh' ? '系统技能' : 'System Skills'}
            </div>
            {builtins.map((s, i) => (
              <button
                key={s.id}
                data-slot="skill-item"
                data-focused={focusIdx === i ? '' : undefined}
                onClick={() => handleSelect(s.prompt)}
                onMouseEnter={() => setFocusIdx(i)}
              >
                <span data-slot="skill-icon">{s.icon}</span>
                <span data-slot="skill-info">
                  <span data-slot="skill-name">{s.title}</span>
                  <span data-slot="skill-desc">{s.desc}</span>
                </span>
              </button>
            ))}
          </div>
          {customs.length > 0 && (
            <div data-slot="skill-section">
              <div data-slot="skill-section-title">
                {lang === 'zh' ? '自定义技能' : 'Custom Skills'}
              </div>
              {customs.map((s, i) => (
                <button
                  key={s.id}
                  data-slot="skill-item"
                  data-focused={focusIdx === builtins.length + i ? '' : undefined}
                  onClick={() => handleSelect(s.prompt)}
                  onMouseEnter={() => setFocusIdx(builtins.length + i)}
                >
                  <span data-slot="skill-icon">{s.icon || '⚙️'}</span>
                  <span data-slot="skill-info">
                    <span data-slot="skill-name">{s.title}</span>
                    <span data-slot="skill-desc">{s.desc}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SkillIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
      <path d="M215.79 118.17a8 8 0 0 0-5-5.66L153.18 90.9l14.66-73.33a8 8 0 0 0-13.69-7l-112 120a8 8 0 0 0 3 13.05l57.63 21.61-14.62 73.12a8 8 0 0 0 13.69 7l112-120a8 8 0 0 0 1.94-7.18Z" />
    </svg>
  );
}
