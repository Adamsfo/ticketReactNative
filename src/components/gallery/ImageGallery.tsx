import React, { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import colors from "@/src/constants/colors";
import PhotoCard, { GalleryPhotoItem } from "./PhotoCard";
import PhotoUploader from "./PhotoUploader";
import PhotoViewer from "./PhotoViewer";

export type ImageGalleryPhoto = GalleryPhotoItem & {
  /** id opcional do domínio (suite foto, etc.) — galeria não interpreta */
  id?: number | string;
};

type Props = {
  photos: ImageGalleryPhoto[];
  onUpload: (filenames: string[]) => void | Promise<void>;
  onSetPrincipal: (photo: ImageGalleryPhoto) => void | Promise<void>;
  onDelete: (photo: ImageGalleryPhoto) => void | Promise<void>;
  onMove: (
    photo: ImageGalleryPhoto,
    direcao: "esquerda" | "direita",
  ) => void | Promise<void>;
  uploadingDisabled?: boolean;
  /** Desabilita ações da galeria (mover/excluir/principal) durante operações */
  actionsDisabled?: boolean;
  onUploadBusyChange?: (busy: boolean) => void;
  uploadPrefix?: string;
  emptyText?: string;
  hint?: string;
};

/**
 * Galeria reutilizável (layout Principal + lista + upload).
 * Sem conhecimento de EventoSuite.
 */
export default function ImageGallery({
  photos,
  onUpload,
  onSetPrincipal,
  onDelete,
  onMove,
  uploadingDisabled,
  actionsDisabled,
  onUploadBusyChange,
  uploadPrefix = "Upload",
  emptyText = "Nenhuma foto adicionada.",
  hint,
}: Props) {
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const busy = Boolean(uploadingDisabled || actionsDisabled);

  const principal = useMemo(
    () => photos.find((p) => p.principal) || photos[0] || null,
    [photos],
  );

  const principalIndex = principal
    ? photos.findIndex((p) => p.key === principal.key)
    : -1;

  return (
    <View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}

      <Text style={styles.blockTitle}>Foto Principal</Text>
      {principal ? (
        <PhotoCard
          item={principal}
          index={Math.max(0, principalIndex)}
          total={photos.length}
          large
          disabled={busy}
          onPressView={() => setPreviewUri(principal.uri)}
          onPressPrincipal={() => !busy && onSetPrincipal(principal)}
          onPressDelete={() => !busy && onDelete(principal)}
          onMoveLeft={() => !busy && onMove(principal, "esquerda")}
          onMoveRight={() => !busy && onMove(principal, "direita")}
        />
      ) : (
        <Text style={styles.empty}>{emptyText}</Text>
      )}

      <Text style={[styles.blockTitle, { marginTop: 14 }]}>Galeria</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {photos.map((item, index) => (
          <PhotoCard
            key={item.key}
            item={item}
            index={index}
            total={photos.length}
            disabled={busy}
            onPressView={() => setPreviewUri(item.uri)}
            onPressPrincipal={() => !busy && onSetPrincipal(item)}
            onPressDelete={() => !busy && onDelete(item)}
            onMoveLeft={() => !busy && onMove(item, "esquerda")}
            onMoveRight={() => !busy && onMove(item, "direita")}
          />
        ))}
        <PhotoUploader
          compact
          prefixo={uploadPrefix}
          disabled={busy}
          onBusyChange={onUploadBusyChange}
          onUploaded={onUpload}
        />
      </ScrollView>

      <View style={styles.actionsLegend}>
        <Text style={styles.legend}>
          ★ Principal · 👁 Visualizar · 🗑 Excluir · ← → Mover
        </Text>
      </View>

      <PhotoViewer
        visible={!!previewUri}
        uri={previewUri}
        onClose={() => setPreviewUri(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hint: {
    fontSize: 12,
    color: colors.cinza,
    marginBottom: 10,
    lineHeight: 17,
  },
  blockTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  empty: {
    color: "#888",
    fontSize: 13,
    marginBottom: 8,
  },
  row: {
    alignItems: "flex-start",
    paddingVertical: 4,
  },
  actionsLegend: {
    marginTop: 8,
  },
  legend: {
    fontSize: 11,
    color: "#9ca3af",
  },
});
