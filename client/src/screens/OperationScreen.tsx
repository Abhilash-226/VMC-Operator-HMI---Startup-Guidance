import { useState, useEffect } from 'react';
import type { Session } from '../state/useSession.js';
import { StageProgress } from '../components/StageProgress.js';
import { StatusPill } from '../components/StatusPill.js';

interface ScreenProps {
  session: Session;
  startOperation: () => Promise<void>;
  stopOperation: () => Promise<void>;
  loading: boolean;
}

function formatDuration(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return [
    hrs.toString().padStart(2, '0'),
    mins.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0'),
  ].join(':');
}

export function OperationScreen({ session, startOperation, stopOperation, loading }: ScreenProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const isRunning = session.operation_status === 'RUNNING';

  // Reset and run elapsed timer when RUNNING
  useEffect(() => {
    if (isRunning) {
      setElapsedSeconds(0);
      const intervalId = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
      return () => clearInterval(intervalId);
    }
  }, [isRunning]);

  const handleToggle = () => {
    if (isRunning) {
      stopOperation();
    } else {
      startOperation();
    }
  };

  const buttonText = isRunning ? '⏹ Stop Operation' : '▶ Start Operation';
  const buttonClass = isRunning ? 'stop-btn' : 'start-btn';

  return (
    <div className="screen-layout">
      <StageProgress currentStage={session.current_stage} />

      <div className="screen-body operation-body">
        <header className="screen-header">
          <h1 className="screen-title">Operation Control</h1>
          <p className="screen-instruction">
            {session.machine_id} · {session.work_order}
          </p>
        </header>

        <main className="operation-dashboard">
          {/* Large central status indicator */}
          <div className="operation-status-area">
            <StatusPill status={session.operation_status} />
            {isRunning && (
              <div className="elapsed-timer" aria-live="polite" aria-label="Elapsed run time">
                <span className="elapsed-label">ELAPSED</span>
                <span className="elapsed-value">{formatDuration(elapsedSeconds)}</span>
              </div>
            )}
            {session.operation_status === 'STOPPED' && (
              <div className="stopped-note">
                Operation stopped. Review output or restart.
              </div>
            )}
            {session.operation_status === 'READY' && (
              <div className="ready-note">
                All pre-checks passed. Machine is ready to start.
              </div>
            )}
          </div>

          {/* Operation metadata summary */}
          <div className="operation-meta-grid">
            <div className="meta-cell">
              <span className="meta-label">Machine</span>
              <strong className="meta-value">{session.machine_id}</strong>
            </div>
            <div className="meta-cell">
              <span className="meta-label">Work Order</span>
              <strong className="meta-value">{session.work_order}</strong>
            </div>
            <div className="meta-cell">
              <span className="meta-label">Program</span>
              <strong className="meta-value">O1042 Rev C</strong>
            </div>
            <div className="meta-cell">
              <span className="meta-label">Material</span>
              <strong className="meta-value">6061-T6 Al</strong>
            </div>
          </div>
        </main>
      </div>

      {/* Bottom-anchored large control button */}
      <div className="primary-action-container">
        <button
          type="button"
          className={`primary-action-btn ${buttonClass}`}
          disabled={loading}
          onClick={handleToggle}
          aria-label={buttonText}
        >
          {loading ? 'Processing...' : buttonText}
        </button>
      </div>
    </div>
  );
}
