import React, { useState, useEffect } from "react";
import "./styles.css";
import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";

interface ImageCarouselProps {
  images: string[];
}

export default function ImageCarousel({ images }: ImageCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    initial: 0,
    slideChanged(slider) {
      setCurrentSlide(slider.track.details?.rel || 0);
    },
    created() {
      setLoaded(true);
    },
  });

  const [slideCount, setSlideCount] = useState(0);

  // Delay the update of slide count to ensure the slider is properly initialized
  useEffect(() => {
    const timer = setTimeout(() => {
      if (instanceRef.current) {
        const count = instanceRef.current.track?.details?.slides?.length ?? 0;
        setSlideCount(count);
      }
    }, 1000); // Espera 1 segundo (1000ms) para garantir a inicialização do slider

    return () => clearTimeout(timer); // Limpa o timer quando o componente for desmontado
  }, [loaded, instanceRef]);

  return (
    <>
      <div className="navigation-wrapper">
        <div ref={sliderRef} className="keen-slider">
          {images.map((src, index) => (
            <div className="keen-slider__slide image-slide" key={index}>
              <img
                src={src}
                alt={`Slide ${index + 1}`}
                className="carousel-img"
              />
            </div>
          ))}
        </div>

        {loaded && instanceRef.current && slideCount > 0 && (
          <>
            <Arrow
              left
              onClick={(e: any) =>
                e.stopPropagation() || instanceRef.current?.prev()
              }
              disabled={currentSlide === 0}
            />
            <Arrow
              onClick={(e: any) =>
                e.stopPropagation() || instanceRef.current?.next()
              }
              disabled={currentSlide === slideCount - 1}
            />
          </>
        )}
      </div>

      {loaded && instanceRef.current && slideCount > 0 && (
        <div className="dots">
          {Array.from({ length: slideCount }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => instanceRef.current?.moveToIdx(idx)}
              className={"dot" + (currentSlide === idx ? " active" : "")}
            ></button>
          ))}
        </div>
      )}
    </>
  );
}

function Arrow(props: {
  disabled: boolean;
  left?: boolean;
  onClick: (e: any) => void;
}) {
  const disabled = props.disabled ? " arrow--disabled" : "";
  return (
    <svg
      onClick={props.onClick}
      className={`arrow ${
        props.left ? "arrow--left" : "arrow--right"
      } ${disabled}`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 23"
    >
      {props.left ? (
        <path d="M16.67 0l2.83 2.829-9.339 9.175 9.339 9.167-2.83 2.829-12.17-11.996z" />
      ) : (
        <path d="M5 3l3.057-3 11.943 12-11.943 12-3.057-3 9-9z" />
      )}
    </svg>
  );
}
