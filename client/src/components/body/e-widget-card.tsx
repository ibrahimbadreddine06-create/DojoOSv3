import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import type { WidgetSize } from "@/components/body/module-grid";

export const eWidgetFontStack =
  'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export function bodyLocalDateKey(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function accentTheme(accent: string) {
  return {
    "--widget-accent": accent,
    "--widget-soft": `color-mix(in oklch, ${accent} 11%, white)`,
    "--widget-medium": `color-mix(in oklch, ${accent} 48%, white)`,
  } as CSSProperties;
}

/**
 * Shared E-language card surface.
 *
 * The 288px reference plane scales the card inset, type, controls, and zone
 * gaps together. Widget contents remain free to compose their own zones.
 */
export function EWidgetCard({
  size,
  accentColor,
  children,
}: {
  size: WidgetSize;
  accentColor?: string;
  children: ReactNode;
}) {
  const cardRef = useRef<HTMLElement>(null);
  const [cardSize, setCardSize] = useState({ width: 288, height: 288 });

  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const measure = () =>
      setCardSize({ width: card.clientWidth, height: card.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  const scale = Math.max(
    0.35,
    Math.min(
      cardSize.width / (288 * size.w),
      cardSize.height / (288 * size.h),
    ),
  );

  return (
    <article
      ref={cardRef}
      className="relative h-full w-full overflow-hidden rounded-[var(--body-widget-radius)] border border-[#e4e7eb] bg-white shadow-[0_8px_22px_rgba(24,32,42,.055)] transition-[border-color,box-shadow] duration-150 [transition-timing-function:cubic-bezier(0.25,1,0.5,1)] hover:border-[#d7dce2] hover:shadow-[0_10px_26px_rgba(24,32,42,.09)] [&_button:focus-visible]:outline [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-2 [&_button:focus-visible]:outline-[var(--widget-accent)] [&_input:focus-visible]:outline [&_input:focus-visible]:outline-2 [&_input:focus-visible]:outline-offset-1 [&_input:focus-visible]:outline-[var(--widget-accent)] motion-reduce:transition-none"
    >
      <div
        className="absolute left-0 top-0 box-border overflow-visible text-[#18202a]"
        style={{
          width: cardSize.width / scale,
          height: cardSize.height / scale,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          fontFamily: eWidgetFontStack,
          ...accentTheme(accentColor ?? "#20a65a"),
        }}
      >
        <div
          className="absolute left-5 top-5 min-h-0 min-w-0 overflow-visible"
          style={{
            width: "calc(100% - 40px)",
            height: "calc(100% - 40px)",
          }}
        >
          {children}
        </div>
      </div>
    </article>
  );
}
