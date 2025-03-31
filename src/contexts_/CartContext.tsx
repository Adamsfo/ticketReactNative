import React, { createContext, useReducer, useContext } from "react";
import { EventoIngresso, Ingresso, Transacao } from "../types/geral";

interface CartItem {
  id: number;
  qtde: number;
  eventoIngresso: EventoIngresso;
}

interface CartState {
  items: CartItem[];
  // ingressos: Ingresso[];
  transacao: Transacao | null;
}

interface CartProviderProps {
  children: React.ReactNode;
}

type CartAction =
  | { type: "ADD_ITEM"; item: CartItem }
  | { type: "REMOVE_ITEM"; id: number }
  | { type: "UPDATE_QUANTITY"; id: number; qtde: number }
  // | { type: "ADD_INGRESSO"; ingresso: Ingresso }
  // | { type: "UPDATE_INGRESSO"; ingressoId: number; ingresso: Ingresso }
  | { type: "ADD_TRANSACAO"; transacao: Transacao };

const CartContext = createContext<
  { state: CartState; dispatch: React.Dispatch<CartAction> } | undefined
>(undefined);

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case "ADD_ITEM":
      const existingItem = state.items.find(
        (item) => item.id === action.item.id
      );

      if (existingItem) {
        return {
          ...state,
          items: state.items.map((item) =>
            item.id === action.item.id
              ? { ...item, qtde: action.item.qtde }
              : item
          ),
        };
      }

      return {
        ...state,
        items: [...state.items, action.item],
      };
    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.id),
      };
    case "UPDATE_QUANTITY":
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.id ? { ...item, qtde: action.qtde } : item
        ),
      };
    // case "ADD_INGRESSO":
    //   return {
    //     ...state,
    //     ingressos: [...state.ingressos, action.ingresso],
    //   };
    // case "UPDATE_INGRESSO":
    //   return {
    //     ...state,
    //     ingressos: state.ingressos.map((ingresso) =>
    //       ingresso.id === action.ingressoId ? action.ingresso : ingresso
    //     ),
    //   };
    case "ADD_TRANSACAO":
      return {
        ...state,
        transacao: action.transacao,
      };
    default:
      return state;
  }
};

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    // ingressos: [],
    transacao: null,
  });

  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
