import type { Session } from '../state/useSession.js';
import { StageProgress } from '../components/StageProgress.js';
import { ChecklistItemRow } from '../components/ChecklistItemRow.js';
import { PrimaryButton } from '../components/PrimaryButton.js';

interface ScreenProps {
  session: Session;
  confirmItem: (id: string) => Promise<void>;
  advanceStage: () => Promise<void>;
  loading: boolean;
}

export function ToolsScreen({ session, confirmItem, advanceStage, loading }: ScreenProps) {
  const stageItems = (session.checklist_items || []).filter(item => item.stage === 'TOOLS');
  
  const totalTools = stageItems.length;
  const confirmedTools = stageItems.filter(item => item.confirmed).length;
  const allConfirmed = totalTools > 0 && confirmedTools === totalTools;

  // Retrieve program text dynamically from first tool's metadata
  const firstTool = stageItems[0];
  const programText = firstTool?.meta?.program_rev || firstTool?.meta?.programRev || 'O1042 Rev C';

  return (
    <div className="screen-layout">
      <StageProgress currentStage={session.current_stage} />
      
      <div className="screen-body">
        <header className="screen-header">
          <h1 className="screen-title">Required Tools — Program {programText}</h1>
          <p className="screen-instruction">
            Verify tool specifications, load tools into the VMC spindle, and confirm each.
          </p>
          <div className="running-counter">
            <span className="counter-highlight">{confirmedTools} of {totalTools}</span> tools confirmed
          </div>
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
        text="Next Stage: Workpiece Setup"
        disabled={!allConfirmed}
        onClick={advanceStage}
        loading={loading}
      />
    </div>
  );
}
