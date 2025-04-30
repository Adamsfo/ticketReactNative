import React from "react";
import { Platform, View, StyleSheet, Image, Dimensions } from "react-native";

// Importa apenas se estiver na web
const { width, height } = Dimensions.get("window");

const isPlatformWeb = Platform.OS === "web";

const ImageCarousel: React.FC<{ images: string[] }> = ({ images }) => {
  if (isPlatformWeb) {
    // Web - React Slick
    const Slick = require("react-slick").default;

    // Importa CSS do slick apenas no web
    require("slick-carousel/slick/slick.css");
    require("slick-carousel/slick/slick-theme.css");

    const settings = {
      dots: true,
      infinite: true,
      speed: 800,
      slidesToShow: 1,
      slidesToScroll: 1,
      autoplay: true,
      autoplaySpeed: 3000,
      arrows: false,
      fade: true,
    };

    return (
      //   <div style={{ width: "100%", height: "100%" }}>
      <Slick {...settings}>
        {images.map((img, idx) => (
          <div key={idx}>
            <img
              src={img}
              style={{
                width: "100%",
                height: 400,
                objectFit: "fill",
                borderRadius: 8,
              }}
            />
          </div>
        ))}
      </Slick>
      //   </div>
    );
  }

  // Mobile - react-native-swiper
  const Swiper = require("react-native-swiper").default;

  return (
    <Swiper autoplay={true} autoplayTimeout={3} loop={true}>
      {images.map((image, index) => (
        <Image source={{ uri: image }} style={styles.image} />
      ))}
    </Swiper>
  );
};

const styles = StyleSheet.create({
  image: {
    width: width,
    height: "100%",
    resizeMode: "cover",
  },
});

export default ImageCarousel;
