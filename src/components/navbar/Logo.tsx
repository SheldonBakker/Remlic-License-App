import { memo } from 'react';
import { Link } from 'react-router-dom';

const Logo = memo(() => (
  <Link to="/" className="flex items-center space-x-3 group">
    <img
      src="/Remlic.png"
      alt="Remlic Logo"
      className="h-8 w-auto transition-transform duration-300 group-hover:scale-110"
    />
    <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600 bg-clip-text text-transparent hover:opacity-90 transition-all duration-300 tracking-tight group-hover:scale-105">
      Remlic
    </span>
  </Link>
));

Logo.displayName = 'Logo';

export default Logo;