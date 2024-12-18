import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Transition } from "@headlessui/react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [, setUserType] = useState<string | null>(null);
  const navigate = useNavigate();

  // Add this navigation items array
  const navigationItems = [
    { name: "Home", path: "/", requiresAuth: false },
    { name: "Profile", path: "/profile", requiresAuth: true },
    { name: "Dashboard", path: "/dashboard", requiresAuth: true },
    {
      name: "Reminder Settings",
      path: "/reminder-settings",
      requiresAuth: true,
    },
    { name: "Price", path: "/price", requiresAuth: false },
    { name: "Documentation", path: "/documentation", requiresAuth: false },
    { name: "Contact", path: "/contact", requiresAuth: false },
  ];

  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabaseClient = await supabase;
        const {
          data: { session },
        } = await supabaseClient.auth.getSession();
        setIsLoggedIn(!!session);

        if (session) {
          const { data: profile } = await supabaseClient
            .from("profiles")
            .select("type_of_user")
            .eq("id", session.user.id)
            .single();
          setUserType(profile?.type_of_user || null);
        }

        // Set up auth listener
        const {
          data: { subscription },
        } = supabaseClient.auth.onAuthStateChange(
          (_event, session) => {
            setIsLoggedIn(!!session);
            if (!session) {
              setUserType(null);
            }
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

  const handleLogout = async () => {
    try {
      const { error } = await (await supabase).auth.signOut();
      if (error) throw error;
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
      navigate("/");
    }
  };

  if (isLoggedIn === null) {
    return (
      <div className="h-16 bg-gradient-to-r from-slate-950/90 via-gray-900/90 to-slate-950/90" />
    );
  }

  return (
    <header className="bg-gradient-to-r from-slate-950/90 via-gray-900/90 to-slate-950/90 text-white shadow-xl border-b border-indigo-500/20 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 relative z-50">
          <div className="flex items-center space-x-3 group">
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
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => {
              if (item.requiresAuth && !isLoggedIn) {
                return null;
              }
              return (
                <Link
                  key={item.path}
                  className="relative font-medium text-gray-300 hover:text-white transition-all duration-300 
                    after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 
                    after:bottom-0 after:left-0 after:bg-gradient-to-r after:from-blue-500 after:to-purple-600 
                    after:transition-transform hover:after:scale-x-100"
                  to={item.path}
                >
                  {item.name}
                </Link>
              );
            })}
            {isLoggedIn ? (
              <button
                className="bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2 rounded-xl font-medium 
                  hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 
                  active:scale-95 shadow-lg hover:shadow-blue-500/25 hover:ring-2 hover:ring-blue-500/20
                  border border-white/10"
                onClick={handleLogout}
              >
                Logout
              </button>
            ) : (
              <Link
                to="/login"
                className="bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2 rounded-xl font-medium 
                  hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 
                  active:scale-95 shadow-lg hover:shadow-blue-500/25 hover:ring-2 hover:ring-blue-500/20
                  border border-white/10"
              >
                Login
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              className="rounded-full p-2.5 hover:bg-white/10 transition-colors duration-300 border border-indigo-500/20"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-expanded={isMenuOpen}
              aria-label="Toggle navigation menu"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  className={`transform origin-center transition-all duration-300 ${
                    isMenuOpen ? 'translate-y-[7px] rotate-45' : ''
                  }`}
                  d="M3 6h18"
                />
                <path
                  className={`transition-opacity duration-300 ${
                    isMenuOpen ? 'opacity-0' : 'opacity-100'
                  }`}
                  d="M3 12h18"
                />
                <path
                  className={`transform origin-center transition-all duration-300 ${
                    isMenuOpen ? '-translate-y-[7px] -rotate-45' : ''
                  }`}
                  d="M3 18h18"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <Transition
          show={isMenuOpen}
          enter="transition-all duration-300 ease-out"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="transition-all duration-200 ease-in"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
          as="div"
          className="md:hidden"
        >
          {/* Backdrop */}
          <Transition.Child
            as="div"
            enter="transition-opacity duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            className="fixed inset-0 top-16 bg-black/60 backdrop-blur-sm md:hidden"
            aria-hidden="true"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Mobile Navigation Menu */}
          <Transition.Child
            as="div"
            enter="transition-all duration-300"
            enterFrom="opacity-0 translate-y-4"
            enterTo="opacity-100 translate-y-0"
            leave="transition-all duration-200"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-4"
            className="absolute inset-x-0 top-full md:hidden"
          >
            <div className="mx-4 my-2 overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/85 to-black/85 backdrop-blur-xl border border-indigo-500/20 shadow-2xl">
              <div className="relative py-4">
                {navigationItems.map((item) => {
                  if (item.requiresAuth && !isLoggedIn) return null;
                  return (
                    <Link
                      key={item.path}
                      className="px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white 
                        hover:bg-white/10 active:bg-white/20 transition-all duration-300 mx-2 rounded-xl 
                        flex items-center space-x-3"
                      to={item.path}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"></span>
                      <span>{item.name}</span>
                    </Link>
                  );
                })}

                {/* Auth Button */}
                <div className="px-4 pt-3">
                  {isLoggedIn ? (
                    <button
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2.5 rounded-xl 
                        text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 
                        shadow-lg hover:shadow-blue-500/25 flex items-center justify-center space-x-2 
                        border border-indigo-500/20"
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                    >
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
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                      </svg>
                    </button>
                  ) : (
                    <Link
                      to="/login"
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2.5 
                        rounded-xl text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all 
                        duration-300 shadow-lg hover:shadow-blue-500/25 flex items-center justify-center 
                        space-x-2 border border-indigo-500/20"
                      onClick={() => setIsMenuOpen(false)}
                    >
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
                          d="M14 5l7 7m0 0l-7 7m7-7H3"
                        />
                      </svg>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </Transition.Child>
        </Transition>
      </div>
    </header>
  );
};

export default Navbar;
