import { db } from "@/lib/db";
import { handleApiError } from "@/lib/errors/errorHandler";
import { DEFAULT_HEADERS_CONFIG } from "@/lib/security/ISecurityService";
import { SecurityManager } from "@/lib/security/SecurityManager";
import { randomUUID } from "crypto";
import { writeFile } from "fs/promises";
import { NextResponse } from "next/server";
import { join } from "path";
import { z } from "zod";

// Initialize SecurityManager
const securityManager = new SecurityManager({
  csrf: {
    cookieName: "nd_csrf",
    headerName: "x-csrf-token",
    ttlSeconds: 3600,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  },
  headers: DEFAULT_HEADERS_CONFIG,
});

// Initialize SecurityManager
const securityManager = new SecurityManager({
  csrf: {
    cookieName: "nd_csrf",
    headerName: "x-csrf-token",
    ttlSeconds: 3600,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  },
  headers: DEFAULT_HEADERS_CONFIG,
});

// Validation schema for track upload
const uploadSchema = z.object({
  title: z.string().min(1).max(100),
  artistName: z.string().min(1).max(50),
  genre: z.string().min(1).max(30),
  duration: z.number().min(1),
  description: z.string().optional(),
  price: z.number().min(0).optional(),
  isExplicit: z.boolean().default(false),
});

// Helper function to validate JWT token
async function validateToken(token: string): Promise<string | null> {
  // В реальном приложении здесь будет проверка JWT токена
  // В целях безопасности реализация зависит от вашей системы аутентификации
  // Для примера возвращаем фиктивный ID, если токен не пустой
  if (!token) return null;

  // Здесь должна быть проверка подписи токена и извлечение ID пользователя
  // например, с использованием библиотеки jsonwebtoken
  try {
    // const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    // return decoded.userId;
    // Пока возвращаем фиктивный ID для примера
    return "valid_user_id"; // Замените на реальную проверку токена
  } catch (error) {
    console.error("Token validation error:", error);
    return null;
  }
}

// POST /api/tracks/upload - Upload a new track
export async function POST(request: NextRequest) {
  try {
    // Verify CSRF token
    const csrfToken = request.headers.get("x-csrf-token");
    const csrfCookie = request.cookies.get("nd_csrf");
    const sessionId = "session-placeholder"; // In real implementation, get from auth session

    if (
      !securityManager.verifyCSRF(
        sessionId,
        csrfCookie?.value || "",
        csrfToken || ""
      )
    ) {
      return NextResponse.json(
        { error: "CSRF token validation failed" },
        { status: 403 }
      );
    }

    // Проверяем аутентификацию пользователя через JWT токен
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const userId = await validateToken(token);
    if (!userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();

    // Get file from form data
    const file = formData.get("audioFile") as File | null;
    const imageFile = formData.get("imageFile") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Audio file is required" },
        { status: 400 }
      );
    }

    // Проверяем типы файлов
    const allowedAudioTypes = [
      "audio/mpeg",
      "audio/wav",
      "audio/flac",
      "audio/aac",
      "audio/ogg",
    ];
    const allowedImageTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (!allowedAudioTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Invalid audio file type. Only mp3, wav, flac, aac, and ogg are allowed.",
        },
        { status: 400 }
      );
    }

    if (imageFile && !allowedImageTypes.includes(imageFile.type)) {
      return NextResponse.json(
        {
          error:
            "Invalid image file type. Only jpeg, png, webp, and gif are allowed.",
        },
        { status: 400 }
      );
    }

    // Проверяем размеры файлов
    const maxAudioSize = 100 * 1024 * 1024; // 100MB
    const maxImageSize = 10 * 1024 * 1024; // 10MB

    if (file.size > maxAudioSize) {
      return NextResponse.json(
        { error: "Audio file too large. Maximum size is 100MB." },
        { status: 400 }
      );
    }

    if (imageFile && imageFile.size > maxImageSize) {
      return NextResponse.json(
        { error: "Image file too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // Validate track metadata
    const metadata = JSON.parse((formData.get("metadata") as string) || "{}");
    const validatedData = uploadSchema.parse(metadata);

    // Sanitize metadata inputs
    const sanitizedMetadata = {
      ...validatedData,
      title: validatedData.title.trim().substring(0, 100),
      artistName: validatedData.artistName.trim().substring(0, 50),
      genre: validatedData.genre.trim().substring(0, 30),
      description: validatedData.description
        ? validatedData.description.trim().substring(0, 500)
        : undefined,
    };

    // Generate unique filename with secure naming
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "mp3";
    const audioFileName = `${Date.now()}_${randomUUID()}.${fileExtension}`;
    let imageFileName: string | null = null;
    if (imageFile) {
      const imageExtension =
        imageFile.name.split(".").pop()?.toLowerCase() || "jpg";
      imageFileName = `${Date.now()}_${randomUUID()}.${imageExtension}`;
    }

    // Save files to local storage (in production, this would be IPFS/Filecoin)
    const audioBuffer = Buffer.from(await file.arrayBuffer());
    const audioPath = join(process.cwd(), "uploads", "audio", audioFileName);

    await writeFile(audioPath, audioBuffer);

    let imagePath: string | null = null;
    let imageUrl: string | null = null;
    if (imageFile) {
      const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
      imagePath = join(process.cwd(), "uploads", "images", imageFileName!);
      await writeFile(imagePath, imageBuffer);
      imageUrl = `/uploads/images/${imageFileName}`;
    }

    // Use authenticated user's ID instead of default
    const artistId = userId;

    // Create track record with correct field names based on Prisma schema
    const track = await db.track.create({
      data: {
        ...sanitizedMetadata,
        artistId: artistId,
        ipfsHash: `ipfs_${Date.now()}`, // This would be actual IPFS hash in production
        metadata: JSON.stringify({
          duration: sanitizedMetadata.duration,
          title: sanitizedMetadata.title,
          artistName: sanitizedMetadata.artistName,
          genre: sanitizedMetadata.genre,
          description: sanitizedMetadata.description,
          isExplicit: sanitizedMetadata.isExplicit,
          price: sanitizedMetadata.price,
        }),
        isPublished: true,
        // Добавим поле с путем к файлу, если оно требуется в схеме
        // убираем filePath, т.к. оно не существует в схеме
      },
      include: {
        artist: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    // Award upload reward to artist
    await db.reward.create({
      data: {
        userId: artistId,
        type: "UPLOAD",
        amount: 20, // 20 $NDT tokens for upload
        reason: `Track upload reward: ${track.title}`,
      },
    });

    // Update user balance
    await db.user.update({
      where: { id: artistId },
      data: { balance: { increment: 20 } },
    });

    return NextResponse.json(
      {
        message: "Track uploaded successfully",
        track,
        files: {
          audio: audioFileName,
          image: imageFileName,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error uploading track:", error);
    return NextResponse.json(
      { error: "Failed to upload track" },
      { status: 500 }
    );
  }
}

// GET /api/tracks/upload - Get upload status and progress (for large files)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uploadId = searchParams.get("uploadId");

    if (!uploadId) {
      return NextResponse.json(
        { error: "Upload ID is required" },
        { status: 400 }
      );
    }

    // In a real implementation, this would check the status of an ongoing upload
    // For now, return a mock response
    return NextResponse.json({
      uploadId,
      status: "completed",
      progress: 100,
      message: "Upload completed successfully",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
