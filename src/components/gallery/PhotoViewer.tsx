import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { Feather } from "@expo/vector-icons";

const MIN_SCALE = 1;
const MAX_SCALE = 3;
const SCALE_STEP = 0.25;

type Props = {
  /** Compat: visualização de uma única imagem (ex.: ImageGallery admin). */
  uri?: string | null;
  /** Lista de imagens para navegação no visualizador. */
  uris?: string[];
  visible: boolean;
  onClose: () => void;
  initialIndex?: number;
};

/** Visualização fullscreen com navegação, contador e zoom. */
export default function PhotoViewer({
  uri,
  uris,
  visible,
  onClose,
  initialIndex = 0,
}: Props) {
  const urls = useMemo(() => {
    const fromList = (uris ?? []).filter((u) => Boolean(u && String(u).trim()));
    if (fromList.length > 0) return fromList;
    if (uri && String(uri).trim()) return [uri];
    return [];
  }, [uri, uris]);

  const [index, setIndex] = useState(initialIndex);
  const [scale, setScale] = useState(MIN_SCALE);
  const scrollRef = useRef<ScrollView>(null);
  const viewportWidth = Dimensions.get("window").width;

  useEffect(() => {
    if (!visible) return;
    const safeIndex = Math.min(
      Math.max(0, initialIndex),
      Math.max(0, urls.length - 1),
    );
    setIndex(safeIndex);
    setScale(MIN_SCALE);
    if (urls.length > 1 && Platform.OS !== "web") {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({
          x: safeIndex * viewportWidth,
          animated: false,
        });
      });
    }
  }, [visible, initialIndex, urls.length, viewportWidth]);

  const currentUri = urls[index] ?? null;
  const multi = urls.length > 1;
  const canNavigate = multi && scale <= MIN_SCALE;

  const goPrev = useCallback(() => {
    if (!canNavigate) return;
    setIndex((i) => {
      const next = Math.max(0, i - 1);
      scrollRef.current?.scrollTo({
        x: next * viewportWidth,
        animated: true,
      });
      return next;
    });
  }, [canNavigate, viewportWidth]);

  const goNext = useCallback(() => {
    if (!canNavigate) return;
    setIndex((i) => {
      const next = Math.min(urls.length - 1, i + 1);
      scrollRef.current?.scrollTo({
        x: next * viewportWidth,
        animated: true,
      });
      return next;
    });
  }, [canNavigate, urls.length, viewportWidth]);

  const zoomIn = () =>
    setScale((s) => Math.min(MAX_SCALE, Number((s + SCALE_STEP).toFixed(2))));
  const zoomOut = () =>
    setScale((s) => Math.max(MIN_SCALE, Number((s - SCALE_STEP).toFixed(2))));

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!canNavigate) return;
    const w = e.nativeEvent.layoutMeasurement.width || viewportWidth;
    const next = Math.round(e.nativeEvent.contentOffset.x / w);
    if (next >= 0 && next < urls.length) setIndex(next);
  };

  const onWebWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      if (Platform.OS !== "web") return;
      e.preventDefault();
      if (e.deltaY < 0) zoomIn();
      else if (e.deltaY > 0) zoomOut();
    },
    [],
  );

  if (!visible) return null;

  const renderZoomedImage = (imageUri: string, key?: string | number) => (
    <View
      key={key}
      style={[styles.slide, { width: viewportWidth }]}
    >
      {Platform.OS === "web" ? (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
          onWheel={onWebWheel}
        >
          <img
            src={imageUri}
            alt=""
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              transform: `scale(${scale})`,
              transition: "transform 0.15s ease",
            }}
          />
        </div>
      ) : (
        <Image
          source={{ uri: imageUri }}
          style={[styles.image, { transform: [{ scale }] }]}
          resizeMode="contain"
        />
      )}
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.close} onPress={onClose} hitSlop={12}>
          <Feather name="x" size={28} color="#fff" />
        </TouchableOpacity>

        {multi && (
          <Text style={styles.counter}>
            {index + 1} / {urls.length}
          </Text>
        )}

        <View style={styles.imageArea}>
          {scale > MIN_SCALE || !multi ? (
            currentUri ? renderZoomedImage(currentUri) : null
          ) : (
            <ScrollView
              ref={scrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={onScrollEnd}
              scrollEventThrottle={16}
              style={styles.pager}
            >
              {urls.map((u, i) => renderZoomedImage(u, i))}
            </ScrollView>
          )}
        </View>

        {canNavigate && (
          <>
            {index > 0 && (
              <TouchableOpacity
                style={[styles.navBtn, styles.navLeft]}
                onPress={goPrev}
                hitSlop={12}
              >
                <Feather name="chevron-left" size={32} color="#fff" />
              </TouchableOpacity>
            )}
            {index < urls.length - 1 && (
              <TouchableOpacity
                style={[styles.navBtn, styles.navRight]}
                onPress={goNext}
                hitSlop={12}
              >
                <Feather name="chevron-right" size={32} color="#fff" />
              </TouchableOpacity>
            )}
          </>
        )}

        <View style={styles.zoomBar}>
          <TouchableOpacity
            style={styles.zoomBtn}
            onPress={zoomOut}
            disabled={scale <= MIN_SCALE}
          >
            <Feather
              name="zoom-out"
              size={22}
              color={scale <= MIN_SCALE ? "#666" : "#fff"}
            />
          </TouchableOpacity>
          <Text style={styles.zoomLabel}>{Math.round(scale * 100)}%</Text>
          <TouchableOpacity
            style={styles.zoomBtn}
            onPress={zoomIn}
            disabled={scale >= MAX_SCALE}
          >
            <Feather
              name="zoom-in"
              size={22}
              color={scale >= MAX_SCALE ? "#666" : "#fff"}
            />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  close: {
    position: "absolute",
    top: 28,
    right: 24,
    zIndex: 10,
  },
  counter: {
    position: "absolute",
    top: 34,
    alignSelf: "center",
    zIndex: 10,
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  imageArea: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    paddingVertical: 72,
    paddingHorizontal: 8,
  },
  pager: {
    flex: 1,
    width: "100%",
  },
  slide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  navBtn: {
    position: "absolute",
    top: "50%",
    marginTop: -24,
    zIndex: 10,
    padding: 8,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 24,
  },
  navLeft: {
    left: 8,
  },
  navRight: {
    right: 8,
  },
  zoomBar: {
    position: "absolute",
    bottom: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  zoomBtn: {
    padding: 4,
  },
  zoomLabel: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    minWidth: 44,
    textAlign: "center",
  },
});
