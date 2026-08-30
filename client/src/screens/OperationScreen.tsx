import type { Session } from '../state/useSession.js';

interface ScreenProps {
  session: Session;
  startOperation: () => Promise<void>;
  stopOperation: () => Promise<void>;
  loading: boolean;
}

export function OperationScreen({ session, startOperation, stopOperation, loading }: ScreenProps) {
  return (
    <div>
      Operation for {session.machine_id} {loading ? 'loading' : ''}
      {typeof startOperation} {typeof stopOperation}
    </div>
  );
}
