import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  clearStoredToken,
  getStoredToken,
  storeToken,
} from "../api/api";

import {
  loginUser,
  registerPatient,
  registerPhysiotherapist,
  getCurrentUser,
} from "../api/auth";

import AuthContext from "./authContext";
const UNAUTHORIZED_EVENT = "movexa:unauthorized";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(getStoredToken);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    clearStoredToken();
    setToken(null);
    setUser(null);
  }, []);

  const acceptAuthentication = useCallback((result) => {
    if (!result?.access_token || !result?.user) {
      throw new Error("The server returned an incomplete login response.");
    }

    // Persist first. Do not mark the user authenticated if persistence fails.
    storeToken(result.access_token);
    setToken(result.access_token);
    setUser(result.user);

    return result.user;
  }, []);

  const login = useCallback(
    async (credentials) => {
      const result = await loginUser(credentials);
      return acceptAuthentication(result);
    },
    [acceptAuthentication]
  );

  const register = useCallback(
    async (role, data) => {
      let result;

      if (role === "patient") {
        result = await registerPatient(data);
      } else if (role === "physio") {
        result = await registerPhysiotherapist(data);
      } else {
        throw new Error("Invalid registration role.");
      }

      return acceptAuthentication(result);
    },
    [acceptAuthentication]
  );

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);

    return () => {
      window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    };
  }, [logout]);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      const savedToken = getStoredToken();

      if (!savedToken) {
        if (active) {
          setToken(null);
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const currentUser = await getCurrentUser();

        if (active) {
          setUser(currentUser);
          setToken(savedToken);
        }
      } catch {
        if (active) {
          clearStoredToken();
          setToken(null);
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(user && token),
      login,
      register,
      logout,
    }),
    [user, token, loading, login, register, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
