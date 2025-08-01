import {
  createContext,
  ReactNode,
  useContext,
  useState,
  useEffect,
} from "react";
import { ProdutorAcesso, Usuario } from "../types/geral";
import { apiGeral } from "../lib/geral";

interface AuthContextProps {
  user: Usuario | null;
  setAuth: (user: Usuario | null) => void;
  isProdutor: boolean;
  isValidador: boolean;
  isCliente: boolean;
  isAdministrador: boolean;
  visitasNoSite: number;
  isPDV: boolean;
}

const AuthContext = createContext({} as AuthContextProps);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Usuario | null>(null);

  // Estados para papéis
  const [isProdutor, setIsProdutor] = useState(false);
  const [isValidador, setIsValidador] = useState(false);
  const [isCliente, setIsCliente] = useState(false);
  const [isAdministrador, setIsAdministrador] = useState(false);
  const [isPDV, setIsPDV] = useState(false);
  const [visitasNoSite, setVisitasNoSite] = useState(0);

  function setAuth(user: Usuario | null) {
    setUser(user);
  }

  useEffect(() => {
    const carregarPerfil = async () => {
      if (user?.id) {
        try {
          if (user?.admGeral) {
            setIsAdministrador(true);
          } else {
            const response = await apiGeral.getResource<ProdutorAcesso>(
              "/produtoracesso",
              {
                filters: { idUsuario: user.id },
                pageSize: 1,
              }
            );

            const acesso = response.data?.[0];
            if (acesso) {
              setIsProdutor(
                acesso.tipoAcesso === "Administrador" ? true : false
              );
              setIsValidador(acesso.tipoAcesso === "Validador" ? true : false);
              setIsPDV(acesso.tipoAcesso === "PDV" ? true : false);
            } else {
              setIsCliente(true);
            }
          }
        } catch (error) {
          console.error("Erro ao carregar perfil do usuário:", error);
        }
      } else {
        // Resetar se fizer logout
        setIsProdutor(false);
        setIsValidador(false);
        setIsCliente(true);
        setIsAdministrador(false);
        setIsPDV(false);
      }
    };

    carregarPerfil();
  }, [user]);

  // 👇 Registrar visita ao carregar o app
  useEffect(() => {
    const registrarVisita = async () => {
      try {
        const response = await apiGeral.createResource<any>(
          "/visitasnosite",
          {}
        );

        console.log("visita registrada:", response);

        if (response?.data?.visitasNoSite !== undefined) {
          setVisitasNoSite(response.data.visitasNoSite);
        }
      } catch (error) {
        console.error("Erro ao registrar visita:", error);
      }
    };

    registrarVisita();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        setAuth,
        isProdutor,
        isValidador,
        isCliente,
        isAdministrador,
        visitasNoSite,
        isPDV,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
