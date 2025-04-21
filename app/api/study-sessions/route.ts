import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });
  const sessions = await prisma.studySession.findMany({
    where: { userId: session.user.id },
    include: { workType: true },
  });
  return Response.json(sessions);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { date, duration, workTypeId } = await req.json();
    
    // Validate required fields
    if (!date || !duration || !workTypeId) {
      return NextResponse.json({ error: "Date, duration, and workTypeId are required" }, { status: 400 });
    }
    
    // Verify work type belongs to user
    const workType = await prisma.workType.findFirst({
      where: {
        id: workTypeId,
        userId: session.user.id,
      },
    });
    
    if (!workType) {
      return NextResponse.json({ error: "Invalid work type" }, { status: 400 });
    }
    
    const created = await prisma.studySession.create({
      data: {
        date: new Date(date),
        duration,
        userId: session.user.id,
        workTypeId,
      },
      include: { workType: true },
    });
    
    return NextResponse.json(created);
  } catch (error) {
    console.error("Error creating study session:", error);
    return NextResponse.json({ error: "Failed to create study session" }, { status: 500 });
  }
} 