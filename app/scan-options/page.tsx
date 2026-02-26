"use client";

import { ChangeEvent, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Header from "../../components/header/Header";
import ButtonIconTextShrink from "../../components/ButtonIconTextShrink";

export default function ScanOptionsPage() {
  const router = useRouter();
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileName, setSelectedFileName] = useState("");

  const openGalleryPicker = () => {
    galleryInputRef.current?.click();
  };

  const handleGalleryChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFileName(file.name);
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

      <button className="absolute left-[412px] top-[413px] h-[136px] w-[136px] cursor-pointer">
        <Image src="/assets/figma/camera.svg" alt="Allow A.I. to scan your face" fill className="object-contain" />
      </button>
      <button
        className="absolute left-[1372px] top-[413px] h-[136px] w-[136px] cursor-pointer"
        onClick={openGalleryPicker}
      >
        <Image src="/assets/figma/gallery.svg" alt="Allow A.I. access gallery" fill className="object-contain" />
      </button>
      <div className="pointer-events-none absolute left-0 top-0">
        <div className="absolute left-[239px] top-[240px] h-[482px] w-[482px] animate-[spin_42s_linear_infinite]">
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
      <div className="pointer-events-none absolute left-0 top-0 [transform:matrix(-1,0,0,1,1920,0)]">
        <div className="absolute left-[239px] top-[240px] h-[482px] w-[482px] animate-[spin_42s_linear_infinite]">
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
        className="absolute cursor-pointer"
        style={{ left: "1336.67px", top: "521px", width: "66.33px", height: "59.37px" }}
        onClick={openGalleryPicker}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
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
        className="absolute left-[1193px] top-[566px] h-12 w-[136px] cursor-pointer text-right text-[14px] font-normal uppercase leading-[24px] tracking-[0em] text-[#1A1B1C]"
        onClick={openGalleryPicker}
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
