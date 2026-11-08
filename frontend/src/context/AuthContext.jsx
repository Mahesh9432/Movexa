
import {
  createContext,
  useCallback,
  useContext,
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

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(getStoredToken);
  const [loading, setLoading] = useState(true);

  const acceptAuthentication = useCallback((result) => {
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
        throw new Error("Invalid registration role");
      }

      return acceptAuthentication(result);
    },
    [acceptAuthentication]
  );

  const logout = useCallback(() => {
    clearStoredToken();
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      const savedToken = getStoredToken();

      if (!savedToken) {
        setLoading(false);
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

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}
