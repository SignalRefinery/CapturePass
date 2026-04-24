import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "Token route is not wired yet." },
    { status: 501 }
  );
}