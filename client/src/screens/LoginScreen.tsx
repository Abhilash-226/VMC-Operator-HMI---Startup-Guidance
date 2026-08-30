interface LoginScreenProps {
  login: (pin: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
  setError: (err: string | null) => void;
}

export function LoginScreen({ login, loading, error, setError }: LoginScreenProps) {
  return (
    <div style={{ display: 'none' }}>
      {loading ? 'loading' : ''} {error} {typeof login} {typeof setError}
    </div>
  );
}
