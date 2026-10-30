import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { exportUserData } from "@/server/privacy";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const data = await exportUserData(session.user.id);
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="dpp-designer-dati.json"',
    },
  });
}
