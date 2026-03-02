"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import Header from "../../components/header/Header";
import ButtonIconTextShrink from "../../components/ButtonIconTextShrink";

const API_ENDPOINT =
  "https://us-central1-frontend-simplified.cloudfunctions.net/skinstricPhaseOne";
const NAME_FIELD_WIDTH = 420;
const LOCATION_FIELD_WIDTH = 500;
const SUBMITTING_DOT_STAGGER_SECONDS = 0.16;
const SUBMITTING_DOT_MOVE_SECONDS = 0.16;
const SUBMITTING_REPEAT_DELAY_SECONDS = 0.24;
const SUBMITTING_DOT_COUNT = 3;
const SUBMITTING_ANIMATION_CYCLES = 2;
const SUBMITTING_CYCLE_SECONDS =
  (SUBMITTING_DOT_COUNT - 1) * SUBMITTING_DOT_STAGGER_SECONDS + SUBMITTING_DOT_MOVE_SECONDS * 2;
const MIN_SUBMITTING_MS = Math.ceil(
  (SUBMITTING_CYCLE_SECONDS * SUBMITTING_ANIMATION_CYCLES +
    SUBMITTING_REPEAT_DELAY_SECONDS * (SUBMITTING_ANIMATION_CYCLES - 1)) *
    1000,
);
const MOBILE_ACTION_BOTTOM_PX = 112;

const isValidTextValue = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return /^[A-Za-z\s'.,-]+$/.test(trimmed);
};

