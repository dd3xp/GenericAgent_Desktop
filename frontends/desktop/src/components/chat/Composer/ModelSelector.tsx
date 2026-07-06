import { useState, useRef, useEffect, useCallback } from 'react';
import { useSettingsStore } from '../../../stores/settings';
import type { ModelProfile } from '../../../services/bridge';

const PROVIDER_COLORS: Record<string, string> = {
  deepseek: '#4D6BFE',
  dashscope: '#615CED',
  qwen: '#615CED',
  openai: '#10A37F',
  anthropic: '#D97706',
  openrouter: '#6366F1',
  google: '#4285F4',
  moonshot: '#7C3AED',
};

function providerColor(apibase: string): string {
  const lower = apibase.toLowerCase();
  for (const [key, color] of Object.entries(PROVIDER_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return 'var(--semi-color-text-3, #8f959e)';
}

function modelShortName(profile: ModelProfile): string {
  if (profile.name && profile.name.trim()) return profile.name.trim();
  const m = profile.model || '';
  const slash = m.lastIndexOf('/');
  return slash >= 0 ? m.slice(slash + 1) : m;
}

export function ModelSelector() {
  const [open, setOpen] = useState(false);
  const [expandedMixin, setExpandedMixin] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const profiles = useSettingsStore((s) => s.modelProfiles);
  const selectedNo = useSettingsStore((s) => s.selectedModelNo);
  const selectModel = useSettingsStore((s) => s.selectModel);

  const currentProfile = profiles[selectedNo];
  const chipLabel = currentProfile ? modelShortName(currentProfile) : 'Model';

  const toggle = useCallback(() => setOpen((v) => !v), []);

  const handleSelect = useCallback((idx: number) => {
    selectModel(idx);
    setOpen(false);
  }, [selectModel]);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
          btnRef.current && !btnRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  useEffect(() => {
    function onHotkey(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key >= '1' && e.key <= '9') {
        const idx = parseInt(e.key) - 1;
        if (idx < profiles.length) {
          e.preventDefault();
          selectModel(idx);
        }
      }
    }
    document.addEventListener('keydown', onHotkey);
    return () => document.removeEventListener('keydown', onHotkey);
  }, [profiles, selectModel]);

  if (profiles.length === 0) return null;

  return (
    <div data-slot="model-selector">
      <button
        ref={btnRef}
        data-slot="model-chip"
        onClick={toggle}
        title={currentProfile ? `${currentProfile.model}\n${currentProfile.apibase}` : ''}
      >
        {currentProfile && (
          <span
            data-slot="provider-dot"
            style={{ background: providerColor(currentProfile.apibase) }}
          />
        )}
        <span data-slot="model-chip-label">{chipLabel}</span>
        <span data-slot="model-chip-caret" data-open={open ? '' : undefined}>
          <CaretIcon />
        </span>
      </button>

      {open && (
        <div ref={menuRef} data-slot="model-menu">
          {profiles.map((p, idx) => {
            if (p.kind === 'mixin') {
              const isExpanded = expandedMixin === idx;
              return (
                <div key={p.id} data-slot="model-menu-group">
                  <button
                    data-slot="model-menu-item"
                    data-active={idx === selectedNo ? '' : undefined}
                    onClick={() => handleSelect(idx)}
                  >
                    <span data-slot="provider-dot" style={{ background: providerColor(p.apibase || '') }} />
                    <span data-slot="model-menu-name">{modelShortName(p)}</span>
                    {p.members && p.members.length > 0 && (
                      <span
                        data-slot="mixin-caret"
                        data-expanded={isExpanded ? '' : undefined}
                        onClick={(e) => { e.stopPropagation(); setExpandedMixin(isExpanded ? null : idx); }}
                      >
                        <CaretIcon />
                      </span>
                    )}
                  </button>
                  {isExpanded && p.members && (
                    <div data-slot="mixin-members">
                      {p.members.map((memberId) => {
                        const member = profiles.find((pp) => pp.id === memberId);
                        return member ? (
                          <div key={memberId} data-slot="mixin-member">
                            <span data-slot="provider-dot" style={{ background: providerColor(member.apibase) }} />
                            {modelShortName(member)}
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <button
                key={p.id}
                data-slot="model-menu-item"
                data-active={idx === selectedNo ? '' : undefined}
                onClick={() => handleSelect(idx)}
              >
                <span data-slot="provider-dot" style={{ background: providerColor(p.apibase) }} />
                <span data-slot="model-menu-name">{modelShortName(p)}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CaretIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
      <path d="M2.5 3.5L5 6.5L7.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
