import React, { useRef, useState } from "react";
import { Platform, View, StyleSheet, Image, Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");
const isWeb = Platform.OS === "web";

const ImageCarousel: React.FC<{ images: string[] }> = ({ images }) => {
  if (isWeb) {
    const { useKeenSlider } = require("keen-slider/react");
    require("keen-slider/keen-slider.min.css");

    const [currentSlide, setCurrentSlide] = useState(0);
    const [details, setDetails] = useState<any>(null);

    const [sliderRef, slider] = useKeenSlider({
      loop: true,
      mode: "free-snap",
      slides: {
        perView: 1.4,
        spacing: 16,
      },
      slideChanged(s: any) {
        setCurrentSlide(s.track.details.rel);
      },
      detailsChanged(s: any) {
        setDetails(s.track.details);
      },
    });

    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "90%",
          margin: "auto",
          paddingTop: "20px",
          paddingBottom: "40px",
        }}
      >
        <div ref={sliderRef} className="keen-slider">
          {images.map((img, idx) => {
            const slide = details?.slides?.[idx];
            const distance = slide?.distance || 0;
            const scale = 0.9 + (1 - Math.min(Math.abs(distance), 1)) * 0.1;
            const zIndex = 100 - Math.round(Math.abs(distance) * 10);
            const translateX = distance * 50;

            return (
              <div
                key={idx}
                className="keen-slider__slide"
                style={{
                  transform: `scale(${scale}) translateX(${translateX}px)`,
                  transition: "transform 0.5s",
                  zIndex,
                  position: "relative",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <img
                  src={img}
                  alt=""
                  style={{
                    width: "90%", // ocupa 90% da largura disponível
                    height: 400, // maior altura para mais impacto visual
                    objectFit: "cover",
                    borderRadius: 20,
                    boxShadow:
                      zIndex > 90 ? "0 12px 40px rgba(0,0,0,0.3)" : "none",
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Dots */}
        <div
          style={{ display: "flex", justifyContent: "center", marginTop: 16 }}
        >
          {images.map((_, idx) => (
            <div
              key={idx}
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                margin: "0 5px",
                backgroundColor: idx === currentSlide ? "#333" : "#ccc",
                transition: "background 0.3s",
              }}
            />
          ))}
        </div>

        {/* Arrows */}
        <button
          onClick={() => slider.current?.prev()}
          style={{
            position: "absolute",
            top: "45%",
            left: -30,
            background: "#fff",
            border: "none",
            padding: "10px 14px",
            borderRadius: "50%",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}
        >
          ◀
        </button>
        <button
          onClick={() => slider.current?.next()}
          style={{
            position: "absolute",
            top: "45%",
            right: -30,
            background: "#fff",
            border: "none",
            padding: "10px 14px",
            borderRadius: "50%",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}
        >
          ▶
        </button>
      </div>
    );
  }

  // MOBILE (React Native)
  const Swiper = require("react-native-swiper").default;

  return (
    <Swiper autoplay={true} autoplayTimeout={3} loop={true}>
      {images.map((image: string, index: number) => (
        <View key={index} style={styles.slide}>
          <Image source={{ uri: image }} style={styles.image} />
        </View>
      ))}
    </Swiper>
  );
};

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: height * 0.4,
  },
  image: {
    width: width,
    height: "100%",
    resizeMode: "cover",
  },
});

export default ImageCarousel;
