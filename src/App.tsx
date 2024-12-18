import { Route, Routes, Navigate } from "react-router-dom";
import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  Suspense,
  lazy,
} from "react";
import LoadingSpinner from "./components/LoadingSpinner";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { supabase } from "./lib/supabase.ts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import NotFound from "./pages/NotFound";
import { AuthChangeEvent, Session } from "@supabase/gotrue-js";
import Documentation from "./pages/Documentation";
import { HelmetProvider } from 'react-helmet-async';

const queryClient = new QueryClient();

// Lazy load all pages
const Home = lazy(() => import("./pages/Home.tsx"));
const Login = lazy(() => import("./pages/Login.tsx"));
const Register = lazy(() => import("./pages/Register.tsx"));
const Profile = lazy(() => import("./pages/Profile.tsx"));
const Contact = lazy(() => import("./pages/Contact.tsx"));
const Terms = lazy(() => import("./components/Terms.tsx"));
const Privacy = lazy(() => import("./components/Privacy.tsx"));
const ReminderSettings = lazy(() => import("./pages/ReminderSettings.tsx"));
const Price = lazy(() => import("./pages/Price.tsx"));
const Emailconfirmed = lazy(() => import("./pages/Auth.tsx"));
const Maintenance = lazy(() => import("./pages/Maintanence.tsx"));
const Dashboard = lazy(() => import("./pages/Dash.tsx"));
const Admin = lazy(() => import("./pages/Admin.tsx"));

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isInMaintenance, setIsInMaintenance] = useState(false);

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const { data, error } = await (await supabase)
          .from("system_settings")
          .select("value")
          .eq("key", "maintenance_mode");

        if (error) throw error;
        setIsInMaintenance(data?.[0]?.value || false);
      } catch (error) {
        console.error("Error checking maintenance:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkMaintenance();
  }, []);

  if (isLoading) return <LoadingSpinner text="Checking system status..." />;
  if (isInMaintenance) return <Maintenance />;
  return <>{children}</>;
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const {
        data: { session },
        error,
      } = await (await supabase).auth.getSession();
      if (error) throw error;
      setIsAuthenticated(!!session);
    } catch (error) {
      console.error("Error checking authentication:", error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();

    let subscription: { unsubscribe: () => void };

    (async () => {
      const supabaseClient = await supabase;
      const { data } = supabaseClient.auth.onAuthStateChange(
        (_event: AuthChangeEvent, session: Session | null) => {
          setIsAuthenticated(!!session);
          setIsLoading(false);
        }
      );
      subscription = data.subscription;
    })();

    return () => subscription?.unsubscribe();
  }, [checkAuth]);

  const routes = useMemo(
    () => [
      {
        path: "/",
        element: (
          <Suspense fallback={<LoadingSpinner text="Loading Home..." />}>
            <Home />
          </Suspense>
        ),
      },
      {
        path: "/contact",
        element: (
          <Suspense fallback={<LoadingSpinner text="Loading Contact..." />}>
            <Contact />
          </Suspense>
        ),
      },
      {
        path: "/login",
        element: isAuthenticated ? (
          <Navigate to="/profile" />
        ) : (
          <Suspense fallback={<LoadingSpinner text="Loading Login..." />}>
            <Login />
          </Suspense>
        ),
      },
      {
        path: "/register",
        element: isAuthenticated ? (
          <Navigate to="/profile" />
        ) : (
          <Suspense fallback={<LoadingSpinner text="Loading Register..." />}>
            <Register />
          </Suspense>
        ),
      },
      {
        path: "/profile",
        element: isAuthenticated ? (
          <Suspense fallback={<LoadingSpinner text="Loading Profile..." />}>
            <Profile />
          </Suspense>
        ) : (
          <Navigate to="/login" />
        ),
      },
      {
        path: "/admin",
        element: isAuthenticated ? (
          <Suspense fallback={<LoadingSpinner text="Loading Admin..." />}>
            <Admin />
          </Suspense>
        ) : (
          <Navigate to="/login" />
        ),
      },
      {
        path: "/terms",
        element: (
          <Suspense fallback={<LoadingSpinner text="Loading Terms..." />}>
            <Terms />
          </Suspense>
        ),
      },
      {
        path: "/privacy",
        element: (
          <Suspense fallback={<LoadingSpinner text="Loading Privacy..." />}>
            <Privacy />
          </Suspense>
        ),
      },
      {
        path: "/documentation",
        element: <Documentation />,
      },
      {
        path: "/auth",
        element: (
          <Suspense
            fallback={<LoadingSpinner text="Loading Emailconfirmed..." />}
          >
            <Emailconfirmed />
          </Suspense>
        ),
      },
      {
        path: "/price",
        element: (
          <Suspense fallback={<LoadingSpinner text="Loading Price..." />}>
            <Price />
          </Suspense>
        ),
      },
      {
        path: "/dashboard",
        element: isAuthenticated ? (
          <Suspense fallback={<LoadingSpinner text="Loading Dashboard..." />}>
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          </Suspense>
        ) : (
          <Navigate to="/login" />
        ),
      },
      {
        path: "/reminder-settings",
        element: (
          <Suspense
            fallback={<LoadingSpinner text="Loading Reminder Settings..." />}
          >
            <ReminderSettings />
          </Suspense>
        ),
      },
      {
        path: "*",
        element: <NotFound />,
      },
    ],
    [isAuthenticated]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 flex items-center justify-center">
        <LoadingSpinner text="Initializing App..." />
      </div>
    );
  }

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 flex flex-col">
          <Navbar />
          <div className="flex-grow">
            <Suspense fallback={<LoadingSpinner text="Loading..." />}>
              <Routes>
                {routes.map(({ path, element }) => (
                  <Route key={path} path={path} element={element} />
                ))}
              </Routes>
            </Suspense>
          </div>
          <Footer />
        </div>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
