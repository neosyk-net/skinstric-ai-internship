"use client";

import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import Header from "../../components/header/Header";
import ButtonIconTextShrink from "../../components/ButtonIconTextShrink";

const PHASE_TWO_ENDPOINT =
  "https://us-central1-frontend-simplified.cloudfunctions.net/skinstricPhaseTwo";
const UPLOADING_DOT_STAGGER_SECONDS = 0.16;
const UPLOADING_DOT_MOVE_SECONDS = 0.16;
const UPLOADING_REPEAT_DELAY_SECONDS = 0.24;
const UPLOADING_DOT_COUNT = 3;
const UPLOADING_ANIMATION_CYCLES = 3;
const UPLOADING_CYCLE_SECONDS =
  (UPLOADING_DOT_COUNT - 1) * UPLOADING_DOT_STAGGER_SECONDS + UPLOADING_DOT_MOVE_SECONDS * 2;
const UPLOADING_MIN_LOADING_MS = Math.ceil(
  (UPLOADING_CYCLE_SECONDS * UPLOADING_ANIMATION_CYCLES +
    UPLOADING_REPEAT_DELAY_SECONDS * (UPLOADING_ANIMATION_CYCLES - 1)) *
    1000,
);

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Failed to read file."));
        return;
      }

      const base64Payload = result.split(",")[1] ?? "";
      if (!base64Payload) {
        reject(new Error("Invalid Base64 payload."));
        return;
      }

      resolve(base64Payload);
    };
    reader.onerror = () => reject(new Error("Could not read selected file."));
    reader.readAsDataURL(file);
  });

