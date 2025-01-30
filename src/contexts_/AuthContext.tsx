import { createContext, ReactNode, useContext, useState } from "react";
import { Usuario } from "../types/geral";

interface AuthContextProps {
  user: Usuario | null;
  setAuth: (user: Usuario | null) => void;
}

const AuthContext = createContext({} as AuthContextProps);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Usuario | null>(null);

  function setAuth(user: Usuario | null) {
    setUser(user);
  }

  return (
    <AuthContext.Provider value={{ user, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
