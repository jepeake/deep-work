import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// DELETE - Delete a work type by ID
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: "Work type ID is required" },
        { status: 400 }
      );
    }
    
    // Verify work type belongs to user
    const workType = await prisma.workType.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });
    
    if (!workType) {
      return NextResponse.json(
        { error: "Work type not found" },
        { status: 404 }
      );
    }
    
    await prisma.workType.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting work type:", error);
    return NextResponse.json({ error: "Failed to delete work type" }, { status: 500 });
  }
} 