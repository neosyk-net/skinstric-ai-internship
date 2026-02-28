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
    <header className="absolute left-0 top-0 z-20 w-full">
      <nav className="box-border flex h-16 w-full items-center justify-between px-8 py-3" aria-label="Primary">
        <button
          type="button"
          className={`m-0 inline-flex h-[17px] appearance-none items-center border-0 bg-transparent p-0 text-left text-[14px] uppercase leading-[16px] ${titleColorClass} ${
            canNavigateHome ? "cursor-pointer" : "cursor-default"
          }`}
          onClick={() => {
            if (!canNavigateHome) return;
            router.push("/");
          }}
          aria-label="Go to landing page"
        >
          <span className="inline-block h-[16px] w-[69px] font-semibold tracking-[-0.02em]">SKINSTRIC</span>
          <Location label={locationLabel} className={locationColorClass} />
        </button>

        {showEnterCodeButton ? <EnterCodeButton /> : null}
      </nav>
    </header>
  );
}
