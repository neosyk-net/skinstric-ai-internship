"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
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
  disabled?: boolean;
}> = [
  {
    id: "demographics",
    label: "Demographics",
  },
  {
    id: "cosmeticConcerns",
    label: "Cosmetic\nConcerns",
    disabled: true,
  },
  {
    id: "skinType",
    label: "Skin Type\nDetails",
    disabled: true,
  },
  {
    id: "weather",
    label: "Weather",
    disabled: true,
  },
];

const ARROW_KEY_TO_TILE: Partial<Record<string, AnalysisSection>> = {
  ArrowUp: "demographics",
  ArrowLeft: "skinType",
  ArrowRight: "cosmeticConcerns",
  ArrowDown: "weather",
};

export default function AnalysisPage() {
  const router = useRouter();
  const [viewportWidth, setViewportWidth] = useState<number | null>(null);
  const [activeTile, setActiveTile] = useState<AnalysisSection | null>(null);
  const clusterRef = useRef<HTMLDivElement>(null);
  const summaryButtonRef = useRef<HTMLDivElement>(null);
  const canOpenSummary = activeTile === "demographics";
  const isMobile = viewportWidth !== null && viewportWidth < 768;
  const clusterSize = isMobile ? 260 : 308;
  const tileSize = clusterSize / 2;
  const mobileRingScale = isMobile ? 0.82 : 1;
  const goToDemographicsSummary = useCallback(() => {
    router.push("/analysis/demographics");
  }, [router]);

  useEffect(() => {
    const getViewportWidth = () => {
      const candidates = [
        window.innerWidth,
        document.documentElement.clientWidth,
        window.visualViewport?.width ?? Number.POSITIVE_INFINITY,
      ].filter((value) => Number.isFinite(value) && value > 0);

      return Math.min(...candidates);
    };

    const syncViewport = () => setViewportWidth(getViewportWidth());
    syncViewport();

    window.addEventListener("resize", syncViewport);
    window.visualViewport?.addEventListener("resize", syncViewport);
    return () => {
      window.removeEventListener("resize", syncViewport);
      window.visualViewport?.removeEventListener("resize", syncViewport);
    };
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (clusterRef.current?.contains(target)) return;
      if (target instanceof Element && target.closest("[data-keep-analysis-selection='true']")) return;

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

  useEffect(() => {
    if (!summaryButtonRef.current) return;

    if (canOpenSummary) {
      gsap.fromTo(
        summaryButtonRef.current,
        { x: 56, autoAlpha: 0.4 },
        { x: 0, autoAlpha: 1, duration: 0.45, ease: "power3.out", overwrite: "auto" },
      );
      return;
    }

    gsap.to(summaryButtonRef.current, {
      x: 0,
      autoAlpha: 0.4,
      duration: 0.25,
      ease: "power2.out",
      overwrite: "auto",
    });
  }, [canOpenSummary, goToDemographicsSummary]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;

      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      ) {
        return;
      }

      const targetTile = ARROW_KEY_TO_TILE[event.key];
      if (targetTile) {
        event.preventDefault();
        if (event.repeat) return;
        setActiveTile((previousTile) => (previousTile === targetTile ? null : targetTile));
        return;
      }

      if (!canOpenSummary || event.key !== "Enter") return;
      event.preventDefault();
      goToDemographicsSummary();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [canOpenSummary, goToDemographicsSummary]);

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
        className={`analysis-cluster absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${
          activeTile ? "analysis-cluster--active" : ""
        }`}
        style={{ width: `${clusterSize}px`, height: `${clusterSize}px` }}
      >
        {guideRings.map((ring) => (
          <div
            key={ring.size}
            className="rhombus-ring pointer-events-none absolute left-1/2 top-1/2 h-[var(--ring-size)] w-[var(--ring-size)]"
            style={{
              // CSS variables let each ring keep unique timing/scale while sharing one smooth interaction.
              "--ring-size": `${ring.size * mobileRingScale}px`,
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

        <div
          className="absolute left-1/2 top-1/2 grid -translate-x-1/2 -translate-y-1/2 rotate-45 grid-cols-2 gap-[2px] bg-[#FCFCFC]"
          style={{ width: `${clusterSize}px`, height: `${clusterSize}px` }}
        >
          {analysisTiles.map((tile) => {
            const isActive = activeTile === tile.id;
            return (
              <button
                key={tile.id}
                onClick={() => {
                  if (tile.id === "demographics" && isActive) {
                    goToDemographicsSummary();
                    return;
                  }
                  setActiveTile(tile.id);
                }}
                className={`relative border border-[#FCFCFC] outline-none transition-colors duration-200 focus:outline-none focus-visible:outline-none ${
                  tile.disabled ? "cursor-not-allowed" : "cursor-pointer"
                } ${
                  isActive ? "bg-[#E1E1E2]" : "bg-[#F3F3F4]"
                }`}
                style={{ width: `${tileSize}px`, height: `${tileSize}px` }}
                aria-disabled={tile.disabled ? true : undefined}
                title={tile.disabled ? "Disabled for this demo" : undefined}
              >
                <span className="subpixel-antialiased [text-rendering:geometricPrecision] flex h-full w-full -rotate-45 items-center justify-center whitespace-pre-line text-center text-[16px] font-semibold uppercase leading-[24px] tracking-[-0.02em] text-[#1A1B1C]">
                  {tile.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="absolute bottom-9 left-8 right-8 flex items-center justify-between" data-keep-analysis-selection="true">
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

        <div ref={summaryButtonRef} style={{ opacity: 0.4 }}>
          <ButtonIconTextShrink
            label="GET SUMMARY"
            direction="right"
            frameWidthClass="w-[155px]"
            textWidthClass="w-[95px]"
            className={canOpenSummary ? "cursor-pointer" : "cursor-not-allowed"}
            textClassName={canOpenSummary ? "" : "opacity-70"}
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
            onClick={canOpenSummary ? goToDemographicsSummary : undefined}
          />
        </div>
      </div>
    </section>
  );
}
