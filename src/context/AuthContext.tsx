import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { jwtDecode } from "jwt-decode";
import api from "@/lib/api";

interface User {
  id: number;
  email: string;
  name: string;
  role: "ADMIN" | "USER";
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: (onLogout?: () => void) => void; // ✅ optional callback for clearing cart
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Load user from token on app start
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        const role =
          Array.isArray(decoded.roles) && decoded.roles.length > 0
            ? decoded.roles[0].replace("ROLE_", "").toUpperCase()
            : "USER";

        setUser({
          id: decoded.id || decoded.sub || 0,
          email: decoded.sub || decoded.email,
          name: decoded.name || "",
          role: role as "ADMIN" | "USER",
        });
      } catch (error) {
        console.error("Invalid token:", error);
        localStorage.removeItem("token");
      }
    }
    setIsLoading(false);
  }, []);

  // ✅ Login
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await api.post("/auth/signin", { email, password });
      const data = response.data;

      const token = data.accessToken;
      localStorage.setItem("token", token);

      const decoded: any = jwtDecode(token);
      const role =
        Array.isArray(decoded.roles) && decoded.roles.length > 0
          ? decoded.roles[0].replace("ROLE_", "").toUpperCase()
          : "USER";

      const userData: User = {
        id: data.id,
        email: data.email,
        name: data.name || "",
        role: role as "ADMIN" | "USER",
      };

      setUser(userData);
    } catch (error: any) {
      console.error("Login failed:", error.response?.data || error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Register
  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      await api.post("/auth/signup", {
        name,
        email,
        password,
        confirmPassword: password,
      });
      await login(email, password);
    } catch (error: any) {
      console.error("Registration failed:", error.response?.data || error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Logout - optional callback for clearing cart
  const logout = (onLogout?: () => void) => {
    localStorage.removeItem("token");
    setUser(null);
    if (onLogout) onLogout(); // ✅ safely clear cart externally
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
