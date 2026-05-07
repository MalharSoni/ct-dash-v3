"use client";

import { useRouter } from "next/navigation";

interface Props {
  date: string;
}

export function DatePicker({ date }: Props) {
  const router = useRouter();
  return (
    <input
      type="date"
      value={date}
      onChange={(e) => {
        const v = e.target.value;
        if (!v) return;
        router.push(`/attendance?d=${v}`);
      }}
      className="bg-card border border-border rounded-[var(--radius-sm)] px-3 py-1.5 text-[13px] h-8"
    />
  );
}
