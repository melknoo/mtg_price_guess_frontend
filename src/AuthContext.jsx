import { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";
axios.defaults.withCredentials = true;

const AuthContext = createContext();
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";
console.log("API_URL:", process.env.REACT_APP_API_URL);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Beim Laden prüfen, ob ein eingeloggter User vorhanden ist (Token im Cookie)
  useEffect(() => {
    axios.get(API_URL+"/auth/me")
      .then((res) => setUser(res.data))
      .catch((err) => {
        if (err.response?.status !== 401) {
          console.error("Fehler bei /auth/me:", err);
        }
        setUser(null);
      });
  }, []);

  const refreshUser = async () => {
    try {
      const res = await axios.get(API_URL+"/auth/me");
      setUser(res.data);
    } catch (err) {
      console.error("Fehler beim Aktualisieren des Users:", err);
      setUser(null);
    }
  };

  // Login-Funktion ruft den Login-Endpoint auf
  const login = async (username, password) => {
    try {
      await axios.post(API_URL+"/auth/login", { username, password });
      // Token ist im HttpOnly-Cookie gespeichert, jetzt User abrufen
      const res = await axios.get(API_URL+"/auth/me");
      setUser(res.data);
    } catch (err) {
      setUser(null);
      throw err; // Fehler ggf. an UI weiterreichen
    }
  };

  const register = async (username, password) => {
    try {
      await axios.post(API_URL+"/auth/register", { username, password });
      // Nach erfolgreicher Registrierung automatisch einloggen
      const res = await axios.get(API_URL+"/auth/me");
      setUser(res.data);
    } catch (err) {
      setUser(null);
      throw err;
    }
  };

  // Logout-Funktion löscht das Cookie serverseitig
  const logout = async () => {
    await axios.post(API_URL+"/auth/logout");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
