"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { useRouter } from "next/navigation";
import Header from "./header/Header";
import ButtonIconTextShrink from "./ButtonIconTextShrink";

const HERO_WIDTH = 1920;
const HEADLINE_WIDTH = 680;
const EDGE_GUTTER = 32;
const HEADLINE_CENTER_LEFT = (HERO_WIDTH - HEADLINE_WIDTH) / 2;
const HEADLINE_LEFT_HOVER_LEFT = EDGE_GUTTER;
const HEADLINE_RIGHT_HOVER_LEFT = HERO_WIDTH - EDGE_GUTTER - HEADLINE_WIDTH;
const LINE_SHIFT_DURATION = 0.9;
const HEADLINE_SHIFT_DURATION = 1.15;
const HEADLINE_INTRO_FADE_DURATION = 1.3;

export default function Hero() {
  const router = useRouter();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const topLineRef = useRef<HTMLDivElement>(null);
  const skincareLineRef = useRef<HTMLDivElement>(null);
  const discoverRef = useRef<HTMLDivElement>(null);
  const takeTestRef = useRef<HTMLDivElement>(null);
  const leftGuideRef = useRef<HTMLDivElement>(null);
  const rightGuideRef = useRef<HTMLDivElement>(null);

  const getCenterOffsets = () => {
    if (!headingRef.current || !topLineRef.current || !skincareLineRef.current) {
      return { top: 0, bottom: 0 };
    }
    const w = headingRef.current.clientWidth;
    const topWidth = topLineRef.current.offsetWidth;
    const bottomWidth = skincareLineRef.current.offsetWidth;
    const topOffset = (w - topWidth) / 2;
    return {
      top: topOffset,
      // Keep skincare centered under Sophisticated (same visual center point).
      bottom: topOffset + (topWidth - bottomWidth) / 2,
    };
  };

  useLayoutEffect(() => {
    let mounted = true;

    const applyCenteredLayout = () => {
      if (!topLineRef.current || !skincareLineRef.current) return;
      const offsets = getCenterOffsets();
      gsap.set(topLineRef.current, { x: offsets.top });
      gsap.set(skincareLineRef.current, { x: offsets.bottom });
    };

    const runIntro = async () => {
      if (!headingRef.current) return;

      gsap.set(headingRef.current, { opacity: 0 });
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }
      if (!mounted) return;

      applyCenteredLayout();
      // One frame later avoids tiny metric jumps on some refreshes.
      requestAnimationFrame(() => {
        if (!mounted || !headingRef.current) return;
        applyCenteredLayout();
        gsap.to(headingRef.current, {
          opacity: 1,
          duration: HEADLINE_INTRO_FADE_DURATION,
          ease: "power2.out",
          overwrite: "auto",
        });
      });
    };

    runIntro();
    window.addEventListener("resize", applyCenteredLayout);
    return () => {
      mounted = false;
      window.removeEventListener("resize", applyCenteredLayout);
    };
  }, []);

  const handleTakeTestEnter = () => {
    if (!headingRef.current || !skincareLineRef.current || !topLineRef.current) return;

    gsap.killTweensOf(headingRef.current, "opacity");
    gsap.set(headingRef.current, { opacity: 1 });
    gsap.killTweensOf([headingRef.current, topLineRef.current, skincareLineRef.current]);

    const tl = gsap.timeline({ defaults: { overwrite: "auto" } });
    tl.to(
      [topLineRef.current, skincareLineRef.current],
      {
        x: 0,
        duration: LINE_SHIFT_DURATION,
        ease: "power3.out",
      },
      0,
    ).to(
      headingRef.current,
      {
        left: HEADLINE_LEFT_HOVER_LEFT,
        duration: HEADLINE_SHIFT_DURATION,
        ease: "power3.out",
      },
      0,
    );

    if (discoverRef.current) {
      gsap.to(discoverRef.current, {
        autoAlpha: 0,
        duration: 0.35,
        ease: "power2.out",
        overwrite: "auto",
      });
    }

    if (leftGuideRef.current) {
      gsap.to(leftGuideRef.current, {
        autoAlpha: 0,
        duration: 0.35,
        ease: "power2.out",
        overwrite: "auto",
      });
    }
  };

  const handleTakeTestLeave = () => {
    if (!headingRef.current || !skincareLineRef.current || !topLineRef.current) return;
    const offsets = getCenterOffsets();

    gsap.killTweensOf([headingRef.current, topLineRef.current, skincareLineRef.current]);

    const tl = gsap.timeline({ defaults: { overwrite: "auto" } });
    tl.to(
      [topLineRef.current, skincareLineRef.current],
      {
        x: (_index, target) => (target === topLineRef.current ? offsets.top : offsets.bottom),
        duration: LINE_SHIFT_DURATION,
        ease: "power3.out",
      },
      0,
    ).to(
      headingRef.current,
      {
        left: HEADLINE_CENTER_LEFT,
        duration: HEADLINE_SHIFT_DURATION,
        ease: "power3.out",
      },
      0,
    );

    if (discoverRef.current) {
      gsap.to(discoverRef.current, {
        autoAlpha: 1,
        duration: 0.35,
        ease: "power2.out",
        overwrite: "auto",
      });
    }

    if (leftGuideRef.current) {
      gsap.to(leftGuideRef.current, {
        autoAlpha: 1,
        duration: 0.35,
        ease: "power2.out",
        overwrite: "auto",
      });
    }
  };

  const handleDiscoverEnter = () => {
    if (!headingRef.current || !skincareLineRef.current || !topLineRef.current) return;
    const w = headingRef.current.clientWidth;
    const rightOffsets = {
      top: w - topLineRef.current.offsetWidth,
      bottom: w - skincareLineRef.current.offsetWidth,
    };

    gsap.killTweensOf(headingRef.current, "opacity");
    gsap.set(headingRef.current, { opacity: 1 });
    gsap.killTweensOf([headingRef.current, topLineRef.current, skincareLineRef.current]);

    const tl = gsap.timeline({ defaults: { overwrite: "auto" } });
    tl.to(
      [topLineRef.current, skincareLineRef.current],
      {
        x: (_index, target) => (target === topLineRef.current ? rightOffsets.top : rightOffsets.bottom),
        duration: LINE_SHIFT_DURATION,
        ease: "power3.out",
      },
      0,
    ).to(
      headingRef.current,
      {
        left: HEADLINE_RIGHT_HOVER_LEFT,
        duration: HEADLINE_SHIFT_DURATION,
        ease: "power3.out",
      },
      0,
    );

    if (takeTestRef.current) {
      gsap.to(takeTestRef.current, {
        autoAlpha: 0,
        duration: 0.35,
        ease: "power2.out",
        overwrite: "auto",
      });
    }

    if (rightGuideRef.current) {
      gsap.to(rightGuideRef.current, {
        autoAlpha: 0,
        duration: 0.35,
        ease: "power2.out",
        overwrite: "auto",
      });
    }
  };

  const handleDiscoverLeave = () => {
    if (!headingRef.current || !skincareLineRef.current || !topLineRef.current) return;
    const offsets = getCenterOffsets();

    gsap.killTweensOf([headingRef.current, topLineRef.current, skincareLineRef.current]);

    const tl = gsap.timeline({ defaults: { overwrite: "auto" } });
    tl.to(
      [topLineRef.current, skincareLineRef.current],
      {
        x: (_index, target) => (target === topLineRef.current ? offsets.top : offsets.bottom),
        duration: LINE_SHIFT_DURATION,
        ease: "power3.out",
      },
      0,
    ).to(
      headingRef.current,
      {
        left: HEADLINE_CENTER_LEFT,
        duration: HEADLINE_SHIFT_DURATION,
        ease: "power3.out",
      },
      0,
    );

    if (takeTestRef.current) {
      gsap.to(takeTestRef.current, {
        autoAlpha: 1,
        duration: 0.35,
        ease: "power2.out",
        overwrite: "auto",
      });
    }

    if (rightGuideRef.current) {
      gsap.to(rightGuideRef.current, {
        autoAlpha: 1,
        duration: 0.35,
        ease: "power2.out",
        overwrite: "auto",
      });
    }
  };

  return (
    <section className="relative h-[100dvh] w-full overflow-hidden bg-[#FCFCFC]">
      <div className="absolute left-1/2 top-1/2 h-[960px] w-[1920px] -translate-x-1/2 -translate-y-1/2">
        {/* Side guide rectangles */}
        <div
          ref={leftGuideRef}
          className="pointer-events-none absolute left-0 top-[178px] h-[604px] w-[302px]"
        >
          <img
            src="/assets/figma/hero-guide-left.svg"
            alt=""
            className="h-full w-full"
          />
        </div>
        <div
          ref={rightGuideRef}
          className="pointer-events-none absolute right-0 top-[178px] h-[604px] w-[302px]"
        >
          <img
            src="/assets/figma/hero-guide-right.svg"
            alt=""
            className="h-full w-full"
          />
        </div>

        <Header />

        {/* Center Headline */}
        <h1
          ref={headingRef}
          className="absolute top-[361px] h-[240px] w-[680px] text-left text-[128px] font-light leading-[120px] tracking-[-0.07em] text-[#1A1B1C]"
          style={{ left: `${HEADLINE_CENTER_LEFT}px`, opacity: 0 }}
        >
          <div ref={topLineRef} className="block w-fit">
            Sophisticated
          </div>
          <div ref={skincareLineRef} className="block w-fit">
            skincare
          </div>
        </h1>

        {/* Left CTA */}
        <div ref={discoverRef}>
          <ButtonIconTextShrink
            label="DISCOVER A.I."
            direction="left"
            frameWidthClass="w-[150px]"
            textWidthClass="w-[90px]"
            className="absolute left-8 top-[458px] cursor-pointer"
            expandOnHover
            expandMode="icon"
            baseWidth={150}
            expandedWidth={150}
            baseHeight={44}
            expandedHeight={44}
            baseGap={16}
            expandedGap={16}
            baseIconSize={44}
            expandedIconSize={54}
            onMouseEnter={handleDiscoverEnter}
            onMouseLeave={handleDiscoverLeave}
          />
        </div>

        {/* Right CTA */}
        <div ref={takeTestRef}>
          <ButtonIconTextShrink
            label="TAKE TEST"
            direction="right"
            frameWidthClass="w-[127px]"
            textWidthClass="w-[67px]"
            className="absolute right-12 top-[458px] cursor-pointer"
            expandOnHover
            expandMode="icon"
            baseWidth={127}
            expandedWidth={127}
            baseHeight={44}
            expandedHeight={44}
            baseGap={16}
            expandedGap={16}
            baseIconSize={44}
            expandedIconSize={58}
            onMouseEnter={handleTakeTestEnter}
            onMouseLeave={handleTakeTestLeave}
            onClick={() => router.push("/start-analysis")}
          />
        </div>

        {/* Bottom Description */}
        <div className="absolute left-8 top-[862px] h-[72px] w-[316px] text-[14px] font-normal uppercase leading-[24px] tracking-[0em] text-[#1A1B1C]">
          Skinstric developed an A.I. that creates a highly-personalised routine tailored to what your skin needs.
        </div>
      </div>
    </section>
  );
}
