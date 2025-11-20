import { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      
      axios.get(API_URL + "/auth/me")
        .then((res) => {
          setUser(res.data);
        })
        .catch((err) => {
          console.error("Auth initialization failed:", err);
          localStorage.removeItem("token");
          setToken(null);
          setUser(null);
        });
    } else {
      delete axios.defaults.headers.common["Authorization"];
      setUser(null);
    }
  }, [token]);

  const refreshUser = async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/me`);
      setUser(res.data);
    } catch (error) {
      console.error("Fehler beim Aktualisieren des Benutzers:", error);
    }
  };

  const login = async (username, password, recaptchaToken = null) => {
    try {
      const payload = { username, password };
      
      // Nur recaptchaToken hinzufügen wenn vorhanden
      if (recaptchaToken) {
        payload.recaptchaToken = recaptchaToken;
      }
      
      const res = await axios.post(API_URL + "/auth/login", payload);
      const newToken = res.data.token;
      axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
      setToken(newToken);
      localStorage.setItem("token", newToken);
    } catch (err) {
      setToken(null);
      localStorage.removeItem("token");
      throw err;
    }
  };

  const register = async (username, email, password, recaptchaToken) => {
    try {
      const res = await axios.post(API_URL + "/auth/register", { 
        username, 
        email, 
        password,
        recaptchaToken 
      });
      const newToken = res.data.token;
      axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
      setToken(newToken);
      localStorage.setItem("token", newToken);
    } catch (err) {
      setToken(null);
      localStorage.removeItem("token");
      throw err;
    }
  };

  const registerWithScore = async (username, email, password, score, recaptchaToken) => {
    try {
      const res = await axios.post(API_URL + "/auth/register-with-score", { 
        username, 
        email, 
        password, 
        score,
        recaptchaToken 
      });
      const newToken = res.data.token;
      axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
      setToken(newToken);
      localStorage.setItem("token", newToken);
      setUser(res.data.user);
      return res.data.user;
    } catch (err) {
      setToken(null);
      localStorage.removeItem("token");
      throw err;
    }
  };

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
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      register, 
      registerWithScore,
      setUser, 
      refreshUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);