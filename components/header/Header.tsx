"use client";

import EnterCodeButton from "./EnterCodeButton";
import Location from "./Location";
import { usePathname, useRouter } from "next/navigation";

type HeaderProps = {
  showEnterCodeButton?: boolean;
  locationLabel?: string;
  color?: "dark" | "light";
};

export default function Header({ showEnterCodeButton = true, locationLabel = "INTRO", color = "dark" }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const canNavigateHome = pathname !== "/";
  const titleColorClass = color === "light" ? "text-[#FCFCFC]" : "text-[#1A1B1C]";
  const locationColorClass = color === "light" ? "text-[#FCFCFC]" : "text-[#1A1B1C] opacity-60";

  return (
    <header className="absolute left-0 top-0 w-full">
      <div className="relative h-[64px] w-full">
        {/* Left group: SKINSTRIC + [ INTRO ] */}
        <button
          type="button"
          className={`absolute left-8 top-[23px] flex h-[17px] items-center text-[14px] uppercase leading-[16px] ${titleColorClass} ${
            canNavigateHome ? "cursor-pointer" : "cursor-default"
          }`}
          onClick={() => {
            if (!canNavigateHome) return;
            router.push("/");
          }}
          aria-label="Go to landing page"
        >
          <span className="inline-block h-[16px] w-[69px] font-semibold tracking-[-0.02em]">
            SKINSTRIC
          </span>
          <Location label={locationLabel} className={locationColorClass} />
        </button>

        {/* Right button */}
        {showEnterCodeButton ? <EnterCodeButton /> : null}
      </div>
    </header>
  );
}
