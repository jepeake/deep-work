import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET - List all tasks for current user
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const workTypeId = searchParams.get("workTypeId");
    
    const tasks = await prisma.task.findMany({
      where: {
        userId: session.user.id,
        ...(workTypeId ? { workTypeId } : {}),
      },
      include: {
        workType: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

// POST - Create a new task
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { title, workTypeId, dueDate } = await req.json();
    
    if (!title || !workTypeId) {
      return NextResponse.json(
        { error: "Title and work type are required" },
        { status: 400 }
      );
    }
    
    // Verify work type belongs to user
    const workType = await prisma.workType.findFirst({
      where: {
        id: workTypeId,
        userId: session.user.id,
      },
    });
    
    if (!workType) {
      return NextResponse.json(
        { error: "Invalid work type" },
        { status: 400 }
      );
    }
    
    const task = await prisma.task.create({
      data: {
        title,
        dueDate: dueDate ? new Date(dueDate) : null,
        userId: session.user.id,
        workTypeId,
      },
      include: {
        workType: true,
      },
    });
    
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}

// PATCH - Update a task
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id, completed, title, workTypeId, dueDate } = await req.json();
    
    if (!id) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }
    
    // Verify task belongs to user
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });
    
    if (!existingTask) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }
    
    // If changing work type, verify it belongs to user
    if (workTypeId && workTypeId !== existingTask.workTypeId) {
      const workType = await prisma.workType.findFirst({
        where: {
          id: workTypeId,
          userId: session.user.id,
        },
      });
      
      if (!workType) {
        return NextResponse.json(
          { error: "Invalid work type" },
          { status: 400 }
        );
      }
    }
    
    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(completed !== undefined && { completed }),
        ...(workTypeId !== undefined && { workTypeId }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      },
      include: {
        workType: true,
      },
    });
    
    return NextResponse.json(task);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

// DELETE - Delete a task
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }
    
    // Verify task belongs to user
    const task = await prisma.task.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });
    
    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }
    
    await prisma.task.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
} 