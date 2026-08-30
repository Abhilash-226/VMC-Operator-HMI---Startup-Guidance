import { useSession } from './state/useSession.js';
import { LoginScreen } from './screens/LoginScreen.js';
import { MachineChecksScreen } from './screens/MachineChecksScreen.js';
import { ToolsScreen } from './screens/ToolsScreen.js';
import { WorkpieceScreen } from './screens/WorkpieceScreen.js';
import { ReadyReviewScreen } from './screens/ReadyReviewScreen.js';
import { OperationScreen } from './screens/OperationScreen.js';

function App() {
  const {
    session,
    loading,
    error,
    isAuthenticated,
    login,
    confirmItem,
    advanceStage,
    startOperation,
    stopOperation,
    resetSession,
    setError
  } = useSession();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading operator panel...</p>
      </div>
    );
  }

  if (!isAuthenticated || !session) {
    return (
      <LoginScreen
        login={login}
        loading={loading}
        error={error}
        setError={setError}
      />
    );
  }

  // Render the current stage screen dynamically
  switch (session.current_stage) {
    case 'MACHINE_CHECKS':
      return (
        <MachineChecksScreen
          session={session}
          confirmItem={confirmItem}
          advanceStage={advanceStage}
          onReset={resetSession}
          loading={loading}
        />
      );
    case 'TOOLS':
      return (
        <ToolsScreen
          session={session}
          confirmItem={confirmItem}
          advanceStage={advanceStage}
          onReset={resetSession}
          loading={loading}
        />
      );
    case 'WORKPIECE':
      return (
        <WorkpieceScreen
          session={session}
          confirmItem={confirmItem}
          advanceStage={advanceStage}
          onReset={resetSession}
          loading={loading}
        />
      );
    case 'READY_REVIEW':
      return (
        <ReadyReviewScreen
          session={session}
          advanceStage={advanceStage}
          onReset={resetSession}
          loading={loading}
        />
      );
    case 'OPERATION':
      return (
        <OperationScreen
          session={session}
          startOperation={startOperation}
          stopOperation={stopOperation}
          onReset={resetSession}
          loading={loading}
        />
      );
    default:
      return (
        <div className="error-container">
          <p>Unknown stage: {(session as any).current_stage}</p>
        </div>
      );
  }
}

export default App;
