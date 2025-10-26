import { db } from "@/lib/db";
import { handleApiError } from "@/lib/errors/errorHandler";
import { NextResponse } from "next/server";

// DELETE /api/messages/[id] - Delete a message
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    await db.message.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
