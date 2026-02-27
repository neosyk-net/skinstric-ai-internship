"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/header/Header";
import ButtonIconTextShrink from "../../components/ButtonIconTextShrink";

type AnalysisSection = "demographics" | "skinType" | "cosmeticConcerns" | "weather";

const guideRings = [
  { src: "/assets/figma/rombus-outer.svg", size: 762, opacity: 0.45, delayMs: 0, hiddenScale: 0.34, showScale: 1 },
  { src: "/assets/figma/rombus-middle.svg", size: 682, opacity: 0.6, delayMs: 70, hiddenScale: 0.46, showScale: 1 },
  { src: "/assets/figma/rombus-inner.svg", size: 602, opacity: 1, delayMs: 140, hiddenScale: 0.58, showScale: 1 },
] as const;

const analysisTiles: Array<{
  id: AnalysisSection;
  label: string;
}> = [
  {
    id: "demographics",
    label: "Demographics",
  },
  {
    id: "cosmeticConcerns",
    label: "Cosmetic\nConcerns",
  },
  {
    id: "skinType",
    label: "Skin Type\nDetails",
  },
  {
    id: "weather",
    label: "Weather",
  },
];

export default function AnalysisPage() {
  const router = useRouter();
  const [activeTile, setActiveTile] = useState<AnalysisSection | null>(null);
  const clusterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (clusterRef.current?.contains(target)) return;

      setActiveTile(null);
      const activeEl = document.activeElement;
      if (activeEl instanceof HTMLElement) {
        activeEl.blur();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  return (
    <section className="relative h-[100dvh] w-full overflow-hidden bg-[#FCFCFC]">
      <Header showEnterCodeButton={false} locationLabel="ANALYSIS" />

      <div className="absolute left-8 top-[86px] text-[#1A1B1C]">
        <p className="h-6 w-[227px] text-[16px] font-semibold uppercase leading-[24px] tracking-[-0.02em]">
          A.I ANALYSIS
        </p>
        <p className="mt-2 h-12 w-[336px] text-[14px] font-normal uppercase leading-[24px] text-[#1A1B1C]">
          A.I HAS ESTIMATED THE FOLLOWING.
          <br />
          FIX ESTIMATED INFORMATION IF NEEDED.
        </p>
      </div>

      <div
        ref={clusterRef}
        className="analysis-cluster absolute left-1/2 top-1/2 h-[307.76px] w-[307.76px] -translate-x-1/2 -translate-y-1/2"
      >
        {guideRings.map((ring) => (
          <div
            key={ring.size}
            className="rhombus-ring pointer-events-none absolute left-1/2 top-1/2 h-[var(--ring-size)] w-[var(--ring-size)]"
            style={{
              // CSS variables let each ring keep unique timing/scale while sharing one smooth interaction.
              "--ring-size": `${ring.size}px`,
              "--ring-opacity": ring.opacity,
              "--ring-hidden-scale": ring.hiddenScale,
              "--ring-show-scale": ring.showScale,
              "--ring-delay": `${ring.delayMs}ms`,
            } as CSSProperties}
            aria-hidden="true"
          >
            <Image src={ring.src} alt="" fill className="object-contain" priority />
          </div>
        ))}

        <div className="absolute left-1/2 top-1/2 grid h-[307.76px] w-[307.76px] -translate-x-1/2 -translate-y-1/2 rotate-45 grid-cols-2 gap-[2px] bg-[#FCFCFC]">
          {analysisTiles.map((tile) => {
            const isActive = activeTile === tile.id;
            return (
              <button
                key={tile.id}
                onClick={() => setActiveTile(tile.id)}
                className={`h-[153.88px] w-[153.88px] cursor-pointer border border-[#FCFCFC] transition-colors duration-200 hover:bg-[#E1E1E2] focus-visible:bg-[#E1E1E2] ${
                  isActive ? "bg-[#E1E1E2]" : "bg-[#F3F3F4]"
                }`}
              >
                <span className="flex h-full w-full -rotate-45 items-center justify-center whitespace-pre-line text-center text-[16px] font-semibold uppercase leading-[24px] tracking-[-0.02em] text-[#1A1B1C]">
                  {tile.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="absolute bottom-9 left-8">
        <ButtonIconTextShrink
          label="BACK"
          direction="left"
          frameWidthClass="w-[97px]"
          textWidthClass="w-[37px]"
          textClassName="opacity-70"
          className="cursor-pointer"
          expandOnHover
          expandMode="icon"
          baseWidth={97}
          expandedWidth={97}
          baseHeight={44}
          expandedHeight={44}
          baseGap={16}
          expandedGap={16}
          baseIconSize={44}
          expandedIconSize={54}
          onClick={() => router.push("/scan-options")}
        />
      </div>

      <div className="absolute bottom-9 right-8">
        <ButtonIconTextShrink
          label="GET SUMMARY"
          direction="right"
          frameWidthClass="w-[155px]"
          textWidthClass="w-[95px]"
          className="cursor-pointer"
          expandOnHover
          expandMode="icon"
          baseWidth={155}
          expandedWidth={155}
          baseHeight={44}
          expandedHeight={44}
          baseGap={16}
          expandedGap={16}
          baseIconSize={44}
          expandedIconSize={58}
        />
      </div>
    </section>
  );
}
