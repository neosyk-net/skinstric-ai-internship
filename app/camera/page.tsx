"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { gsap } from "gsap";
import Header from "../../components/header/Header";
import ButtonIconTextShrink from "../../components/ButtonIconTextShrink";

const PHASE_TWO_ENDPOINT =
  "https://us-central1-frontend-simplified.cloudfunctions.net/skinstricPhaseTwo";
const CAMERA_SETUP_MIN_LOADING_MS = 2200;
const SETUP_DOT_STAGGER_SECONDS = 0.16;
const SETUP_DOT_MOVE_SECONDS = 0.16;
const SETUP_REPEAT_DELAY_SECONDS = 0.24;

const dataUrlToBase64 = (dataUrl: string) => dataUrl.split(",")[1] ?? "";

export default function CameraPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);
  const proceedButtonRef = useRef<HTMLDivElement>(null);
  const setupDotRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState("");
  const [isCameraInitializing, setIsCameraInitializing] = useState(true);
  const [capturedPhotoDataUrl, setCapturedPhotoDataUrl] = useState("");
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [hasApprovedPhoto, setHasApprovedPhoto] = useState(false);
  const [isProceeding, setIsProceeding] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const setupStartedAt = Date.now();

    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        if (isMounted) setCameraError("Camera is not supported on this device.");
        if (isMounted) {
          const elapsed = Date.now() - setupStartedAt;
          const remaining = Math.max(0, CAMERA_SETUP_MIN_LOADING_MS - elapsed);
          window.setTimeout(() => {
            if (!isMounted) return;
            setIsCameraInitializing(false);
          }, remaining);
        }
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
          },
          audio: false,
        });

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        if (isMounted) {
          const elapsed = Date.now() - setupStartedAt;
          const remaining = Math.max(0, CAMERA_SETUP_MIN_LOADING_MS - elapsed);
          window.setTimeout(() => {
            if (!isMounted) return;
            setIsCameraInitializing(false);
          }, remaining);
        }
      } catch {
        if (isMounted) setCameraError("Camera access was denied or unavailable.");
        if (isMounted) {
          const elapsed = Date.now() - setupStartedAt;
          const remaining = Math.max(0, CAMERA_SETUP_MIN_LOADING_MS - elapsed);
          window.setTimeout(() => {
            if (!isMounted) return;
            setIsCameraInitializing(false);
          }, remaining);
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const handleCapture = () => {
    if (!videoRef.current || !captureCanvasRef.current) return;
    setHasApprovedPhoto(false);
    const video = videoRef.current;
    const canvas = captureCanvasRef.current;
    if (!video.videoWidth || !video.videoHeight) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    setCapturedPhotoDataUrl(canvas.toDataURL("image/jpeg", 0.92));
    setIsPreviewMode(true);
  };

  const handleRetake = () => {
    setCapturedPhotoDataUrl("");
    setIsPreviewMode(false);
    setHasApprovedPhoto(false);
  };

  const handleUsePhoto = () => {
    if (!capturedPhotoDataUrl) return;
    localStorage.setItem("skinstric_captured_photo_preview", capturedPhotoDataUrl);
    setIsPreviewMode(false);
    setHasApprovedPhoto(true);
  };

  const handleProceed = async () => {
    if (!hasApprovedPhoto || !capturedPhotoDataUrl || isProceeding) return;

    const base64Image = dataUrlToBase64(capturedPhotoDataUrl);
    if (!base64Image) {
      setCameraError("Could not process captured image.");
      return;
    }

    setIsProceeding(true);
    try {
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
      localStorage.setItem("skinstric_uploaded_file_name", "camera-capture.jpg");
      localStorage.setItem("skinstric_phase_two_response", JSON.stringify(payload));
      router.push("/loading");
    } catch {
      setCameraError("Could not upload captured image right now. Please try again.");
      setIsProceeding(false);
    }
  };

  const handleBack = () => {
    if (!isPreviewMode && hasApprovedPhoto && capturedPhotoDataUrl) {
      setIsPreviewMode(true);
      return;
    }
    router.push("/scan-options");
  };

  useEffect(() => {
    if (!proceedButtonRef.current || !hasApprovedPhoto || capturedPhotoDataUrl) return;

    gsap.fromTo(
      proceedButtonRef.current,
      { x: 56, autoAlpha: 0, scale: 0.98 },
      { x: 0, autoAlpha: 1, scale: 1, duration: 0.5, ease: "power3.out", overwrite: "auto" },
    );
  }, [hasApprovedPhoto, capturedPhotoDataUrl]);

  useEffect(() => {
    if (!isCameraInitializing) return;

    const dots = setupDotRefs.current.filter((dot): dot is HTMLSpanElement => Boolean(dot));
    if (!dots.length) return;

    const timeline = gsap.timeline({
      repeat: -1,
      repeatDelay: SETUP_REPEAT_DELAY_SECONDS,
      defaults: { overwrite: "auto" },
    });

    gsap.set(dots, { y: 0, opacity: 0.46 });
    dots.forEach((dot, index) => {
      const startAt = index * SETUP_DOT_STAGGER_SECONDS;
      timeline
        .to(
          dot,
          {
            y: -4,
            opacity: 1,
            duration: SETUP_DOT_MOVE_SECONDS,
            ease: "power2.out",
          },
          startAt,
        )
        .to(
          dot,
          {
            y: 0,
            opacity: 0.46,
            duration: SETUP_DOT_MOVE_SECONDS,
            ease: "power2.in",
          },
          startAt + SETUP_DOT_MOVE_SECONDS,
        );
    });

    return () => {
      timeline.kill();
    };
  }, [isCameraInitializing]);

  return (
    <section className="relative h-[100dvh] w-full overflow-hidden bg-[#0E0F10]">
      <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" autoPlay muted playsInline />
      {capturedPhotoDataUrl ? (
        <img src={capturedPhotoDataUrl} alt="Captured preview" className="absolute inset-0 h-full w-full object-cover" />
      ) : null}
      <canvas ref={captureCanvasRef} className="hidden" />
      <div className="absolute inset-0 bg-black/20" />

      <div className="absolute left-0 top-0 z-10">
        <Header showEnterCodeButton={false} locationLabel="ANALYSIS" color="light" />
      </div>

      {!capturedPhotoDataUrl ? (
        <>
          <p className="absolute left-[1719px] top-[472px] z-10 h-4 w-[91px] whitespace-nowrap text-[14px] font-semibold uppercase leading-[16px] tracking-[-0.02em] text-[#FCFCFC] opacity-70">
            TAKE PICTURE
          </p>
          <button
            type="button"
            aria-label="Take picture"
            className="absolute left-[1826px] top-[449px] z-10 inline-flex h-[62px] w-[62px] items-center justify-center transition-transform duration-200 ease-out hover:scale-105"
            onClick={handleCapture}
          >
            <Image src="/assets/figma/camera-click.svg" alt="" fill className="object-contain" />
          </button>
        </>
      ) : null}

      {cameraError ? (
        <p className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap bg-black/55 px-4 py-2 text-[12px] uppercase tracking-[0.02em] text-[#FCFCFC]">
          {cameraError}
        </p>
      ) : null}
      {capturedPhotoDataUrl ? (
        <p className="absolute left-[917px] top-[254px] z-10 h-6 w-[86px] text-center text-[14px] font-normal uppercase leading-[24px] tracking-[0em] text-[#FCFCFC]">
          GREAT SHOT!
        </p>
      ) : null}

      {!isPreviewMode ? (
        <>
          <p className="absolute left-1/2 top-[824px] z-10 w-[297px] -translate-x-1/2 whitespace-nowrap text-center text-[14px] font-normal uppercase leading-[24px] tracking-[0em] text-[#FCFCFC]">
            TO GET BETTER RESULTS MAKE SURE TO HAVE
          </p>
          <div className="absolute left-[688px] top-[864px] z-10 inline-flex h-6 w-[492px] items-center gap-8">
            <div className="inline-flex h-6 items-center gap-[5px]">
              <span className="inline-block h-[7px] w-[7px] rotate-45 border border-[#FCFCFC]" aria-hidden="true" />
              <span className="whitespace-nowrap text-[14px] font-normal uppercase leading-[24px] tracking-[0em] text-[#FCFCFC]">
                NEUTRAL EXPRESSION
              </span>
            </div>
            <div className="inline-flex h-6 items-center gap-[5px]">
              <span className="inline-block h-[7px] w-[7px] rotate-45 border border-[#FCFCFC]" aria-hidden="true" />
              <span className="whitespace-nowrap text-[14px] font-normal uppercase leading-[24px] tracking-[0em] text-[#FCFCFC]">
                FRONTAL POSE
              </span>
            </div>
            <div className="inline-flex h-6 items-center gap-[5px]">
              <span className="inline-block h-[7px] w-[7px] rotate-45 border border-[#FCFCFC]" aria-hidden="true" />
              <span className="whitespace-nowrap text-[14px] font-normal uppercase leading-[24px] tracking-[0em] text-[#FCFCFC]">
                ADEQUATE LIGHTING
              </span>
            </div>
          </div>
        </>
      ) : null}
      {isPreviewMode ? (
        <div className="absolute left-1/2 top-[755px] z-10 w-[384px] -translate-x-1/2">
          <p className="mb-3 text-center text-[22px] font-normal leading-[24px] text-[#FCFCFC]">Preview</p>
          <div className="inline-flex w-full items-center justify-center gap-6">
            <button
              type="button"
              className="inline-flex h-[35px] w-[80px] items-center justify-center whitespace-nowrap bg-[#FCFCFC] px-4 pb-[10px] pt-[9px] text-[14px] font-semibold leading-[16px] text-[#0E0F10] transition-opacity duration-200 hover:opacity-85"
              onClick={handleRetake}
            >
              Retake
            </button>
            <button
              type="button"
              className="inline-flex h-[35px] w-[143px] items-center justify-center whitespace-nowrap bg-[#101318] px-4 pb-[10px] pt-[9px] text-[14px] font-semibold leading-[16px] text-[#FCFCFC] transition-opacity duration-200 hover:opacity-85"
              onClick={handleUsePhoto}
            >
              Use This Photo
            </button>
          </div>
        </div>
      ) : null}

      <div className="absolute bottom-9 left-8 z-10">
        <ButtonIconTextShrink
          label="BACK"
          direction="left"
          frameWidthClass="w-[97px]"
          textWidthClass="w-[37px]"
          textClassName="text-[#FCFCFC] opacity-80"
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
          iconColor="#FCFCFC"
          onClick={handleBack}
        />
      </div>
      {!isPreviewMode && hasApprovedPhoto ? (
        <div ref={proceedButtonRef} className="absolute bottom-9 right-8 z-10">
          <ButtonIconTextShrink
            label="PROCEED"
            direction="right"
            frameWidthClass="w-[123px]"
            textWidthClass="w-[63px]"
            textClassName="text-[#FCFCFC]"
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
            expandedIconSize={54}
            iconColor="#FCFCFC"
            onClick={isProceeding ? undefined : handleProceed}
          />
        </div>
      ) : null}
      {isCameraInitializing && !cameraError ? (
        <div className="absolute inset-0 z-30 bg-[#FCFCFC]">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[56%]">
            <div className="relative h-[482px] w-[482px]">
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
              <div className="absolute left-1/2 top-1/2 h-[136px] w-[136px] -translate-x-1/2 -translate-y-1/2">
                <Image src="/assets/figma/camera.svg" alt="Setting up camera" fill className="object-contain" />
              </div>
            </div>
          </div>
          <p className="absolute left-[846px] top-[514px] h-6 w-[227px] text-center text-[16px] font-semibold uppercase leading-[24px] tracking-[-0.02em] text-[#1A1B1C]">
            SETTING UP CAMERA{" "}
            <span aria-hidden="true" className="inline-flex w-[14px] justify-between">
              <span ref={(node) => (setupDotRefs.current[0] = node)}>.</span>
              <span ref={(node) => (setupDotRefs.current[1] = node)}>.</span>
              <span ref={(node) => (setupDotRefs.current[2] = node)}>.</span>
            </span>
          </p>
        </div>
      ) : null}
    </section>
  );
}
