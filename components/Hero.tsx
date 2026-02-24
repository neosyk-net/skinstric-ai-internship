import Header from "./header/Header";
import ButtonIconTextShrink from "./ButtonIconTextShrink";

export default function Hero() {
  return (
    <section className="relative mx-auto h-[960px] w-[1920px] overflow-hidden bg-[#FCFCFC]">
      {/* Side guide rectangles */}
      <div className="pointer-events-none absolute left-0 top-[178px] h-[604px] w-[302px]">
        <img
          src="/assets/figma/hero-guide-left.svg"
          alt=""
          className="h-full w-full"
        />
      </div>
      <div className="pointer-events-none absolute right-0 top-[178px] h-[604px] w-[302px]">
        <img
          src="/assets/figma/hero-guide-right.svg"
          alt=""
          className="h-full w-full"
        />
      </div>
      
      <Header />

      {/* Center Headline */}
      <h1 className="absolute left-[620px] top-[361px] h-[240px] w-[680px] text-center text-[128px] font-light leading-[120px] tracking-[-0.07em] text-[#1A1B1C]">
        Sophisticated <br /> Skincare
      </h1>

      {/* Left CTA */}
      <ButtonIconTextShrink
        label="DISCOVER A.I."
        direction="left"
        className="absolute left-8 top-[458px]"
      />

      {/* Right CTA */}
      <ButtonIconTextShrink
        label="TAKE TEST"
        direction="right"
        frameWidthClass="w-[127px]"
        textWidthClass="w-[67px]"
        className="absolute left-[1761px] top-[458px]"
      />

      {/* Bottom Description */}
      <div className="absolute left-8 top-[862px] h-[72px] w-[316px] text-[14px] font-normal uppercase leading-[24px] tracking-[0em] text-[#1A1B1C]">
        Skinstric developed an A.I. that creates a highly-personalised routine tailored to what your skin needs.
      </div>
    </section>
  );
}
