import { memo, useState, useRef } from 'react';
import { useEnterAnimation } from '../../../../hooks/useEnterAnimation';
import { useToolTimer } from '../../../../hooks/useToolTimer';

interface Props {
  name: string;
  content: string;
  inFlight: boolean;
  segmentKey?: string;
  isStreaming?: boolean;
}

export const ToolPart = memo(function ToolPart({ name, content, inFlight, segmentKey = '', isStreaming = false }: Props) {
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEnterAnimation(ref, segmentKey, isStreaming);
  const { elapsed, duration } = useToolTimer(segmentKey, inFlight);

  return (
    <div ref={ref} data-slot="tool-block" data-tool-row data-status={inFlight ? 'running' : 'success'}>
      <div data-slot="tool-header" onClick={() => setExpanded(!expanded)}>
        <span data-slot="tool-glyph">
          {inFlight ? <span data-slot="tool-spinner" /> : <CheckGlyph />}
        </span>
        <span data-slot="tool-title">{name}</span>
        {inFlight && <span data-slot="tool-dots">&hellip;</span>}
        {elapsed && <span data-slot="tool-duration">{elapsed}</span>}
        {duration && <span data-slot="tool-duration">{duration}</span>}
      </div>
      {expanded && content && (
        <pre data-slot="tool-body">{content}</pre>
      )}
    </div>
  );
});

function CheckGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <path d="M13.5 4.5L6 12L2.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
