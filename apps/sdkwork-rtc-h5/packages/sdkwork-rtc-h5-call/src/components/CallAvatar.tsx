/**
 * Caller avatar with a pulsing ring while the call is ringing.
 */

export interface RtcCallAvatarProps {
  name?: string;
  avatarUrl?: string;
  ringing?: boolean;
  size?: "md" | "lg" | "xl";
}

function initialsOf(name: string | undefined): string {
  const trimmed = name?.trim();
  if (!trimmed) {
    return "?";
  }
  const parts = trimmed.split(/\s+/u).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

export function RtcCallAvatar({ name, avatarUrl, ringing = false, size = "lg" }: RtcCallAvatarProps) {
  const sizeClass = size === "xl" ? "rtc-call-avatar-xl" : size === "md" ? "rtc-call-avatar-md" : "rtc-call-avatar-lg";

  return (
    <div className={`rtc-call-avatar-wrap ${sizeClass}`}>
      {ringing && <span className="rtc-call-avatar-ring" aria-hidden="true" />}
      {avatarUrl ? (
        <img
          className="rtc-call-avatar-img"
          src={avatarUrl}
          alt={name ?? ""}
          loading="lazy"
        />
      ) : (
        <div className="rtc-call-avatar-fallback" aria-hidden="true">
          {initialsOf(name)}
        </div>
      )}
    </div>
  );
}
