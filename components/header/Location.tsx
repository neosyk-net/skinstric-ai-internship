export default function Location() {
  return (
    <div className="ml-4 flex h-[17px] w-[61px] items-center gap-[6px] text-[#1A1B1C] opacity-60">
      {/* Left bracket */}
      <span className="inline-block h-[17px] w-[4px] rounded-l-[2px] border border-r-0 border-current" />

      {/* Text */}
      <span className="h-[16px] w-[41px] text-[14px] font-semibold uppercase leading-[16px] tracking-[-0.02em]">
        INTRO
      </span>

      {/* Right bracket */}
      <span className="inline-block h-[17px] w-[4px] rounded-r-[2px] border border-l-0 border-current" />
    </div>
  );
}
