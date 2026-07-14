import React, { createContext, useContext, useReducer } from "react";
import { ItemCarrinhoHospedagem } from "@/src/components/ModalResumoPousada";
import {
  criarHospedesIniciais,
  HospedesSuiteForm,
} from "@/src/lib/hospedagemHospedes";

export type HospedagemReserva = {
  idEvento: number;
  checkin: string;
  checkout: string;
  itens: ItemCarrinhoHospedagem[];
  usuarioVendaPdvId: number | null;
};

type HospedagemState = {
  reserva: HospedagemReserva | null;
  hospedes: HospedesSuiteForm[];
  idReservaHospedagem: number | null;
  idTransacaoHospedagem: number | null;
};

type HospedagemAction =
  | {
      type: "SET_RESERVA";
      payload: {
        idEvento: number;
        checkin: string;
        checkout: string;
        itens: ItemCarrinhoHospedagem[];
        usuarioVendaPdvId?: number | null;
      };
    }
  | { type: "SET_HOSPEDES"; hospedes: HospedesSuiteForm[] }
  | {
      type: "SET_CHECKOUT_IDS";
      idReservaHospedagem: number;
      idTransacaoHospedagem: number;
    }
  | { type: "CLEAR" };

const estadoInicial: HospedagemState = {
  reserva: null,
  hospedes: [],
  idReservaHospedagem: null,
  idTransacaoHospedagem: null,
};

const HospedagemContext = createContext<
  | {
      state: HospedagemState;
      dispatch: React.Dispatch<HospedagemAction>;
    }
  | undefined
>(undefined);

function hospedagemReducer(
  state: HospedagemState,
  action: HospedagemAction,
): HospedagemState {
  switch (action.type) {
    case "SET_RESERVA":
      // Nova reserva: zera IDs e recria hóspedes somente a partir dos itens atuais
      return {
        reserva: {
          idEvento: action.payload.idEvento,
          checkin: action.payload.checkin,
          checkout: action.payload.checkout,
          itens: action.payload.itens,
          usuarioVendaPdvId: action.payload.usuarioVendaPdvId ?? null,
        },
        hospedes: criarHospedesIniciais(action.payload.itens),
        idReservaHospedagem: null,
        idTransacaoHospedagem: null,
      };
    case "SET_HOSPEDES":
      return {
        ...state,
        hospedes: action.hospedes,
      };
    case "SET_CHECKOUT_IDS":
      return {
        ...state,
        idReservaHospedagem: action.idReservaHospedagem,
        idTransacaoHospedagem: action.idTransacaoHospedagem,
      };
    case "CLEAR":
      return { ...estadoInicial };
    default:
      return state;
  }
}

export const HospedagemProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(hospedagemReducer, estadoInicial);

  return (
    <HospedagemContext.Provider value={{ state, dispatch }}>
      {children}
    </HospedagemContext.Provider>
  );
};

export const useHospedagem = () => {
  const context = useContext(HospedagemContext);
  if (!context) {
    throw new Error("useHospedagem must be used within a HospedagemProvider");
  }
  return context;
};

/** Chave estável das suítes da reserva atual (detecta troca de compra). */
export function chaveSuitesHospedagem(
  itens: ItemCarrinhoHospedagem[] | undefined | null,
): string {
  if (!itens?.length) return "";
  return itens
    .map(
      (item) =>
        `${item.idEventoSuite}:${item.nomeSuite}:${item.adultos}:${item.criancas}`,
    )
    .join("|");
}
