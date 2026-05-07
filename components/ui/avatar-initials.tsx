import { cn } from "@/lib/utils";

const PALETTE = [
  "#F5D000", // brand
  "#1D4ED8",
  "#047857",
  "#B45309",
  "#BE123C",
  "#6D28D9",
  "#0891B2",
  "#7C3AED",
  "#0E7490",
  "#9333EA",
];

function hashColor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function initials(first: string, last: string) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();
}

interface Props {
  firstName: string;
  lastName: string;
  size?: number;
  className?: string;
}

export function AvatarInitials({ firstName, lastName, size = 32, className }: Props) {
  const bg = hashColor(`${firstName}${lastName}`);
  const fontSize = Math.round(size * 0.36);
  return (
    <span
      className={cn("inline-grid place-items-center rounded-full font-bold shrink-0", className)}
      style={{
        width: size,
        height: size,
        background: bg,
        color: "#171717",
        fontSize,
        letterSpacing: "0.02em",
      }}
    >
      {initials(firstName, lastName)}
    </span>
  );
}
