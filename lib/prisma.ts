import { PrismaClient } from "@prisma/client";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

// Required for Neon's WebSocket transport in Node runtime.
neonConfig.webSocketConstructor = ws;

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function makeClient() {
  const connectionString =
    process.env.DIRECT_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL or DIRECT_URL must be set");
  }

  // PrismaNeon takes pool config; it constructs the Pool internally.
  const adapter = new PrismaNeon({ connectionString });

  return new PrismaClient({ adapter });
}

export const prisma = globalThis.__prisma ?? makeClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
