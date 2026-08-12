import type { ReactNode } from "react";

/**
 * Circular call control button.
 *
 * Visual contract migrated verbatim from the IM H5 chat surface
 * (`sdkwork-im-h5-chat/components/Chat/CallControlButton.tsx`): a rounded
 * pill whose variant is danger (red), active (white), or default
 * (translucent white over dark glass) with an optional label beneath.
 */

export type RtcCallControlButtonVariant = "danger" | "active" | "default";

export interface RtcCallControlButtonProps {
  icon: ReactNode;
  label?: string;
  variant?: RtcCallControlButtonVariant;
  disabled?: boolean;
  onClick?: () => void;
  size?: "md" | "lg";
  title?: string;
}

export function RtcCallControlButton({
  icon,
  label,
  variant = "default",
  disabled = false,
  onClick,
  size = "lg",
  title,
}: RtcCallControlButtonProps) {
  const sizeClass = size === "lg" ? "rtc-call-btn-lg" : "rtc-call-btn-md";
  const variantClass =
    variant === "danger"
      ? "rtc-call-btn-danger"
      : variant === "active"
        ? "rtc-call-btn-active"
        : "rtc-call-btn-default";

  return (
    <div className="rtc-call-control" aria-disabled={disabled}>
      <button
        type="button"
        className={`rtc-call-btn ${sizeClass} ${variantClass}`}
        onClick={onClick}
        disabled={disabled}
        title={title}
        aria-label={title ?? label}
      >
        {icon}
      </button>
      {label && <span className="rtc-call-control-label">{label}</span>}
    </div>
  );
}
