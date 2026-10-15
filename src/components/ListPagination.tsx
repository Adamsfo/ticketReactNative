import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import colors from "@/src/constants/colors";

export function buildPaginationItems(
  currentPage: number,
  totalPages: number,
): Array<number | "ellipsis"> {
  if (totalPages <= 1) return [];
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items: Array<number | "ellipsis"> = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) items.push("ellipsis");
  for (let page = start; page <= end; page += 1) {
    items.push(page);
  }
  if (end < totalPages - 1) items.push("ellipsis");
  items.push(totalPages);

  return items;
}

type ListPaginationProps = {
  page: number;
  totalPages: number;
  totalItems: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
  itemLabelSingular: string;
  itemLabelPlural: string;
};

export default function ListPagination({
  page,
  totalPages,
  totalItems,
  loading = false,
  onPageChange,
  itemLabelSingular,
  itemLabelPlural,
}: ListPaginationProps) {
  const paginationItems = useMemo(
    () => buildPaginationItems(page, totalPages),
    [page, totalPages],
  );

  if (totalPages <= 1 && totalItems === 0) {
    return null;
  }

  const podeAnterior = page > 1 && !loading;
  const podeProxima = page < totalPages && !loading;
  const totalLabel =
    totalItems === 1 ? itemLabelSingular : itemLabelPlural;

  return (
    <View style={styles.paginacaoBox}>
      <Text style={styles.paginacaoResumo}>
        Página {page} de {Math.max(totalPages, 1)}
      </Text>
      <Text style={styles.paginacaoTotal}>
        {totalItems} {totalLabel}
      </Text>

      {totalPages > 1 ? (
        <View style={styles.paginacaoControles}>
          <TouchableOpacity
            style={[
              styles.paginacaoNavBtn,
              !podeAnterior && styles.paginacaoNavBtnDisabled,
            ]}
            onPress={() => onPageChange(page - 1)}
            disabled={!podeAnterior}
          >
            <Text
              style={[
                styles.paginacaoNavTexto,
                !podeAnterior && styles.paginacaoNavTextoDisabled,
              ]}
            >
              Anterior
            </Text>
          </TouchableOpacity>

          <View style={styles.paginacaoNumeros}>
            {paginationItems.map((item, index) =>
              item === "ellipsis" ? (
                <Text key={`ellipsis-${index}`} style={styles.paginacaoEllipsis}>
                  ...
                </Text>
              ) : (
                <TouchableOpacity
                  key={`page-${item}`}
                  style={[
                    styles.paginacaoNumeroBtn,
                    item === page && styles.paginacaoNumeroBtnAtivo,
                  ]}
                  onPress={() => onPageChange(item)}
                  disabled={loading || item === page}
                >
                  <Text
                    style={[
                      styles.paginacaoNumeroTexto,
                      item === page && styles.paginacaoNumeroTextoAtivo,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ),
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.paginacaoNavBtn,
              !podeProxima && styles.paginacaoNavBtnDisabled,
            ]}
            onPress={() => onPageChange(page + 1)}
            disabled={!podeProxima}
          >
            <Text
              style={[
                styles.paginacaoNavTexto,
                !podeProxima && styles.paginacaoNavTextoDisabled,
              ]}
            >
              Próxima
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  paginacaoBox: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
    gap: 4,
  },
  paginacaoResumo: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.cinza,
  },
  paginacaoTotal: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  paginacaoControles: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    flexWrap: "wrap",
  },
  paginacaoNavBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(0,115,230,0.08)",
  },
  paginacaoNavBtnDisabled: {
    opacity: 0.45,
  },
  paginacaoNavTexto: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.azul,
  },
  paginacaoNavTextoDisabled: {
    color: "#888",
  },
  paginacaoNumeros: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 4,
    flex: 1,
  },
  paginacaoNumeroBtn: {
    minWidth: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  paginacaoNumeroBtnAtivo: {
    backgroundColor: colors.azul,
  },
  paginacaoNumeroTexto: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.cinza,
  },
  paginacaoNumeroTextoAtivo: {
    color: colors.branco,
  },
  paginacaoEllipsis: {
    fontSize: 14,
    color: "#888",
    paddingHorizontal: 4,
  },
});
