import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import api from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore the session when the application starts.
  useEffect(() => {
    let active = true;

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
    };
  }, []);

  // Save the user returned by a successful login.
  const login = (userData) => {
    setUser(userData);
  };

  // Clear the frontend session after a successful logout.
  const logout = async () => {
    try {
      await api.post("/users/logout");
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