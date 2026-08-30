import { useState, type FormEvent } from 'react';

interface LoginScreenProps {
  login: (pin: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
  setError: (err: string | null) => void;
}

export function LoginScreen({ login, loading, error, setError }: LoginScreenProps) {
  const [pin, setPin] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!pin) return;
    setError(null);
    await login(pin);
  };

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  return (
    <div className="login-screen-container">
      <div className="login-card">
        <div className="brand-logo">
          <div className="logo-icon">▲</div>
          <h2>Primeform Labs</h2>
        </div>
        <p className="login-subtitle">VMC OPERATOR PANEL</p>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="machine-id">Machine ID</label>
            <input
              id="machine-id"
              type="text"
              value="VMC-03"
              disabled
              className="disabled-input"
            />
          </div>

          <div className="input-group">
            <label htmlFor="pin-input">Operator PIN</label>
            <input
              id="pin-input"
              type="password"
              value={pin}
              readOnly
              placeholder="••••"
              className="pin-display-input"
            />
          </div>

          {error && <div className="error-banner">❌ {error}</div>}

          {/* Large On-screen Keypad for Shop Floor Tablet (usable with gloved hands) */}
          <div className="keypad">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                type="button"
                className="keypad-btn"
                onClick={() => handleKeyPress(String(num))}
              >
                {num}
              </button>
            ))}
            <button type="button" className="keypad-btn clear-btn" onClick={() => setPin('')}>
              C
            </button>
            <button
              type="button"
              className="keypad-btn"
              onClick={() => handleKeyPress('0')}
            >
              0
            </button>
            <button type="button" className="keypad-btn back-btn" onClick={handleBackspace}>
              ⌫
            </button>
          </div>

          <button
            type="submit"
            className="primary-btn submit-btn"
            disabled={loading || pin.length < 4}
          >
            {loading ? 'Verifying...' : 'Access Console'}
          </button>
        </form>
      </div>
    </div>
  );
}
