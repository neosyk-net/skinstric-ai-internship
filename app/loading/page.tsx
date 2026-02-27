"use client";

import { useEffect } from "react";
import { useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";

export default function LoadingPage() {
  const router = useRouter();
  const dotRefs = useRef<Array<HTMLSpanElement | null>>([]);

  useEffect(() => {
    const dots = dotRefs.current.filter((dot): dot is HTMLSpanElement => Boolean(dot));
    if (!dots.length) {
      router.replace("/analysis");
      return;
    }

    const timeline = gsap.timeline({
      repeat: 2,
      repeatDelay: 0.24,
      defaults: { overwrite: "auto" },
      onComplete: () => router.replace("/analysis"),
    });

    gsap.set(dots, { y: 0, opacity: 0.46 });
    dots.forEach((dot, index) => {
      const startAt = index * 0.16;
      timeline
        .to(
          dot,
          {
            y: -6,
            opacity: 1,
            duration: 0.16,
            ease: "power2.out",
          },
          startAt,
        )
        .to(
          dot,
          {
            y: 0,
            opacity: 0.46,
            duration: 0.16,
            ease: "power2.in",
          },
          startAt + 0.16,
        );
    });

    return () => {
      timeline.kill();
    };
  }, [router]);

  return (
    <section className="relative h-[100dvh] w-full overflow-hidden bg-[#FCFCFC]">
      <div className="absolute left-1/2 top-1/2 h-[482px] w-[482px] -translate-x-1/2 -translate-y-1/2">
        <div className="absolute left-0 top-0 h-[482px] w-[482px] animate-[spin_42s_linear_infinite]">
          <Image src="/assets/figma/rombus-outer.svg" alt="" fill className="object-contain [filter:brightness(0.82)]" />
        </div>
        <div
          className="absolute animate-[spin_30s_linear_infinite] [animation-direction:reverse]"
          style={{ left: "18.83px", top: "18.83px", width: "444.34px", height: "444.34px" }}
        >
          <Image src="/assets/figma/rombus-middle.svg" alt="" fill className="object-contain [filter:brightness(0.78)]" />
        </div>
        <div
          className="absolute animate-[spin_22s_linear_infinite]"
          style={{ left: "38.41px", top: "38.41px", width: "405.18px", height: "405.18px" }}
        >
          <Image src="/assets/figma/rombus-inner.svg" alt="" fill className="object-contain [filter:brightness(0.62)]" />
        </div>
      </div>

      <p className="absolute left-1/2 top-1/2 h-6 w-[227px] -translate-x-1/2 -translate-y-1/2 text-center text-[16px] font-semibold uppercase leading-[24px] tracking-[-0.02em] text-[#1A1B1C]">
        PREPARING YOUR ANALYSIS{" "}
        <span aria-hidden="true" className="inline-flex w-[20px] justify-between">
          <span ref={(node) => (dotRefs.current[0] = node)}>.</span>
          <span ref={(node) => (dotRefs.current[1] = node)}>.</span>
          <span ref={(node) => (dotRefs.current[2] = node)}>.</span>
        </span>
      </p>
    </section>
  );
}
