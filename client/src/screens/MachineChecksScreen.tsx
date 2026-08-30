import type { Session } from '../state/useSession.js';

interface ScreenProps {
  session: Session;
  confirmItem: (id: string) => Promise<void>;
  advanceStage: () => Promise<void>;
  loading: boolean;
}

export function MachineChecksScreen({ session, confirmItem, advanceStage, loading }: ScreenProps) {
  return (
    <div>
      Machine Checks for {session.machine_id} {loading ? 'loading' : ''}
      {typeof confirmItem} {typeof advanceStage}
    </div>
  );
}
