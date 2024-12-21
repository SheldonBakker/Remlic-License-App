import { memo } from 'react';
import { Link, useLocation } from 'react-router-dom';

const NavLink = memo(({ item, isLoggedIn, onClick }: {
  item: { name: string; path: string; requiresAuth: boolean };
  isLoggedIn: boolean;
  onClick?: () => void;
}) => {
  const location = useLocation();
  const isActive = location.pathname === item.path;
  
  if (item.requiresAuth && !isLoggedIn) return null;
  
  return (
    <Link
      key={item.path}
      className={`
        relative w-full inline-block font-medium transition-all duration-300 
        after:content-[''] after:absolute after:w-full after:h-0.5 
        after:bottom-0 after:left-0 after:bg-gradient-to-r after:from-blue-500 after:to-purple-600 
        after:transition-transform
        ${isActive 
          ? 'text-white after:scale-x-100' 
          : 'text-gray-300 after:scale-x-0 hover:text-white hover:after:scale-x-100'
        }
        focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-1 focus:ring-offset-transparent
        rounded-md py-2 px-3
      `}
      to={item.path}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      role="menuitem"
      tabIndex={0}
    >
      {item.name}
    </Link>
  );
});

NavLink.displayName = 'NavLink';

export default NavLink;