export default function StartAnalysisPage() {
  const router = useRouter();
  const [viewportWidth, setViewportWidth] = useState<number | null>(null);
  const [step, setStep] = useState<"name" | "location">("name");
  const [inputValue, setInputValue] = useState("");
  const [nameValue, setNameValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const proceedRef = useRef<HTMLDivElement>(null);
  const submittingDotRefs = useRef<Array<HTMLSpanElement | null>>([]);

  const placeholderText = step === "name" ? "Introduce Yourself" : "Where are you from?";
  const mobilePlaceholderFontSize = step === "name" ? "44px" : "36px";
  const mobilePlaceholderLineHeight = step === "name" ? "48px" : "40px";
  const mobilePlaceholderLetterSpacing = step === "name" ? "-0.04em" : "-0.03em";
  const fieldWidth = step === "name" ? NAME_FIELD_WIDTH : LOCATION_FIELD_WIDTH;
  const fieldLeft = 960 - fieldWidth / 2;
  const isMobile = viewportWidth !== null && viewportWidth < 768;

  const getViewportWidth = () => {
    const candidates = [
      window.innerWidth,
      document.documentElement.clientWidth,
      window.visualViewport?.width ?? Number.POSITIVE_INFINITY,
    ].filter((value) => Number.isFinite(value) && value > 0);

    return Math.min(...candidates);
  };

  useEffect(() => {
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
    if (!isSubmitted || !proceedRef.current) return;
    gsap.fromTo(
      proceedRef.current,
      { x: -56, autoAlpha: 0 },
      { x: 0, autoAlpha: 1, duration: 0.45, ease: "power3.out", overwrite: "auto" },
    );
  }, [isSubmitted]);

  useEffect(() => {
    if (!isSubmitting) return;

    const dots = submittingDotRefs.current.filter((dot): dot is HTMLSpanElement => Boolean(dot));
    if (!dots.length) return;

    const timeline = gsap.timeline({
      repeat: -1,
      repeatDelay: SUBMITTING_REPEAT_DELAY_SECONDS,
      defaults: { overwrite: "auto" },
    });

    gsap.set(dots, { y: 0, opacity: 0.46 });
    dots.forEach((dot, index) => {
      const startAt = index * SUBMITTING_DOT_STAGGER_SECONDS;
      timeline
        .to(
          dot,
          {
            y: -4,
            opacity: 1,
            duration: SUBMITTING_DOT_MOVE_SECONDS,
            ease: "power2.out",
          },
          startAt,
        )
        .to(
          dot,
          {
            y: 0,
            opacity: 0.46,
            duration: SUBMITTING_DOT_MOVE_SECONDS,
            ease: "power2.in",
          },
          startAt + SUBMITTING_DOT_MOVE_SECONDS,
        );
    });

    return () => {
      timeline.kill();
    };
  }, [isSubmitting]);

  const handleProceed = async () => {
    if (isSubmitted) {
      router.push("/scan-options");
      return;
    }
    if (isSubmitting) return;

    const trimmedValue = inputValue.trim();
    setErrorMessage("");
    setStatusMessage("");

    if (!isValidTextValue(trimmedValue)) {
      setErrorMessage("Please enter a valid location (letters only).");
      return;
    }

    if (!isValidTextValue(nameValue)) {
      setErrorMessage("Please enter a valid name first.");
      setStep("name");
      setInputValue(nameValue);
      return;
    }

    const locationValue = trimmedValue;
    localStorage.setItem("skinstric_name", nameValue);
    localStorage.setItem("skinstric_location", locationValue);

    setIsSubmitting(true);
    const startedAt = Date.now();
    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: nameValue,
          location: locationValue,
        }),
      });

      if (!response.ok) {
        throw new Error("Request failed.");
      }

      await response.json();
      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_SUBMITTING_MS) {
        await new Promise((resolve) => setTimeout(resolve, MIN_SUBMITTING_MS - elapsed));
      }
      setStatusMessage("SUBMITTED SUCCESSFULLY.");
      setIsSubmitted(true);
    } catch {
      setErrorMessage("Could not submit right now. Please try again.");
      setIsSubmitted(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextStep = () => {
    if (isSubmitting) return;

    const trimmedValue = inputValue.trim();
    setErrorMessage("");
    setStatusMessage("");

    if (!isValidTextValue(trimmedValue)) {
      setErrorMessage("Please enter a valid name (letters only).");
      return;
    }

    setNameValue(trimmedValue);
    setInputValue("");
    setIsSubmitted(false);
    setStep("location");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (step === "location") {
      if (isSubmitted) {
        router.push("/scan-options");
        return;
      }
      await handleProceed();
      return;
    }

    const trimmedValue = inputValue.trim();
    setErrorMessage("");
    setStatusMessage("");

    if (!isValidTextValue(trimmedValue)) {
      setErrorMessage("Please enter a valid name (letters only).");
      return;
    }

    handleNextStep();
  };

  const handleBack = () => {
    if (step === "location") {
      setStep("name");
      setInputValue(nameValue);
      setErrorMessage("");
      setStatusMessage("");
      setIsSubmitted(false);
      return;
    }

    router.push("/");
  };

  if (viewportWidth === null) {
    return (
      <section className="relative h-[100dvh] w-full overflow-hidden bg-[#FCFCFC]">
        <Header showEnterCodeButton={false} />
      </section>
    );
  }

  if (isMobile) {
    return (
      <section className="relative h-[100dvh] w-full overflow-hidden bg-[#FCFCFC]">
        <Header showEnterCodeButton={false} />

        <p className="absolute left-8 top-[86px] h-6 w-[227px] text-[16px] font-semibold uppercase leading-[24px] tracking-[-0.02em] text-[#1A1B1C]">
          TO START ANALYSIS
        </p>

        <div
          className="absolute z-10 -translate-x-1/2"
          style={{ left: "50%", top: "236px", width: "360px", maxWidth: "90vw" }}
        >
          <div className="relative" style={{ height: "420px", width: "100%" }}>
            <div className="pointer-events-none absolute inset-0">
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-[spin_42s_linear_infinite] opacity-35"
                style={{ width: "320px", height: "320px" }}
              >
                <Image
                  src="/assets/figma/rombus-outer.svg"
                  alt=""
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-[spin_30s_linear_infinite] [animation-direction:reverse] opacity-45"
                style={{ width: "286px", height: "286px" }}
              >
                <Image
                  src="/assets/figma/rombus-middle.svg"
                  alt=""
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-[spin_22s_linear_infinite] opacity-55"
                style={{ width: "252px", height: "252px" }}
              >
                <Image
                  src="/assets/figma/rombus-inner.svg"
                  alt=""
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            <p
              className="absolute -translate-x-1/2 whitespace-nowrap text-center text-[14px] uppercase leading-[24px] text-[#8E8E93]"
              style={{ left: "50%", top: "132px" }}
            >
              CLICK TO TYPE
            </p>

            <form
              className="absolute -translate-x-1/2"
              style={{ left: "50%", top: "168px", width: "360px", maxWidth: "90vw" }}
              onSubmit={handleSubmit}
            >
              <input
                id="name-mobile"
                name="name-mobile"
                type="text"
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="none"
                placeholder={placeholderText}
                value={inputValue}
                onChange={(event) => {
                  setInputValue(event.target.value);
                  if (step === "location" && isSubmitted) {
                    setIsSubmitted(false);
                    setStatusMessage("");
                  }
                }}
                autoComplete="off"
                className="h-16 w-full bg-transparent outline-none placeholder:text-[#8E8E93]"
                style={{
                  textAlign: "center",
                  fontSize: mobilePlaceholderFontSize,
                  lineHeight: mobilePlaceholderLineHeight,
                  letterSpacing: mobilePlaceholderLetterSpacing,
                  color: "#1A1B1C",
                  paddingLeft: 0,
                  paddingRight: 0,
                }}
              />
              <div className="mt-1 h-px w-full bg-[#1A1B1C]" />
            </form>

            {errorMessage ? (
              <p
                className="absolute -translate-x-1/2 text-center text-[11px] uppercase tracking-[0.02em] text-[#B23A3A]"
                style={{ left: "50%", top: "246px" }}
              >
                {errorMessage}
              </p>
            ) : null}
            {statusMessage ? (
              <p
                className="absolute -translate-x-1/2 text-center text-[11px] uppercase tracking-[0.02em] text-[#1A1B1C] opacity-70"
                style={{ left: "50%", top: "246px" }}
              >
                {statusMessage}
              </p>
            ) : null}
            {isSubmitting ? (
              <p
                className="absolute -translate-x-1/2 text-center text-[11px] uppercase tracking-[0.02em] text-[#1A1B1C] opacity-70"
                style={{ left: "50%", top: "246px" }}
              >
                SUBMITTING{" "}
                <span aria-hidden="true" className="inline-flex w-[14px] justify-between">
                  <span ref={(node) => (submittingDotRefs.current[0] = node)}>.</span>
                  <span ref={(node) => (submittingDotRefs.current[1] = node)}>.</span>
                  <span ref={(node) => (submittingDotRefs.current[2] = node)}>.</span>
                </span>
              </p>
            ) : null}
          </div>
        </div>

        <div
          className="absolute left-8 right-8 flex items-center justify-between"
          style={{ bottom: `${MOBILE_ACTION_BOTTOM_PX}px` }}
        >
          <ButtonIconTextShrink
            label="BACK"
            direction="left"
            frameWidthClass="w-[97px]"
            textWidthClass="w-[37px]"
            textClassName="opacity-70"
            className="cursor-pointer"
            expandOnHover={false}
            expandMode="icon"
            baseWidth={97}
            expandedWidth={97}
            baseHeight={44}
            expandedHeight={44}
            baseGap={16}
            expandedGap={16}
            baseIconSize={44}
            expandedIconSize={54}
            onClick={handleBack}
          />

          {step === "name" ? (
            <ButtonIconTextShrink
              label="NEXT"
              direction="right"
              frameWidthClass="w-[123px]"
              textWidthClass="w-[63px]"
              textClassName="opacity-70"
              className="cursor-pointer"
              expandOnHover={false}
              expandMode="icon"
              baseWidth={123}
              expandedWidth={123}
              baseHeight={44}
              expandedHeight={44}
              baseGap={16}
              expandedGap={16}
              baseIconSize={44}
              expandedIconSize={58}
              onClick={handleNextStep}
            />
          ) : step === "location" && !isSubmitted ? (
            <ButtonIconTextShrink
              label="NEXT"
              direction="right"
              frameWidthClass="w-[123px]"
              textWidthClass="w-[63px]"
              textClassName="opacity-70"
              className="cursor-pointer"
              expandOnHover={false}
              expandMode="icon"
              baseWidth={123}
              expandedWidth={123}
              baseHeight={44}
              expandedHeight={44}
              baseGap={16}
              expandedGap={16}
              baseIconSize={44}
              expandedIconSize={58}
              onClick={handleProceed}
            />
          ) : step === "location" && isSubmitted ? (
            <div ref={proceedRef}>
              <ButtonIconTextShrink
                label="PROCEED"
                direction="right"
                frameWidthClass="w-[123px]"
                textWidthClass="w-[63px]"
                textClassName="opacity-70"
                className="cursor-pointer"
                expandOnHover={false}
                expandMode="icon"
                baseWidth={123}
                expandedWidth={123}
                baseHeight={44}
                expandedHeight={44}
                baseGap={16}
                expandedGap={16}
                baseIconSize={44}
                expandedIconSize={58}
                onClick={() => router.push("/scan-options")}
              />
            </div>
          ) : (
            <div className="w-[123px]" aria-hidden="true" />
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="relative h-[100dvh] w-full overflow-hidden bg-[#FCFCFC]">
      <Header showEnterCodeButton={false} />

      <p className="absolute left-8 top-[86px] h-6 w-[227px] text-[16px] font-semibold uppercase leading-[24px] tracking-[-0.02em] text-[#1A1B1C]">
        TO START ANALYSIS
      </p>
      <p className="absolute left-[905px] top-[422px] h-6 w-24 whitespace-nowrap text-left text-[14px] font-normal uppercase leading-[24px] tracking-[0em] text-[#1A1B1C] opacity-40">
        CLICK TO TYPE
      </p>

      <div className="pointer-events-none absolute left-0 top-0">
        <div className="absolute left-[579px] top-[99px] h-[762px] w-[762px] animate-[spin_42s_linear_infinite]">
          <Image src="/assets/figma/rombus-outer.svg" alt="" fill className="object-contain" priority />
        </div>
        <div className="absolute left-[619px] top-[139px] h-[682px] w-[682px] animate-[spin_30s_linear_infinite] [animation-direction:reverse]">
          <Image src="/assets/figma/rombus-middle.svg" alt="" fill className="object-contain" priority />
        </div>
        <div className="absolute left-[659px] top-[179px] h-[602px] w-[602px] animate-[spin_22s_linear_infinite]">
          <Image src="/assets/figma/rombus-inner.svg" alt="" fill className="object-contain" priority />
        </div>
      </div>

      <form
        className="absolute top-[448px] h-[65px]"
        style={{ left: `${fieldLeft}px`, width: `${fieldWidth}px` }}
        onSubmit={handleSubmit}
      >
        <input
          id="name"
          name="name"
          type="text"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="none"
          placeholder={placeholderText}
          value={inputValue}
          onChange={(event) => {
            setInputValue(event.target.value);
            if (step === "location" && isSubmitted) {
              setIsSubmitted(false);
              setStatusMessage("");
            }
          }}
          autoComplete="off"
          className="-ml-0.5 h-16 bg-transparent text-center text-[60px] font-normal leading-[64px] tracking-[-0.07em] text-[#1A1B1C] outline-none placeholder:text-[#8E8E93]"
          style={{ width: `${fieldWidth + 4}px` }}
        />
        <div className="absolute left-px top-16 h-px bg-[#1A1B1C]" style={{ width: `${fieldWidth - 3}px` }} />
      </form>

      {errorMessage ? (
        <p className="absolute left-1/2 top-[530px] -translate-x-1/2 text-[12px] uppercase tracking-[0.02em] text-[#B23A3A]">
          {errorMessage}
        </p>
      ) : null}
      {statusMessage ? (
        <p className="absolute left-1/2 top-[530px] -translate-x-1/2 text-[12px] uppercase tracking-[0.02em] text-[#1A1B1C] opacity-70">
          {statusMessage}
        </p>
      ) : null}
      {isSubmitting ? (
        <p className="absolute left-1/2 top-[530px] -translate-x-1/2 text-[12px] uppercase tracking-[0.02em] text-[#1A1B1C] opacity-70">
          SUBMITTING{" "}
          <span aria-hidden="true" className="inline-flex w-[14px] justify-between">
            <span ref={(node) => (submittingDotRefs.current[0] = node)}>.</span>
            <span ref={(node) => (submittingDotRefs.current[1] = node)}>.</span>
            <span ref={(node) => (submittingDotRefs.current[2] = node)}>.</span>
          </span>
        </p>
      ) : null}

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
          onClick={handleBack}
        />
      </div>
      {step === "location" && isSubmitted ? (
        <div ref={proceedRef} className="absolute bottom-9 right-8">
          <ButtonIconTextShrink
            label="PROCEED"
            direction="right"
            frameWidthClass="w-[123px]"
            textWidthClass="w-[63px]"
            textClassName="opacity-70"
            className="cursor-pointer"
            expandOnHover
            expandMode="icon"
            baseWidth={123}
            expandedWidth={123}
            baseHeight={44}
            expandedHeight={44}
            baseGap={16}
            expandedGap={16}
            baseIconSize={44}
            expandedIconSize={58}
            onClick={() => router.push("/scan-options")}
          />
        </div>
      ) : null}
    </section>
  );
}
