import type { Session } from '../state/useSession.js';
import { StageProgress } from '../components/StageProgress.js';
import { ChecklistItemRow } from '../components/ChecklistItemRow.js';
import { PrimaryButton } from '../components/PrimaryButton.js';

interface ScreenProps {
  session: Session;
  confirmItem: (id: string) => Promise<void>;
  advanceStage: () => Promise<void>;
  onReset: () => void;
  loading: boolean;
}

export function WorkpieceScreen({ session, confirmItem, advanceStage, onReset, loading }: ScreenProps) {
  const stageItems = (session.checklist_items || []).filter(item => item.stage === 'WORKPIECE');

  const allConfirmed = stageItems.length > 0 && stageItems.every(item => item.confirmed);

  return (
    <div className="screen-layout">
      <StageProgress currentStage={session.current_stage} onReset={onReset} />

      <div className="screen-body">
        <header className="screen-header">
          <h1 className="screen-title">Workpiece Setup — {session.work_order}</h1>
          <p className="screen-instruction">
            Load and fixture the workpiece exactly as specified before proceeding.
          </p>
        </header>

        <main className="checklist-list">
          {stageItems.map(item => (
            <ChecklistItemRow
              key={item.id}
              item={item}
              onConfirm={confirmItem}
              loading={loading}
            />
          ))}
        </main>
      </div>

      <PrimaryButton
        text="Next Stage: Ready Review"
        disabled={!allConfirmed}
        onClick={advanceStage}
        loading={loading}
      />
    </div>
  );
}
