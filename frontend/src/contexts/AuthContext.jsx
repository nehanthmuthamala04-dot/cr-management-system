import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { endpoints } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem("cr_token")));

  useEffect(() => {
    if (!localStorage.getItem("cr_token")) return;
    
    // Check if we have a cached user from dev-login
    const cachedUser = sessionStorage.getItem("cr_user");
    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser));
        setLoading(false);
        sessionStorage.removeItem("cr_user");
        return;
      } catch (e) {
        // Fall through to /me call
      }
    }
    
    // Create a timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      setLoading(false);  // Stop waiting and proceed with loading
    }, 3000);

    endpoints
      .me()
      .then(({ data }) => {
        clearTimeout(timeoutId);
        setUser(data);
        setLoading(false);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        // On error, don't clear the token - just proceed with loading
        // In dev mode, the user will still be authenticated
        setLoading(false);
      });
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      async login(credential) {
        const { data } = await endpoints.googleLogin(credential);
        localStorage.setItem("cr_token", data.accessToken);
        setUser(data.user);
      },
      async devLogin() {
        const { data } = await endpoints.devLogin();
        localStorage.setItem("cr_token", data.accessToken);
        sessionStorage.setItem("cr_user", JSON.stringify(data.user));
        setUser(data.user);
        setLoading(false);
      },
      logout() {
        localStorage.removeItem("cr_token");
        sessionStorage.removeItem("cr_user");
        setUser(null);
      },
      setUser,
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);