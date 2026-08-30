interface PrimaryButtonProps {
  text: string;
  disabled?: boolean;
  onClick: () => void;
  loading?: boolean;
}

export function PrimaryButton({ text, disabled = false, onClick, loading = false }: PrimaryButtonProps) {
  return (
    <div className="primary-action-container">
      <button
        type="button"
        className="primary-action-btn"
        disabled={disabled || loading}
        onClick={onClick}
      >
        {loading ? 'Processing...' : text}
      </button>
    </div>
  );
}
