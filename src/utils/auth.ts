import { supabase } from "../lib/supabase";

const TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000; // 5 minutes in milliseconds

export const getTokens = async () => {
  const {
    data: { session },
  } = await (await supabase).auth.getSession();

  if (session?.access_token) {
    // Check if token needs refresh
    const lastRefresh = localStorage.getItem("lastTokenRefresh");
    const tokenAge = lastRefresh
      ? Date.now() - parseInt(lastRefresh)
      : Infinity;

    if (tokenAge > TOKEN_EXPIRY_BUFFER) {
      // Token is aging, refresh it proactively
      return refreshToken();
    }
  }

  return {
    jwt: session?.access_token ?? null,
    refreshToken: session?.refresh_token ?? null,
  };
};

export const refreshToken = async () => {
  try {
    const {
      data: { session },
      error,
    } = await (await supabase).auth.refreshSession();

    if (error) throw error;

    if (session?.access_token) {
      localStorage.setItem("lastTokenRefresh", Date.now().toString());
      return session.access_token;
    }

    throw new Error("No token received during refresh");
  } catch (error) {
    console.error("Token refresh failed:", error);
    // Clear invalid session
    await clearTokens();
    throw error;
  }
};

export const clearTokens = async () => {
  localStorage.removeItem("lastTokenRefresh");
  await (await supabase).auth.signOut();
};
