import type { Session } from '../state/useSession.js';

interface ScreenProps {
  session: Session;
  advanceStage: () => Promise<void>;
  loading: boolean;
}

export function ReadyReviewScreen({ session, advanceStage, loading }: ScreenProps) {
  return (
    <div>
      Ready Review for {session.machine_id} {loading ? 'loading' : ''}
      {typeof advanceStage}
    </div>
  );
}
