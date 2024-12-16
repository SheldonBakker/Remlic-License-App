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
import { AuthChangeEvent, Session } from "@supabase/supabase-js";

const queryClient = new QueryClient();

// Lazy load all pages
const Home = lazy(() => import("./pages/Home.tsx"));
const Login = lazy(() => import("./pages/Login.tsx"));
const Register = lazy(() => import("./pages/Register.tsx"));
const Profile = lazy(() => import("./pages/Profile.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const Contact = lazy(() => import("./pages/Contact.tsx"));
const Terms = lazy(() => import("./components/Terms.tsx"));
const Privacy = lazy(() => import("./components/Privacy.tsx"));
const Documentation = lazy(() => import("./pages/Documentation.tsx"));
const ReminderSettings = lazy(() => import("./pages/ReminderSettings.tsx"));
const Price = lazy(() => import("./pages/Price.tsx"));
const Emailconfirmed = lazy(() => import("./pages/Auth.tsx"));
const Launch = lazy(() => import("./pages/Launch.tsx"));

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  const launchDate = useMemo(() => new Date("2025-01-16T00:00:00"), []);
  const isBeforeLaunch = useMemo(() => new Date() < launchDate, [launchDate]);

  // Update checkAuth to handle errors more gracefully
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
        element: (
          <Suspense
            fallback={<LoadingSpinner text="Loading Documentation..." />}
          >
            <Documentation />
          </Suspense>
        ),
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
            <Dashboard />
          </Suspense>
        ) : (
          <Navigate to="/login" />
        ),
      },
      {
        path: "/reminder-settings",
        element: isAuthenticated ? (
          <Suspense
            fallback={<LoadingSpinner text="Loading Reminder Settings..." />}
          >
            <ReminderSettings />
          </Suspense>
        ) : (
          <Navigate to="/login" />
        ),
      },
      {
        path: "/launch",
        element: (
          <Suspense fallback={<LoadingSpinner text="Loading Launch..." />}>
            <Launch />
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

  // Add error boundary for loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 flex items-center justify-center">
        <LoadingSpinner text="Initializing App..." />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 flex flex-col">
        <Navbar />
        <div className="flex-grow">
          <Suspense fallback={<LoadingSpinner text="Loading..." />}>
            <Routes>
              {isBeforeLaunch ? (
                <Route path="*" element={<Launch />} />
              ) : (
                routes.map(({ path, element }) => (
                  <Route key={path} path={path} element={element} />
                ))
              )}
            </Routes>
          </Suspense>
        </div>
        <Footer />
      </div>
    </QueryClientProvider>
  );
};

export default App;
