import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Logo from "./navbar/Logo";
import NavLink from "./navbar/NavLink";
import AuthButton from "./navbar/AuthButton";

const Navbar = memo(() => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [, setUserType] = useState<string | null>(null);
  const navigate = useNavigate();

  const navigationItems = useMemo(() => [
    { name: "Home", path: "/", requiresAuth: false },
    { name: "Profile", path: "/profile", requiresAuth: true },
    { name: "Dashboard", path: "/dashboard", requiresAuth: true },
    { name: "Settings", path: "/settings", requiresAuth: true },
    { name: "Price", path: "/price", requiresAuth: false },
    { name: "Documentation", path: "/documentation", requiresAuth: false },
    { name: "Contact", path: "/contact", requiresAuth: false },
  ], []);

  const handleLogout = useCallback(async () => {
    try {
      const { error } = await (await supabase).auth.signOut();
      if (error) throw error;
      navigate("/");
      setIsMenuOpen(false);
    } catch (error) {
      console.error("Logout failed:", error);
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabaseClient = await supabase;
        const { data: { session } } = await supabaseClient.auth.getSession();
        setIsLoggedIn(!!session);

        if (session) {
          const { data: profile } = await supabaseClient
            .from("profiles")
            .select("type_of_user")
            .eq("id", session.user.id)
            .single();
          setUserType(profile?.type_of_user || null);
        }

        const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
          (_event, session) => {
            setIsLoggedIn(!!session);
            if (!session) setUserType(null);
          }
        );

        return () => subscription.unsubscribe();
      } catch (error) {
        console.error("Session check failed:", error);
        setIsLoggedIn(false);
      }
    };

    checkSession();
  }, []);

  if (isLoggedIn === null) {
    return <div className="h-16 bg-gradient-to-r from-slate-950/90 via-gray-900/90 to-slate-950/90" />;
  }

  return (
    <header 
      className="bg-gradient-to-r from-slate-950/90 via-gray-900/90 to-slate-950/90 text-white shadow-xl border-b border-indigo-500/20 backdrop-blur-sm sticky top-0 z-50"
      role="banner"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 relative z-50">
          <div className="flex-shrink-0 min-w-[120px]">
            <Logo />
          </div>

          <nav className="hidden lg:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <NavLink
                key={item.path}
                item={item}
                isLoggedIn={isLoggedIn}
                onClick={() => setIsMenuOpen(false)}
              />
            ))}
            <AuthButton 
              isLoggedIn={isLoggedIn} 
              onLogout={handleLogout}
              onClick={() => setIsMenuOpen(false)}
            />
          </nav>

          <button
            className="lg:hidden rounded-full p-2.5 hover:bg-white/10 transition-colors duration-300 border border-indigo-500/20"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-expanded={isMenuOpen}
            aria-label="Toggle navigation menu"
            aria-controls="mobile-menu"
          >
            <div className="w-6 h-6 relative -ml-0.5 flex flex-col justify-center gap-2">
              <span
                className={`block h-0.5 bg-gradient-to-r from-white to-indigo-600 rounded-full transform transition-all duration-600 ease-out origin-right ${
                  isMenuOpen ? 'w-6 -rotate-45 translate-y-0.5' : 'w-6'
                }`}
              />
              <span
                className={`block h-0.5 bg-gradient-to-r from-white to-indigo-600 rounded-full transform transition-all duration-200 ease-out ${
                  isMenuOpen ? 'w-0 opacity-0' : 'w-4 opacity-100'
                }`}
              />
              <span
                className={`block h-0.5 bg-gradient-to-r from-white to-indigo-600 rounded-full transform transition-all duration-200 ease-out origin-right ${
                  isMenuOpen ? 'w-6 rotate-45 -translate-y-0.5' : 'w-2.5'
                }`}
              />
            </div>
          </button>
        </div>

        {isMenuOpen && (
          <div 
            className="lg:hidden"
            id="mobile-menu"
            role="navigation"
            aria-label="Mobile navigation"
          >
            <div
              className="fixed inset-0 top-16 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-out"
              aria-hidden="true"
              onClick={() => setIsMenuOpen(false)}
            />

            <div className="absolute inset-x-0 top-full">
              <div className={`
                mx-4 my-2 
                overflow-hidden 
                rounded-2xl 
                bg-gradient-to-b from-slate-900/85 to-black/85 
                backdrop-blur-xl 
                border border-indigo-500/20 
                shadow-2xl
                transition-all duration-300 ease-out
                transform origin-top
                ${isMenuOpen ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0'}
              `}>
                <div className="relative py-4 flex flex-col space-y-3">
                  {navigationItems.map((item) => {
                    if (item.requiresAuth && !isLoggedIn) return null;
                    return (
                      <div key={item.path} className="px-4">
                        <NavLink
                          item={item}
                          isLoggedIn={isLoggedIn}
                          onClick={() => setIsMenuOpen(false)}
                        />
                      </div>
                    );
                  })}

                  <div className="px-4 pt-2">
                    <AuthButton 
                      isLoggedIn={isLoggedIn} 
                      onLogout={handleLogout}
                      isMobile 
                      onClick={() => setIsMenuOpen(false)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
});

Navbar.displayName = 'Navbar';

export default Navbar;
