import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  try {
    const types = await prisma.workType.findMany({
      where: { userId: session.user.id },
      select: { id: true, label: true },
    });
    return NextResponse.json(types);
  } catch (error) {
    console.error("Error fetching work types:", error);
    return NextResponse.json({ error: "Failed to fetch work types" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  try {
    const { label } = await req.json();
    
    if (!label) {
      return NextResponse.json(
        { error: "Label is required" },
        { status: 400 }
      );
    }
    
    // Check if work type already exists for this user
    const existingType = await prisma.workType.findFirst({
      where: {
        label,
        userId: session.user.id,
      },
    });
    
    if (existingType) {
      return NextResponse.json(
        { error: "Work type already exists" },
        { status: 400 }
      );
    }
    
    const created = await prisma.workType.create({
      data: { label, userId: session.user.id },
      select: { id: true, label: true },
    });
    return NextResponse.json(created);
  } catch (error) {
    console.error("Error creating work type:", error);
    return NextResponse.json({ error: "Failed to create work type" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });
  const { label } = await req.json();
  await prisma.workType.deleteMany({ where: { userId: session.user.id, label } });
  return Response.json({ ok: true });
} 