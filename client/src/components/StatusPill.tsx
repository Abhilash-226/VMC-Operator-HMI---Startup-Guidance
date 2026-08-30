interface StatusPillProps {
  status: 'READY' | 'RUNNING' | 'STOPPED';
}

export function StatusPill({ status }: StatusPillProps) {
  let statusClass = 'pill-ready';
  let label = 'READY';

  if (status === 'RUNNING') {
    statusClass = 'pill-running';
    label = 'RUNNING';
  } else if (status === 'STOPPED') {
    statusClass = 'pill-stopped';
    label = 'STOPPED';
  }

  return (
    <div className={`status-pill ${statusClass}`}>
      <span className="status-pulse-dot" />
      <strong className="status-text">{label}</strong>
    </div>
  );
}
