import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ students: [] });

  const students = await prisma.student.findMany({
    where: {
      active: true,
      OR: [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { parentName: { contains: q, mode: "insensitive" } },
      ],
    },
    take: 8,
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return NextResponse.json({
    students: students.map((s) => ({
      id: s.id,
      label: `${s.firstName} ${s.lastName}`,
      sub: s.track,
      href: `/students/${s.id}`,
    })),
  });
}
