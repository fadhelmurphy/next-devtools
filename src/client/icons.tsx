import type { ReactNode } from "react";

const Svg = ({ children, size = 16 }: { children: ReactNode; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

/** Product mark: a frame with an inspector cursor in its corner. */
export const Mark = () => (
  <svg className="nd-mark" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="2.5" y="2.5" width="15" height="15" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M7 7.5 10.5 10 7 12.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13.2 13.2 21.5 16l-3.6 1.6-1.6 3.7z" fill="var(--accent, #9aa5ff)" stroke="var(--accent, #9aa5ff)" strokeWidth="1.4" strokeLinejoin="round" />
  </svg>
);

export const IconOverview = () => (
  <Svg>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="3.5" width="7" height="4.5" rx="1.5" />
    <rect x="13.5" y="11" width="7" height="9.5" rx="1.5" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
  </Svg>
);
export const IconRoutes = () => (
  <Svg>
    <circle cx="6" cy="5.5" r="2.2" />
    <circle cx="6" cy="18.5" r="2.2" />
    <circle cx="18" cy="12" r="2.2" />
    <path d="M6 7.7v8.6M6 12h9.8" />
  </Svg>
);
export const IconComponents = () => (
  <Svg>
    <path d="M8 6 3.5 12 8 18M16 6l4.5 6-4.5 6M13.5 4.5l-3 15" />
  </Svg>
);
export const IconAssets = () => (
  <Svg>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
    <circle cx="9" cy="10" r="1.8" />
    <path d="m20.5 15.5-4.5-4.5-8.5 8.5" />
  </Svg>
);
export const IconPerformance = () => (
  <Svg>
    <path d="M3.5 15a8.5 8.5 0 1 1 17 0" />
    <path d="m12 15 4-5" />
    <path d="M3.5 19h17" />
  </Svg>
);
export const IconSettings = () => (
  <Svg>
    <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="10" cy="17" r="2" />
  </Svg>
);
export const IconInspect = () => (
  <Svg>
    <path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3" />
    <circle cx="12" cy="12" r="5.5" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
  </Svg>
);
export const IconClose = () => (
  <Svg>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);
export const IconRefresh = () => (
  <Svg>
    <path d="M20 11a8 8 0 1 0-2.3 5.7" />
    <path d="M20 4.5V11h-6.5" />
  </Svg>
);
export const IconOpen = () => (
  <Svg>
    <path d="M14 4.5h5.5V10M19.5 4.5 11 13" />
    <path d="M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10" />
  </Svg>
);
export const IconChevron = () => (
  <svg viewBox="0 0 10 10" aria-hidden="true">
    <path d="M3.5 2 7 5 3.5 8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const IconGo = () => (
  <Svg>
    <path d="M5 12h13M13 6.5 18.5 12 13 17.5" />
  </Svg>
);
