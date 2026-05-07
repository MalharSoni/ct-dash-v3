import Image from "next/image";
import { UnlockForm } from "@/components/system/UnlockForm";

export const metadata = { title: "Coach access" };

interface PageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function UnlockPage({ searchParams }: PageProps) {
  const { next } = await searchParams;

  return (
    <div className="min-h-dvh bg-mute-4 grid place-items-center px-4">
      <div className="w-full max-w-sm space-y-5">
        <div className="flex justify-center">
          <Image
            src="/logos/ctrc-mark-yellow.png"
            alt="CTRC"
            width={463}
            height={427}
            priority
            className="h-12 w-auto"
          />
        </div>

        <div className="bg-card border border-border rounded-[var(--radius)] shadow-card p-6 space-y-4">
          <div>
            <h1 className="text-[18px] font-extrabold tracking-tight">
              Coach access
            </h1>
            <p className="text-[12.5px] text-mute-1 mt-1">
              Enter the shared coach password to use the dashboard.
            </p>
          </div>
          <UnlockForm next={next ?? "/"} />
        </div>

        <p className="text-center text-[11.5px] text-mute-1">
          Looking for the public curriculum link?{" "}
          <a className="font-semibold text-foreground hover:underline" href="/c">
            View schedule →
          </a>
        </p>
      </div>
    </div>
  );
}
