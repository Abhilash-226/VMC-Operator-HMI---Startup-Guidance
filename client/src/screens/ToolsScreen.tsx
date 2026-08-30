import type { Session } from '../state/useSession.js';

interface ScreenProps {
  session: Session;
  confirmItem: (id: string) => Promise<void>;
  advanceStage: () => Promise<void>;
  loading: boolean;
}

export function ToolsScreen({ session, confirmItem, advanceStage, loading }: ScreenProps) {
  return (
    <div>
      Tools for {session.machine_id} {loading ? 'loading' : ''}
      {typeof confirmItem} {typeof advanceStage}
    </div>
  );
}
