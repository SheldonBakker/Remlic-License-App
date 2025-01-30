import { memo } from 'react';
import { Link } from 'react-router-dom';

interface AuthButtonProps {
  isLoggedIn: boolean;
  onLogout: () => void;
  isMobile?: boolean;
  onClick?: () => void;

}

const AuthButton = memo(({ isLoggedIn, onLogout, isMobile = false, onClick }: AuthButtonProps) => {
  const baseClasses = `
    ${isMobile ? 'w-full' : ''}
    px-4 py-2 rounded-lg transition-all duration-200
    hover:bg-white/10 border border-indigo-500/20
  `;

  const renderLogoutButton = () => (
    <button
      className={baseClasses}
      onClick={() => {
        onLogout();
        onClick?.();
      }}
      aria-label="Logout from your account"
    >
      <span className="flex items-center justify-center gap-2">
        <span>Logout</span>
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
      </span>
    </button>
  );

  const renderAuthLinks = () => (
    <div className="flex gap-4">
      <Link
        to="/register"
        className={baseClasses}
        onClick={onClick}
        aria-label="Create a new account"
      >
        <span className="flex items-center justify-center gap-2">
          <span>Register</span>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>
        </span>
      </Link>
      <Link
        to="/login"
        className={baseClasses}
        onClick={onClick}
        aria-label="Login to your account"
      >
        <span className="flex items-center justify-center gap-2">
          <span>Login</span>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
            />
          </svg>
        </span>
      </Link>
    </div>
  );

  return isLoggedIn ? renderLogoutButton() : renderAuthLinks();
});

AuthButton.displayName = 'AuthButton';

export default AuthButton;
