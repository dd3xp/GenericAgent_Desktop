import { memo } from 'react';
import type { ParsedSegment } from '../../agentProtocol';
import { MarkdownPart } from './MarkdownPart';
import { ThinkingPart } from './ThinkingPart';
import { ToolPart } from './ToolPart';
import { ResultPart } from './ResultPart';
import { SummaryPart } from './SummaryPart';
import { ApprovalPart } from './ApprovalPart';

interface Props {
  segments: ParsedSegment[];
  isStreaming: boolean;
}

export const MessageParts = memo(function MessageParts({ segments, isStreaming }: Props) {
  if (segments.length === 0) return null;

  return (
    <div data-slot="aui_assistant-message-content">
      {segments.map((seg, i) => {
        switch (seg.type) {
          case 'prose':
            return <MarkdownPart key={i} content={seg.content} />;
          case 'thinking':
            return <ThinkingPart key={i} content={seg.content} isStreaming={!!seg.inFlight || isStreaming} />;
          case 'tool':
            return <ToolPart key={i} name={seg.label || 'tool'} content={seg.content} inFlight={!!seg.inFlight} />;
          case 'result':
            return <ResultPart key={i} content={seg.content} inFlight={!!seg.inFlight} />;
          case 'summary':
            return <SummaryPart key={i} content={seg.content} />;
          case 'approval':
            return <ApprovalPart key={i} question={seg.content} candidates={seg.candidates || []} />;
          default:
            return null;
        }
      })}
    </div>
  );
});
