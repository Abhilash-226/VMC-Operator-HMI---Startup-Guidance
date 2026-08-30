interface StageProgressProps {
  currentStage: 'MACHINE_CHECKS' | 'TOOLS' | 'WORKPIECE' | 'READY_REVIEW' | 'OPERATION';
}

const STAGES: Array<{ key: string; label: string }> = [
  { key: 'MACHINE_CHECKS', label: 'Machine Checks' },
  { key: 'TOOLS', label: 'Required Tools' },
  { key: 'WORKPIECE', label: 'Workpiece Setup' },
  { key: 'READY_REVIEW', label: 'Ready Review' },
  { key: 'OPERATION', label: 'Operation' },
];

export function StageProgress({ currentStage }: StageProgressProps) {
  const currentIndex = STAGES.findIndex(s => s.key === currentStage);
  
  return (
    <div className="stage-progress-container">
      <div className="stage-progress-info">
        <span className="stage-progress-label">
          Stage {currentIndex + 1} of 5 · {STAGES[currentIndex]?.label}
        </span>
      </div>
      <div className="stage-dots">
        {STAGES.map((stage, idx) => {
          let statusClass = 'dot-pending';
          if (idx < currentIndex) {
            statusClass = 'dot-completed';
          } else if (idx === currentIndex) {
            statusClass = 'dot-active';
          }
          return (
            <div
              key={stage.key}
              className={`progress-dot ${statusClass}`}
              title={stage.label}
            />
          );
        })}
      </div>
    </div>
  );
}
