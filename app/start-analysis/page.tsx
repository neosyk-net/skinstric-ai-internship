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
const MIN_SUBMITTING_MS = 1400;

const isValidTextValue = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return /^[A-Za-z\s'.,-]+$/.test(trimmed);
};

export default function StartAnalysisPage() {
  const router = useRouter();
  const [step, setStep] = useState<"name" | "location">("name");
  const [inputValue, setInputValue] = useState("");
  const [nameValue, setNameValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const proceedRef = useRef<HTMLDivElement>(null);

  const placeholderText = step === "name" ? "Introduce Yourself" : "Where are you from?";
  const fieldWidth = step === "name" ? NAME_FIELD_WIDTH : LOCATION_FIELD_WIDTH;
  const fieldLeft = 960 - fieldWidth / 2;

  useEffect(() => {
    if (!isSubmitted || !proceedRef.current) return;
    gsap.fromTo(
      proceedRef.current,
      { x: -56, autoAlpha: 0 },
      { x: 0, autoAlpha: 1, duration: 0.45, ease: "power3.out", overwrite: "auto" },
    );
  }, [isSubmitted]);

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

    setNameValue(trimmedValue);
    setInputValue("");
    setIsSubmitted(false);
    setStep("location");
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
          <Image
            src="/assets/figma/rombus-outer.svg"
            alt=""
            fill
            className="object-contain"
            priority
          />
        </div>
        <div className="absolute left-[619px] top-[139px] h-[682px] w-[682px] animate-[spin_30s_linear_infinite] [animation-direction:reverse]">
          <Image
            src="/assets/figma/rombus-middle.svg"
            alt=""
            fill
            className="object-contain"
            priority
          />
        </div>
        <div className="absolute left-[659px] top-[179px] h-[602px] w-[602px] animate-[spin_22s_linear_infinite]">
          <Image
            src="/assets/figma/rombus-inner.svg"
            alt=""
            fill
            className="object-contain"
            priority
          />
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
          SUBMITTING...
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
