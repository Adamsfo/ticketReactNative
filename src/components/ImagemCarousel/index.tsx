import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  Image,
  View,
  Animated,
  Dimensions,
  Platform,
} from "react-native";

const { width, height } = Dimensions.get("window");

type ImageCarouselProps = {
  images: string[]; // URLs das imagens
};

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images }) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0); // Índice da imagem atual
  const carouselWidth = width; // Largura total da tela
  const carouselHeight = height * 0.6; // Ajuste a altura para ocupar uma parte da tela

  // Função para atualizar o índice automaticamente a cada 3 segundos
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length); // Vai para a próxima imagem
    }, 3000); // Intervalo de 3 segundos

    return () => clearInterval(intervalId); // Limpa o intervalo quando o componente for desmontado
  }, [images.length]);

  // Função para realizar o scroll automático para a próxima imagem
  const scrollToIndex = (index: number) => {
    scrollX.setValue(index * carouselWidth); // Ajusta a posição do scroll
  };

  // Chama a função para atualizar o scroll sempre que o índice mudar
  useEffect(() => {
    scrollToIndex(currentIndex);
  }, [currentIndex]);

  return (
    <View style={styles.carouselContainer}>
      <Animated.FlatList
        data={images}
        keyExtractor={(_, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={carouselWidth} // Largura total do carrossel
        contentContainerStyle={{
          paddingHorizontal: (width - carouselWidth) / 2, // Centraliza a lista
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        renderItem={({ item, index }) => {
          // Animação de Parallax - Efeito de profundidade
          const translateX = scrollX.interpolate({
            inputRange: [
              (index - 1) * carouselWidth,
              index * carouselWidth,
              (index + 1) * carouselWidth,
            ],
            outputRange: [-50, 0, 50], // Mais intenso para um efeito de profundidade
            extrapolate: "clamp",
          });

          // Animação de Opacidade para a profundidade
          const opacity = scrollX.interpolate({
            inputRange: [
              (index - 1) * carouselWidth,
              index * carouselWidth,
              (index + 1) * carouselWidth,
            ],
            outputRange: [0.5, 1, 0.5], // Transição suave de opacidade
            extrapolate: "clamp",
          });

          // Efeito de Zoom na Imagem Central
          const scale = scrollX.interpolate({
            inputRange: [
              (index - 1) * carouselWidth,
              index * carouselWidth,
              (index + 1) * carouselWidth,
            ],
            outputRange: [0.9, 1.1, 0.9], // Imagem central fica maior
            extrapolate: "clamp",
          });

          return (
            <Animated.View
              style={[
                styles.imageContainer,
                {
                  transform: [{ translateX }, { scale }],
                  opacity,
                },
              ]}
            >
              <Image source={{ uri: item }} style={styles.image} />
            </Animated.View>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  carouselContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
    width: width, // Largura total da tela
    height: height * 0.6, // Ajuste a altura para ocupar 60% da tela
  },
  imageContainer: {
    width: width, // Largura total da tela
    height: height * 0.6, // Altura ajustada
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 10,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    borderRadius: 15,
  },
});

export default ImageCarousel;
