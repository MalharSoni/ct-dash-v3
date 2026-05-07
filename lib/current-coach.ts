import { cookies } from "next/headers";
import { prisma } from "./prisma";

const COACH_COOKIE = "ctd-coach";

/**
 * Returns the active coach. We use a cookie to remember which coach is
 * currently driving the iPad (H3 — quick switcher). If no cookie or stale,
 * we fall back to the first active coach so the app keeps working out of
 * the box.
 */
export async function getCurrentCoach() {
  const jar = await cookies();
  const cookieId = jar.get(COACH_COOKIE)?.value;

  if (cookieId) {
    const c = await prisma.coach.findUnique({ where: { id: cookieId } });
    if (c?.active) return c;
  }

  const fallback = await prisma.coach.findFirst({
    where: { active: true },
    orderBy: { createdAt: "asc" },
  });
  if (!fallback) {
    throw new Error(
      "No coach record found. Run `npm run db:seed` to bootstrap."
    );
  }
  return fallback;
}

export const COACH_COOKIE_NAME = COACH_COOKIE;
