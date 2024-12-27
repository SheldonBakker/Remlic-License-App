import { memo } from 'react';
import { Link } from 'react-router-dom';

const Logo = memo(() => (
  <Link to="/" className="flex items-center space-x-4 group">
    <img
      src="/Remlic.png"
      alt="Remlic Logo"
      className="h-8 w-auto transform transition-transform duration-300 group-hover:scale-105"
    />
    <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600 bg-clip-text text-transparent tracking-tight transition-all duration-300 group-hover:tracking-wide">
      Remlic
    </span>
  </Link>
));

Logo.displayName = 'Logo';

export default Logo;