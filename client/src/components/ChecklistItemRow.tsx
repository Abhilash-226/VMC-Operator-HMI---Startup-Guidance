import type { ChecklistItem } from '../state/useSession.js';

interface ChecklistItemRowProps {
  item: ChecklistItem;
  onConfirm: (id: string) => void;
  loading: boolean;
}

export function ChecklistItemRow({ item, onConfirm, loading }: ChecklistItemRowProps) {
  const isToolsStage = item.stage === 'TOOLS';
  const toolMeta = isToolsStage ? item.meta : null;

  return (
    <div className={`checklist-item-row ${item.confirmed ? 'row-confirmed' : 'row-pending'}`}>
      <div className="row-content">
        {isToolsStage && toolMeta ? (
          <div className="tool-info-layout">
            <div className="tool-primary-line">
              <span className="tool-number-tag">{toolMeta.tool_number || toolMeta.toolNumber}</span>
              <strong className="tool-type-text">{toolMeta.type}</strong>
            </div>
            <div className="tool-secondary-line">
              <span className="tool-desc-text">{toolMeta.description}</span>
              <span className="tool-rev-text">Program Rev: {toolMeta.program_rev || toolMeta.programRev}</span>
            </div>
          </div>
        ) : (
          <span className="standard-item-label">{item.label}</span>
        )}
      </div>

      <div className="row-action">
        {item.confirmed ? (
          <div className="confirmed-indicator" aria-label="Confirmed">
            <span className="confirm-icon">✓</span>
            <span className="confirm-text">Confirmed</span>
          </div>
        ) : (
          <button
            type="button"
            className="row-confirm-btn"
            disabled={loading}
            onClick={() => onConfirm(item.id)}
            aria-label={isToolsStage ? `Insert and confirm ${item.label}` : `Confirm ${item.label}`}
          >
            {loading ? '...' : isToolsStage ? 'Insert & Confirm' : 'Confirm'}
          </button>
        )}
      </div>
    </div>
  );
}
