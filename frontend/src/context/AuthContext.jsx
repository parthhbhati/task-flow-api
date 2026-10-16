import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import api, { getApiErrorMessage } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logoutError, setLogoutError] = useState("");

  // Restore the session when the application starts.
  useEffect(() => {
    let active = true;
    const handleSessionExpired = () => setUser(null);

    window.addEventListener("taskflow:session-expired", handleSessionExpired);

    async function restoreSession() {
      try {
        const response = await api.get("/users/current-user");

        if (active) {
          setUser(response.data?.data ?? null);
        }
      } catch (error) {
        if (active) {
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
      window.removeEventListener("taskflow:session-expired", handleSessionExpired);
    };
  }, []);

  // Save the user returned by a successful login.
  const login = (userData) => {
    setLogoutError("");
    setUser(userData);
  };

  // Clear the frontend session even if the server logout request fails.
  const logout = async () => {
    setLogoutError("");
    try {
      await api.post("/users/logout");
    } catch (error) {
      setLogoutError(getApiErrorMessage(error));
    } finally {
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    login,
    logout,
    logoutError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
