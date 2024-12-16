import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { User, AuthChangeEvent, Session } from "@supabase/supabase-js";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const client = await supabase;
        
        const {
          data: { session },
          error,
        } = await client.auth.getSession();

        if (error) throw error;

        setUser(session?.user ?? null);

        // Set up the auth state change listener
        const {
          data: { subscription },
        } = client.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
          setUser(session?.user ?? null);
        });

        // Return cleanup function
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Error fetching user:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, loading };
}
