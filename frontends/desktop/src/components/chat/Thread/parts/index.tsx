import { memo } from 'react';
import type { ParsedSegment } from '../../agentProtocol';
import { MarkdownPart } from './MarkdownPart';
import { ThinkingPart } from './ThinkingPart';
import { ToolPart } from './ToolPart';
import { ResultPart } from './ResultPart';
import { SummaryPart } from './SummaryPart';
import { ApprovalPart } from './ApprovalPart';
import { ResponseLoadingIndicator, StreamStallIndicator } from '../StreamIndicators';

interface Props {
  segments: ParsedSegment[];
  isStreaming: boolean;
  messageId?: string;
}

export const MessageParts = memo(function MessageParts({ segments, isStreaming, messageId = '' }: Props) {
  if (segments.length === 0 && isStreaming) {
    return (
      <div data-slot="aui_assistant-message-content">
        <ResponseLoadingIndicator />
      </div>
    );
  }

  if (segments.length === 0) return null;

  const totalContentLength = segments.reduce((acc, s) => acc + s.content.length, 0);

  return (
    <div data-slot="aui_assistant-message-content">
      {segments.map((seg, i) => {
        const segKey = `${messageId}-${i}`;
        switch (seg.type) {
          case 'prose':
            return <MarkdownPart key={i} content={seg.content} isStreaming={isStreaming && i === segments.length - 1} />;
          case 'thinking':
            return <ThinkingPart key={i} content={seg.content} isStreaming={!!seg.inFlight || isStreaming} />;
          case 'tool':
            return <ToolPart key={i} name={seg.label || 'tool'} content={seg.content} inFlight={!!seg.inFlight} segmentKey={segKey} isStreaming={isStreaming} />;
          case 'result':
            return <ResultPart key={i} content={seg.content} inFlight={!!seg.inFlight} segmentKey={segKey} isStreaming={isStreaming} />;
          case 'summary':
            return <SummaryPart key={i} content={seg.content} />;
          case 'approval':
            return <ApprovalPart key={i} question={seg.content} candidates={seg.candidates || []} />;
          default:
            return null;
        }
      })}
      {isStreaming && <StreamStallIndicator contentLength={totalContentLength} />}
    </div>
  );
});
