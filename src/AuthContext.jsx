import { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

// We'll store the JWT token on the client and send it via the Authorization
// header with every request.

const AuthContext = createContext();
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";
console.log("API_URL:", process.env.REACT_APP_API_URL);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  // Whenever the token changes configure axios and fetch the current user
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      axios
        .get(API_URL + "/auth/me")
        .then((res) => setUser(res.data))
        .catch((err) => {
          if (err.response?.status !== 401) {
            console.error("Fehler bei /auth/me:", err);
          }
          setUser(null);
        });
    } else {
      delete axios.defaults.headers.common["Authorization"];
      setUser(null);
    }
  }, [token]);


  const refreshUser = async () => {
    try {
      const res = await axios.get(API_URL+"/auth/me");
      setUser(res.data);
    } catch (err) {
      console.error("Fehler beim Aktualisieren des Users:", err);
      setUser(null);
    }
  };

  // Login-Funktion ruft den Login-Endpoint auf und speichert das JWT
  const login = async (username, password) => {
    try {
      const res = await axios.post(API_URL + "/auth/login", { username, password });
      const newToken = res.data.token;
  
      // ✅ Immediately set axios header so next requests (like /auth/me) include it
      axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
  
      setToken(newToken);
      localStorage.setItem("token", newToken);
    } catch (err) {
      setToken(null);
      localStorage.removeItem("token");
      throw err;
    }
  };

  const register = async (username, password) => {
    try {
      const res = await axios.post(API_URL + "/auth/register", { username, password });
      const newToken = res.data.token;
  
      // ✅ Set the header here too
      axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
  
      setToken(newToken);
      localStorage.setItem("token", newToken);
    } catch (err) {
      setToken(null);
      localStorage.removeItem("token");
      throw err;
    }
  };

  // Logout-Funktion entfernt das gespeicherte Token
  const logout = async () => {
    try {
      await axios.post(API_URL + "/auth/logout");
    } catch (_) {
      // ignore errors during logout
    }
    setToken(null);
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
