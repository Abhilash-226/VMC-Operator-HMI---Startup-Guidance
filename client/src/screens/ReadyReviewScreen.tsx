import type { Session, ChecklistItem } from '../state/useSession.js';
import { StageProgress } from '../components/StageProgress.js';
import { PrimaryButton } from '../components/PrimaryButton.js';

interface ScreenProps {
  session: Session;
  advanceStage: () => Promise<void>;
  onReset: () => void;
  loading: boolean;
}

interface SummaryCardProps {
  title: string;
  items: ChecklistItem[];
}

function SummaryCard({ title, items }: SummaryCardProps) {
  const confirmedCount = items.filter(i => i.confirmed).length;
  const allOk = confirmedCount === items.length && items.length > 0;

  return (
    <div className={`summary-card ${allOk ? 'summary-card-ok' : 'summary-card-warn'}`}>
      <div className="summary-card-header">
        <span className="summary-card-icon">{allOk ? '✓' : '⚠'}</span>
        <h3 className="summary-card-title">{title}</h3>
        <span className="summary-card-badge">
          {confirmedCount}/{items.length}
        </span>
      </div>
      <p className="summary-card-status">
        {allOk ? 'All checks confirmed' : `${items.length - confirmedCount} item(s) pending`}
      </p>
    </div>
  );
}

export function ReadyReviewScreen({ session, advanceStage, onReset, loading }: ScreenProps) {
  const allItems = session.checklist_items || [];
  const machineItems = allItems.filter(i => i.stage === 'MACHINE_CHECKS');
  const toolItems = allItems.filter(i => i.stage === 'TOOLS');
  const workpieceItems = allItems.filter(i => i.stage === 'WORKPIECE');

  const totalItems = allItems.length;
  const confirmedItems = allItems.filter(i => i.confirmed).length;
  const allOk = totalItems > 0 && confirmedItems === totalItems;

  return (
    <div className="screen-layout">
      <StageProgress currentStage={session.current_stage} onReset={onReset} />

      <div className="screen-body">
        <header className="screen-header">
          <h1 className="screen-title">Ready Review</h1>
          <p className="screen-instruction">
            Verify all stages are complete before starting the operation.
          </p>
        </header>

        <main className="ready-review-cards">
          <SummaryCard
            title="Machine Checks"
            items={machineItems}
          />
          <SummaryCard
            title="Required Tools"
            items={toolItems}
          />
          <SummaryCard
            title="Workpiece Setup"
            items={workpieceItems}
          />
        </main>

        {allOk && (
          <div className="ready-banner">
            <span className="ready-banner-icon">🟢</span>
            <strong>READY FOR OPERATION</strong>
            <span className="ready-banner-meta">
              {session.machine_id} · {session.work_order}
            </span>
          </div>
        )}
      </div>

      <PrimaryButton
        text="Proceed to Operation"
        disabled={!allOk}
        onClick={advanceStage}
        loading={loading}
      />
    </div>
  );
}
