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

  const renderLoginLink = () => (
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
  );

  return isLoggedIn ? renderLogoutButton() : renderLoginLink();
});

AuthButton.displayName = 'AuthButton';

export default AuthButton;
