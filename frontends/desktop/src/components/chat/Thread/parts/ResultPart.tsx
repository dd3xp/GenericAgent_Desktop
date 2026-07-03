import { memo, useState } from 'react';

interface Props {
  content: string;
  inFlight: boolean;
}

export const ResultPart = memo(function ResultPart({ content, inFlight }: Props) {
  const [expanded, setExpanded] = useState(false);
  const isLong = content.length > 200;

  return (
    <div data-slot="tool-block" data-tool-row data-status={inFlight ? 'running' : 'success'}>
      <div data-slot="tool-header" onClick={() => isLong && setExpanded(!expanded)}>
        <span data-slot="tool-title">{inFlight ? 'Output…' : 'Output'}</span>
        {isLong && !expanded && (
          <span data-slot="tool-duration">{content.length} chars</span>
        )}
      </div>
      {(expanded || !isLong) && (
        <pre data-slot="tool-body">{content}</pre>
      )}
    </div>
  );
});
