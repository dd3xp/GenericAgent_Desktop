import { memo, useState, useCallback } from 'react';
import { useChatStore } from '../../../../stores/chat';
import './approvalPart.css';

interface Props {
  question: string;
  candidates: string[];
}

export const ApprovalPart = memo(function ApprovalPart({ question, candidates }: Props) {
  const [responded, setResponded] = useState(false);
  const sendMessage = useChatStore((s) => s.sendMessage);

  const handleRespond = useCallback((answer: string) => {
    setResponded(true);
    sendMessage(answer);
  }, [sendMessage]);

  return (
    <div data-slot="approval-card" data-responded={responded || undefined}>
      <div data-slot="approval-question">{question}</div>
      {candidates.length > 0 && !responded && (
        <div data-slot="approval-candidates">
          {candidates.map((c, i) => (
            <button
              key={i}
              data-slot="approval-candidate-btn"
              onClick={() => handleRespond(c)}
            >
              {c}
            </button>
          ))}
        </div>
      )}
      {!responded && candidates.length === 0 && (
        <div data-slot="approval-hint">Type your response in the composer below.</div>
      )}
      {responded && (
        <div data-slot="approval-done">Responded</div>
      )}
    </div>
  );
});
