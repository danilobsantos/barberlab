import { db } from "@/app/_lib/prisma"

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`
    return Response.json({ status: "ok" })
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503 })
  }
}
