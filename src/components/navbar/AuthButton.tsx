import { memo } from 'react';
import { Link } from 'react-router-dom';

const AuthButton = memo(({ isLoggedIn, onLogout, isMobile = false, onClick }: {
  isLoggedIn: boolean;
  onLogout: () => void;
  isMobile?: boolean;
  onClick?: () => void;
}) => {
  const baseClasses = `
    ${isMobile ? 'w-full' : ''} 
    bg-gradient-to-r from-blue-600 to-purple-600 
    px-6 py-2.5 rounded-xl font-medium 
    hover:from-blue-700 hover:to-purple-700 
    transition-all duration-300 
    hover:scale-102 
    active:scale-98 
    shadow-lg hover:shadow-blue-500/30
    hover:ring-2 hover:ring-blue-500/25
    border border-white/10
    focus:outline-none focus:ring-2 focus:ring-blue-500/40
    focus:ring-offset-2 focus:ring-offset-gray-900
    backdrop-blur-sm
  `;

  if (isLoggedIn) {
    return (
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
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </span>
      </button>
    );
  }

  return (
    <Link 
      to="/login" 
      className={baseClasses}
      onClick={onClick}
      aria-label="Login to your account"
    >
      <span className="flex items-center justify-center gap-2">
        <span>Login</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
      </span>
    </Link>
  );
});

AuthButton.displayName = 'AuthButton';

export default AuthButton; 