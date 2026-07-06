import useEmblaCarousel from "embla-carousel-react";
import { useEffect } from "react";

function useAutoplay(api: ReturnType<typeof useEmblaCarousel>[1], delay = 2500) {
  useEffect(() => {
    if (!api) return;
    const id = setInterval(() => {
      if (!api) return;
      if (api.canScrollNext()) api.scrollNext();
      else api.scrollTo(0);
    }, delay);
    return () => clearInterval(id);
  }, [api, delay]);
}

export function BannerCarousel({ images }: { images: string[] }) {
  const [ref, api] = useEmblaCarousel({ loop: true, align: "start", dragFree: true });
  useAutoplay(api, 2200);
  return (
    <div className="overflow-hidden" ref={ref}>
      <div className="flex gap-4">
        {images.concat(images).map((src, i) => (
          <div
            key={i}
            className="glass-panel relative aspect-square w-[220px] shrink-0 overflow-hidden rounded-2xl sm:w-[280px] md:w-[340px]"
          >
            <img
              src={src}
              alt={`Banner Cetak Ide ${i + 1}`}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function LogoCarousel({ images }: { images: string[] }) {
  const [ref, api] = useEmblaCarousel({ loop: true, align: "start", dragFree: true });
  useAutoplay(api, 2800);
  return (
    <div className="overflow-hidden" ref={ref}>
      <div className="flex gap-6">
        {images.concat(images).map((src, i) => (
          <div
            key={i}
            className="glass-panel-strong flex h-40 w-40 shrink-0 items-center justify-center overflow-hidden rounded-2xl p-4 sm:h-48 sm:w-48"
          >
            <img
              src={src}
              alt={`Logo hasil generasi ${i + 1}`}
              loading="lazy"
              className="max-h-full max-w-full object-contain"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
