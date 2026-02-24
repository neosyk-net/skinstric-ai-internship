type ButtonIconTextShrinkProps = {
  label: string;
  direction?: "left" | "right";
  frameWidthClass?: string;
  textWidthClass?: string;
  className?: string;
};

export default function ButtonIconTextShrink({
  label,
  direction = "left",
  frameWidthClass = "w-[150px]",
  textWidthClass = "w-[90px]",
  className = "",
}: ButtonIconTextShrinkProps) {
  const icon = (
    <div className="relative h-[44px] w-[44px]">
      <svg className="h-full w-full" viewBox="0 0 44 44" fill="none" aria-hidden="true">
        <path d="M22 1L43 22L22 43L1 22L22 1Z" stroke="#1A1B1C" />
      </svg>
      <svg
        width="9.43"
        height="10.89"
        viewBox="0 0 9.43 10.89"
        className={`absolute top-[16.56px] ${
          direction === "right"
            ? "left-[18.71px] origin-center rotate-180"
            : "left-[15.71px]"
        }`}
        fill="none"
        aria-hidden="true"
      >
        <path d="M9.43 0L0 5.445L9.43 10.89V0Z" fill="#1A1B1C" />
      </svg>
    </div>
  );

  return (
    <div className={`inline-flex h-[44px] ${frameWidthClass} items-center gap-4 ${className}`}>
      {direction === "left" && icon}
      <span
        className={`h-[16px] ${textWidthClass} text-[14px] font-semibold uppercase leading-[16px] tracking-[-0.02em] text-[#1A1B1C] opacity-70 ${
          direction === "right" ? "text-right" : "text-left"
        }`}
      >
        {label}
      </span>
      {direction === "right" && icon}
    </div>
  );
}
