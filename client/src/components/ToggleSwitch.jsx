/**
 * Accessible iOS-style toggle; calls onChange when the user toggles (parent performs API work).
 */
export default function ToggleSwitch({ checked, onChange, disabled, ariaLabel }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel || (checked ? 'Active' : 'Inactive')}
      disabled={disabled}
      className={`toggle-switch${checked ? ' toggle-switch--on' : ''}${disabled ? ' toggle-switch--disabled' : ''}`}
      onClick={() => {
        if (!disabled) onChange();
      }}
    >
      <span className="toggle-switch__track" aria-hidden>
        <span className="toggle-switch__knob" />
      </span>
      <style>{`
        .toggle-switch {
          display: inline-flex;
          align-items: center;
          padding: 0;
          border: none;
          background: transparent;
          cursor: pointer;
          vertical-align: middle;
        }
        .toggle-switch--disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
        .toggle-switch__track {
          display: block;
          width: 44px;
          height: 24px;
          border-radius: 12px;
          background: var(--gray-mid);
          position: relative;
          transition: background 0.2s ease;
          flex-shrink: 0;
        }
        .toggle-switch--on .toggle-switch__track {
          background: var(--teal);
        }
        .toggle-switch__knob {
          position: absolute;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--white);
          top: 2px;
          left: 2px;
          box-shadow: 0 1px 3px rgba(27, 58, 107, 0.25);
          transition: transform 0.2s ease;
        }
        .toggle-switch--on .toggle-switch__knob {
          transform: translateX(20px);
        }
      `}</style>
    </button>
  );
}
