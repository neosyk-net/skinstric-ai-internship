import EnterCodeButton from "./EnterCodeButton";
import Location from "./Location";

type HeaderProps = {
  showEnterCodeButton?: boolean;
};

export default function Header({ showEnterCodeButton = true }: HeaderProps) {
  return (
    <header className="absolute left-0 top-0 w-full">
      <div className="relative h-[64px] w-full">
        {/* Left group: SKINSTRIC + [ INTRO ] */}
        <div className="absolute left-8 top-[23px] flex h-[17px] items-center text-[14px] uppercase leading-[16px] text-[#1A1B1C]">
          <span className="inline-block h-[16px] w-[69px] font-semibold tracking-[-0.02em]">
            SKINSTRIC
          </span>
          <Location />
        </div>

        {/* Right button */}
        {showEnterCodeButton ? <EnterCodeButton /> : null}
      </div>
    </header>
  );
}
