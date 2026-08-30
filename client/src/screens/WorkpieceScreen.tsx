import type { Session } from '../state/useSession.js';

interface ScreenProps {
  session: Session;
  confirmItem: (id: string) => Promise<void>;
  advanceStage: () => Promise<void>;
  loading: boolean;
}

export function WorkpieceScreen({ session, confirmItem, advanceStage, loading }: ScreenProps) {
  return (
    <div>
      Workpiece for {session.machine_id} {loading ? 'loading' : ''}
      {typeof confirmItem} {typeof advanceStage}
    </div>
  );
}
