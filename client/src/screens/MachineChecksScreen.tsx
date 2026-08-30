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

export function MachineChecksScreen({ session, confirmItem, advanceStage, onReset, loading }: ScreenProps) {
  const stageItems = (session.checklist_items || []).filter(item => item.stage === 'MACHINE_CHECKS');
  
  // Safety check: verify all items in the stage are confirmed
  const allConfirmed = stageItems.length > 0 && stageItems.every(item => item.confirmed);

  return (
    <div className="screen-layout">
      <StageProgress currentStage={session.current_stage} onReset={onReset} />
      
      <div className="screen-body">
        <header className="screen-header">
          <h1 className="screen-title">Machine Checks — {session.machine_id}</h1>
          <p className="screen-instruction">
            Confirm all machine conditions are safe and ready for operation.
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
        text="Next Stage: Required Tools"
        disabled={!allConfirmed}
        onClick={advanceStage}
        loading={loading}
      />
    </div>
  );
}