export default function ScanOptionsPage() {
  const router = useRouter();
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const uploadStatusRef = useRef<HTMLParagraphElement>(null);
  const uploadingDotRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const cameraPermissionPanelRef = useRef<HTMLDivElement>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [showCameraPermissionPanel, setShowCameraPermissionPanel] = useState(false);
  const openGalleryPicker = useCallback(() => {
    galleryInputRef.current?.click();
  }, []);

  useEffect(() => {
    if (!uploadStatus || uploadError || !uploadStatusRef.current) return;

    const messageNode = uploadStatusRef.current;
    const revealTween = gsap.fromTo(
      messageNode,
      { clipPath: "inset(0 100% 0 0)" },
      { clipPath: "inset(0 0% 0 0)", duration: 1.9, ease: "power2.out" },
    );
    const routeTimer = window.setTimeout(() => {
      router.push("/loading");
    }, 2600);

    return () => {
      revealTween.kill();
      window.clearTimeout(routeTimer);
    };
  }, [uploadStatus, uploadError, router]);

  useEffect(() => {
    if (!isUploading) return;

    const dots = uploadingDotRefs.current.filter((dot): dot is HTMLSpanElement => Boolean(dot));
    if (!dots.length) return;

    const timeline = gsap.timeline({
      repeat: -1,
      repeatDelay: UPLOADING_REPEAT_DELAY_SECONDS,
      defaults: { overwrite: "auto" },
    });

    gsap.set(dots, { y: 0, opacity: 0.46 });
    dots.forEach((dot, index) => {
      const startAt = index * UPLOADING_DOT_STAGGER_SECONDS;
      timeline
        .to(
          dot,
          {
            y: -4,
            opacity: 1,
            duration: UPLOADING_DOT_MOVE_SECONDS,
            ease: "power2.out",
          },
          startAt,
        )
        .to(
          dot,
          {
            y: 0,
            opacity: 0.46,
            duration: UPLOADING_DOT_MOVE_SECONDS,
            ease: "power2.in",
          },
          startAt + UPLOADING_DOT_MOVE_SECONDS,
        );
    });

    return () => {
      timeline.kill();
    };
  }, [isUploading]);

  useEffect(() => {
    if (!showCameraPermissionPanel) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (cameraPermissionPanelRef.current?.contains(target)) return;
      setShowCameraPermissionPanel(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [showCameraPermissionPanel]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || isUploading) return;

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

      if (event.key === "ArrowRight") {
        event.preventDefault();
        openGalleryPicker();
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isUploading, openGalleryPicker]);

  const handleGalleryChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setUploadStatus("");
    setUploadError("");
    setIsUploading(true);
    const uploadStartedAt = Date.now();

    try {
      const base64Image = await fileToBase64(file);
      const response = await fetch(PHASE_TWO_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: base64Image,
        }),
      });

      if (!response.ok) {
        throw new Error("Upload request failed.");
      }

      const payload = await response.json();
      localStorage.setItem("skinstric_uploaded_file_name", file.name);
      localStorage.setItem("skinstric_phase_two_response", JSON.stringify(payload));
      const elapsedMs = Date.now() - uploadStartedAt;
      const remainingMs = Math.max(0, UPLOADING_MIN_LOADING_MS - elapsedMs);
      if (remainingMs) {
        await new Promise((resolve) => setTimeout(resolve, remainingMs));
      }
      setIsUploading(false);
      setUploadStatus("IMAGE UPLOADED SUCCESSFULLY.");
    } catch {
      setUploadError("Could not upload image right now. Please try again.");
      setIsUploading(false);
    } finally {
      // noop: upload state is handled explicitly in success/error branches.
    }
  };

  return (
    <section className="relative h-[100dvh] w-full overflow-hidden bg-[#FCFCFC]">
      <Header showEnterCodeButton={false} />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleGalleryChange}
      />

      <p className="absolute left-8 top-[86px] h-6 w-[227px] text-[16px] font-semibold uppercase leading-[24px] tracking-[-0.02em] text-[#1A1B1C]">
        TO START ANALYSIS
      </p>

      <button
        type="button"
        className="absolute left-[412px] top-[413px] h-[136px] w-[136px] cursor-pointer"
        onClick={() => setShowCameraPermissionPanel(true)}
      >
        <Image src="/assets/figma/camera.svg" alt="Allow A.I. to scan your face" fill className="object-contain" />
      </button>
      <button
        type="button"
        className={`absolute left-[1372px] top-[413px] h-[136px] w-[136px] transition-opacity duration-300 ${
          showCameraPermissionPanel ? "cursor-not-allowed opacity-25" : "cursor-pointer opacity-100"
        }`}
        onClick={showCameraPermissionPanel ? undefined : openGalleryPicker}
      >
        <Image src="/assets/figma/gallery.svg" alt="Allow A.I. access gallery" fill className="object-contain" />
      </button>
      {showCameraPermissionPanel ? (
        <div
          ref={cameraPermissionPanelRef}
          className="absolute left-[592px] top-[442px] z-20 h-[136px] w-[352px] bg-[#1A1B1C]"
        >
          <p className="absolute left-[15px] top-[14px] h-6 w-[321px] whitespace-nowrap text-[16px] font-semibold uppercase leading-[24px] tracking-[0em] text-[#FCFCFC]">
            ALLOW A.I. TO ACCESS YOUR CAMERA
          </p>
          <div className="absolute left-0 top-[100px] h-px w-full bg-[#FCFCFC]" />
          <div className="absolute left-[168px] top-[101px] inline-flex h-[35px] items-center gap-2">
            <button
              type="button"
              className="inline-flex h-[35px] w-20 cursor-pointer items-center justify-center px-4 pb-[10px] pt-[9px] text-[14px] font-semibold uppercase leading-[16px] tracking-[-0.02em] text-[#FCFCFC] transition-colors duration-200 hover:text-[#C1C2C3] focus-visible:text-[#C1C2C3]"
              onClick={() => setShowCameraPermissionPanel(false)}
            >
              DENY
            </button>
            <button
              type="button"
              className="inline-flex h-[35px] w-20 cursor-pointer items-center justify-center px-4 pb-[10px] pt-[9px] text-[14px] font-semibold uppercase leading-[16px] tracking-[-0.02em] text-[#FCFCFC] transition-colors duration-200 hover:text-[#C1C2C3] focus-visible:text-[#C1C2C3]"
              onClick={() => {
                setShowCameraPermissionPanel(false);
                router.push("/camera");
              }}
            >
              ALLOW
            </button>
          </div>
        </div>
      ) : null}
      <div className="pointer-events-none absolute left-0 top-0">
        <div
          className="absolute left-[239px] top-[240px] h-[482px] w-[482px] animate-[spin_42s_linear_infinite]"
        >
          <Image
            src="/assets/figma/rombus-outer.svg"
            alt=""
            fill
            className="object-contain [filter:brightness(0.82)]"
          />
        </div>
        <div
          className="absolute animate-[spin_30s_linear_infinite] [animation-direction:reverse]"
          style={{ left: "257.83px", top: "258.83px", width: "444.34px", height: "444.34px" }}
        >
          <Image
            src="/assets/figma/rombus-middle.svg"
            alt=""
            fill
            className="object-contain [filter:brightness(0.78)]"
          />
        </div>
        <div
          className="absolute animate-[spin_22s_linear_infinite]"
          style={{ left: "277.41px", top: "278.41px", width: "405.18px", height: "405.18px" }}
        >
          <Image src="/assets/figma/rombus-inner.svg" alt="" fill className="object-contain [filter:brightness(0.62)]" />
        </div>
      </div>
      <div
        className={`pointer-events-none absolute left-0 top-0 [transform:matrix(-1,0,0,1,1920,0)] transition-opacity duration-300 ${
          showCameraPermissionPanel ? "opacity-20" : "opacity-100"
        }`}
      >
        <div
          className="absolute left-[239px] top-[240px] h-[482px] w-[482px] animate-[spin_42s_linear_infinite]"
        >
          <Image
            src="/assets/figma/rombus-outer.svg"
            alt=""
            fill
            className="object-contain [filter:brightness(0.82)]"
          />
        </div>
        <div
          className="absolute animate-[spin_30s_linear_infinite] [animation-direction:reverse]"
          style={{ left: "257.83px", top: "258.83px", width: "444.34px", height: "444.34px" }}
        >
          <Image
            src="/assets/figma/rombus-middle.svg"
            alt=""
            fill
            className="object-contain [filter:brightness(0.78)]"
          />
        </div>
        <div
          className="absolute animate-[spin_22s_linear_infinite]"
          style={{ left: "277.41px", top: "278.41px", width: "405.18px", height: "405.18px" }}
        >
          <Image src="/assets/figma/rombus-inner.svg" alt="" fill className="object-contain [filter:brightness(0.62)]" />
        </div>
      </div>
      <div className="absolute left-[520px] top-[383px] h-[59px] w-[66px] cursor-pointer">
        <Image src="/assets/figma/camera-connector.svg" alt="" fill className="object-contain" />
      </div>
      <div
        className={`absolute transition-opacity duration-300 ${
          showCameraPermissionPanel ? "cursor-not-allowed opacity-25" : "cursor-pointer opacity-100"
        }`}
        style={{ left: "1336.67px", top: "521px", width: "66.33px", height: "59.37px" }}
        onClick={showCameraPermissionPanel ? undefined : openGalleryPicker}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (showCameraPermissionPanel) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openGalleryPicker();
          }
        }}
      >
        <Image src="/assets/figma/gallery-connector.svg" alt="" fill className="object-contain" />
      </div>
      <p className="absolute left-[592px] top-[366px] h-12 w-[167px] cursor-pointer text-[14px] font-normal uppercase leading-[24px] tracking-[0em] text-[#1A1B1C]">
        ALLOW A.I.
        <br />
        TO SCAN YOUR FACE
      </p>
      <p
        className={`absolute left-[1193px] top-[566px] h-12 w-[136px] text-right text-[14px] font-normal uppercase leading-[24px] tracking-[0em] text-[#1A1B1C] transition-opacity duration-300 ${
          showCameraPermissionPanel ? "cursor-not-allowed opacity-25" : "cursor-pointer opacity-100"
        }`}
        onClick={showCameraPermissionPanel ? undefined : openGalleryPicker}
      >
        ALLOW A.I.
        <br />
        ACCESS GALLERY
      </p>
      {selectedFileName ? (
        <p className="absolute left-1/2 top-[730px] -translate-x-1/2 text-[12px] uppercase tracking-[0.02em] text-[#1A1B1C] opacity-70">
          SELECTED: {selectedFileName}
        </p>
      ) : null}
      {isUploading ? (
        <p className="absolute left-1/2 top-[752px] -translate-x-1/2 text-[12px] uppercase tracking-[0.02em] text-[#1A1B1C] opacity-70">
          UPLOADING{" "}
          <span aria-hidden="true" className="inline-flex w-[14px] justify-between">
            <span ref={(node) => (uploadingDotRefs.current[0] = node)}>.</span>
            <span ref={(node) => (uploadingDotRefs.current[1] = node)}>.</span>
            <span ref={(node) => (uploadingDotRefs.current[2] = node)}>.</span>
          </span>
        </p>
      ) : null}
      {uploadStatus ? (
        <p
          ref={uploadStatusRef}
          className="absolute left-1/2 top-[752px] -translate-x-1/2 whitespace-nowrap text-[12px] uppercase tracking-[0.02em] text-[#1A1B1C] opacity-70"
          style={{ clipPath: "inset(0 100% 0 0)" }}
        >
          {uploadStatus}
        </p>
      ) : null}
      {uploadError ? (
        <p className="absolute left-1/2 top-[752px] -translate-x-1/2 text-[12px] uppercase tracking-[0.02em] text-[#B23A3A]">
          {uploadError}
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
          onClick={() => router.push("/start-analysis")}
        />
      </div>
    </section>
  );
}
