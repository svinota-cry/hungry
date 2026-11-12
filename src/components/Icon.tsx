import type { CSSProperties, ReactNode } from "react";

export type IconName =
  | "today" | "diary" | "search" | "history" | "stats" | "notes" | "profile"
  | "plus" | "minus" | "close" | "trash" | "edit" | "left" | "right" | "check"
  | "eye" | "eyeOff" | "download" | "upload" | "droplet" | "flame" | "arrow"
  | "menu" | "spark" | "scale" | "more" | "calendar" | "skull";

const P: Record<IconName, ReactNode> = {
  today: (
    <>
      <circle cx="12" cy="12" r="7.5" />
      <circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none" />
      <path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3" />
    </>
  ),
  diary: (
    <>
      <path d="M5 3.5h13a1.5 1.5 0 0 1 1.5 1.5v15A1 1 0 0 1 18.5 21H5z" />
      <path d="M5 3.5A1.5 1.5 0 0 0 3.5 5v14A1.5 1.5 0 0 0 5 20.5" />
      <path d="M8 8h7M8 12h7M8 16h4" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 5 5" />
    </>
  ),
  history: (
    <>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3.5 8.5" />
      <path d="M3.5 3.5v5h5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  stats: (
    <>
      <path d="M4 20V10M9.5 20V4M15 20v-7M20.5 20V7" />
    </>
  ),
  notes: (
    <>
      <path d="M4 20h4l11-11a2.1 2.1 0 0 0-3-3L5 17z" />
      <path d="m14.5 6.5 3 3" />
      <path d="M4 20h16" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="3.8" />
      <path d="M4.5 20.5c.6-3.9 3.6-6 7.5-6s6.9 2.1 7.5 6" />
    </>
  ),
  plus: <path d="M12 4v16M4 12h16" />,
  minus: <path d="M4 12h16" />,
  close: <path d="m5 5 14 14M19 5 5 19" />,
  trash: (
    <>
      <path d="M4 7h16M9 3.5h6M6.5 7l1 13.5h9L18 7" />
      <path d="M10 11v6M14 11v6" />
    </>
  ),
  edit: (
    <>
      <path d="M4 20h4l11-11a2.1 2.1 0 0 0-3-3L5 17z" />
      <path d="m14.5 6.5 3 3" />
    </>
  ),
  left: <path d="M15 4 7 12l8 8" />,
  right: <path d="m9 4 8 8-8 8" />,
  check: <path d="m4 12.5 5 5L20 6.5" />,
  eye: (
    <>
      <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M3 3l18 18" />
      <path d="M10.6 6.1A11 11 0 0 1 12 5.5c6.4 0 10 6.5 10 6.5a17 17 0 0 1-3.2 4M6.5 7.8A16 16 0 0 0 2 12s3.6 6.5 10 6.5c1.4 0 2.7-.3 3.8-.8" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12M7 10l5 5 5-5" />
      <path d="M4 20h16" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16V4M7 9l5-5 5 5" />
      <path d="M4 20h16" />
    </>
  ),
  droplet: <path d="M12 2.5s6.5 7.2 6.5 12a6.5 6.5 0 1 1-13 0c0-4.8 6.5-12 6.5-12Z" />,
  flame: (
    <>
      <path d="M12 21c3.6 0 6.5-2.7 6.5-6.3 0-4.6-5.2-7.2-4.3-12.2-3.1 1.1-5.4 4-5.4 6.6 0 1.2.4 2 .4 2s-2-1-2-3.2C5.6 10 5.5 12 5.5 14.2 5.5 18 8.4 21 12 21Z" />
    </>
  ),
  arrow: <path d="M5 19 19 5M9 5h10v10" />,
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
  spark: (
    <>
      <path d="M12 2v5M12 17v5M2 12h5M17 12h5" />
      <path d="m5.6 5.6 3 3M15.4 15.4l3 3M18.4 5.6l-3 3M8.6 15.4l-3 3" />
    </>
  ),
  scale: (
    <>
      <rect x="3" y="5" width="18" height="15" rx="2" />
      <path d="M8 10.5a4 4 0 0 1 8 0" />
      <path d="M12 10.5 14 8" />
    </>
  ),
  more: (
    <>
      <circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  skull: (
    <>
      <path d="M12 2.5c-4.4 0-7.5 3-7.5 7.2 0 2.7 1.2 4.2 2.5 5.3v3.5h10v-3.5c1.3-1.1 2.5-2.6 2.5-5.3 0-4.2-3.1-7.2-7.5-7.2Z" />
      <circle cx="9" cy="10" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="15" cy="10" r="1.5" fill="currentColor" stroke="none" />
      <path d="M10 20v1.5M14 20v1.5" />
    </>
  ),
};

export function Icon({
  name,
  size = 20,
  className,
  style,
}: {
  name: IconName;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      className={className}
      style={style}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {P[name]}
    </svg>
  );
}
