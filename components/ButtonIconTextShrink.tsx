"use client";

import type { MouseEventHandler } from "react";
import { useRef } from "react";
import { gsap } from "gsap";

type ButtonIconTextShrinkProps = {
  label: string;
  direction?: "left" | "right";
  frameWidthClass?: string;
  textWidthClass?: string;
  textClassName?: string;
  className?: string;
  expandOnHover?: boolean;
  expandMode?: "all" | "icon";
  baseWidth?: number;
  expandedWidth?: number;
  baseHeight?: number;
  expandedHeight?: number;
  baseGap?: number;
  expandedGap?: number;
  baseIconSize?: number;
  expandedIconSize?: number;
  onMouseEnter?: MouseEventHandler<HTMLDivElement>;
  onMouseLeave?: MouseEventHandler<HTMLDivElement>;
  onMouseMove?: MouseEventHandler<HTMLDivElement>;
  onClick?: () => void;
};

export default function ButtonIconTextShrink({
  label,
  direction = "left",
  frameWidthClass = "w-[150px]",
  textWidthClass = "w-[90px]",
  textClassName = "",
  className = "",
  expandOnHover = false,
  expandMode = "all",
  baseWidth = 150,
  expandedWidth = 150,
  baseHeight = 44,
  expandedHeight = 44,
  baseGap = 16,
  expandedGap = 16,
  baseIconSize = 44,
  expandedIconSize = 44,
  onMouseEnter,
  onMouseLeave,
  onMouseMove,
  onClick,
}: ButtonIconTextShrinkProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter: MouseEventHandler<HTMLDivElement> = (event) => {
    if (expandOnHover && rootRef.current && iconRef.current) {
      if (expandMode === "all") {
        gsap.to(rootRef.current, {
          width: expandedWidth,
          height: expandedHeight,
          gap: expandedGap,
          duration: 0.45,
          ease: "power3.out",
          overwrite: "auto",
        });
        gsap.to(iconRef.current, {
          width: expandedIconSize,
          height: expandedIconSize,
          duration: 0.45,
          ease: "power3.out",
          overwrite: "auto",
        });
      } else {
        gsap.to(iconRef.current, {
          scale: expandedIconSize / baseIconSize,
          duration: 0.45,
          ease: "power3.out",
          overwrite: "auto",
        });
      }
    }
    onMouseEnter?.(event);
  };

  const handleMouseLeave: MouseEventHandler<HTMLDivElement> = (event) => {
    if (expandOnHover && rootRef.current && iconRef.current) {
      if (expandMode === "all") {
        gsap.to(rootRef.current, {
          width: baseWidth,
          height: baseHeight,
          gap: baseGap,
          duration: 0.4,
          ease: "power3.out",
          overwrite: "auto",
        });
        gsap.to(iconRef.current, {
          width: baseIconSize,
          height: baseIconSize,
          duration: 0.4,
          ease: "power3.out",
          overwrite: "auto",
        });
      } else {
        gsap.to(iconRef.current, {
          scale: 1,
          duration: 0.4,
          ease: "power3.out",
          overwrite: "auto",
        });
      }
    }
    onMouseLeave?.(event);
  };

  const icon = (
    <div
      ref={iconRef}
      className="relative h-[44px] w-[44px]"
      style={{ transformOrigin: direction === "right" ? "left center" : "right center" }}
    >
      <svg className="h-full w-full" viewBox="0 0 44 44" fill="none" aria-hidden="true">
        <path d="M22 1L43 22L22 43L1 22L22 1Z" stroke="#1A1B1C" />
      </svg>
      <svg
        width="9.43"
        height="10.89"
        viewBox="0 0 9.43 10.89"
        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${
          direction === "right" ? "origin-center rotate-180" : ""
        }`}
        fill="none"
        aria-hidden="true"
      >
        <path d="M9.43 0L0 5.445L9.43 10.89V0Z" fill="#1A1B1C" />
      </svg>
    </div>
  );

  return (
    <div
      ref={rootRef}
      className={`inline-flex h-[44px] ${frameWidthClass} items-center gap-4 ${className}`}
      style={
        expandOnHover
          ? { width: `${baseWidth}px`, height: `${baseHeight}px`, gap: `${baseGap}px` }
          : undefined
      }
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={onMouseMove}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {direction === "left" && icon}
      <span
        className={`h-[16px] ${textWidthClass} text-[14px] font-semibold uppercase leading-[16px] tracking-[-0.02em] text-[#1A1B1C] ${textClassName} ${
          direction === "right" ? "text-right" : "text-left"
        }`}
      >
        {label}
      </span>
      {direction === "right" && icon}
    </div>
  );
}
