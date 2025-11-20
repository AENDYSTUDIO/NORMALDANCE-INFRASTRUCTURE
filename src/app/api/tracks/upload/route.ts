import { IPFSTrackMetadata, uploadWithReplication } from "@/lib/ipfs-enhanced";
import { validateData } from "@/lib/schemas";
import { logger } from "@/lib/utils/logger";
import { NextResponse } from "next/server";
import { z } from "zod";

// Schema for file upload
const uploadSchema = z.object({
  file: z.instanceof(File),
  title: z.string().min(1).max(100),
  artistName: z.string().min(1).max(50),
  genre: z.string().min(1).max(30),
  isExplicit: z.boolean().default(false),
  metadata: z.record(z.unknown()).optional(),
});

export async function POST(request: any) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const artistName = formData.get("artistName") as string;
    const genre = formData.get("genre") as string;
    const isExplicit = formData.get("isExplicit") === "true";
    const metadataString = formData.get("metadata") as string;

    // Validate input
    const validationResult = validateData(uploadSchema, {
      file,
      title,
      artistName,
      genre,
      isExplicit,
      metadata: metadataString ? JSON.parse(metadataString) : undefined,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error },
        { status: 400 }
      );
    }

    // Validate file type and size
    const allowedTypes = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg"];
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only MP3, WAV, and OGG are allowed." },
        { status: 400 }
      );
    }

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 50MB." },
        { status: 400 }
      );
    }

    // Upload to IPFS
    const metadata: IPFSTrackMetadata = {
      title: validationResult.data.title,
      artist: validationResult.data.artistName,
      genre: validationResult.data.genre,
      duration: 0, // Will be updated after processing
      releaseDate: new Date().toISOString(),
      isExplicit: validationResult.data.isExplicit || false,
      fileSize: file.size,
      mimeType: file.type,
      format: file.type.split("/")[1] || "unknown",
      sampleRate: 44100, // Default value
      bitDepth: 16, // Default value
    };

    const ipfsResult = await uploadWithReplication(file, metadata);
    const ipfsHash = ipfsResult.cid;

    if (!ipfsHash) {
      return NextResponse.json(
        { error: "Failed to upload file to IPFS" },
        { status: 500 }
      );
    }

    // Create track record
    const trackData = {
      title: validationResult.data.title,
      artistName: validationResult.data.artistName,
      genre: validationResult.data.genre,
      ipfsHash,
      duration: 0, // Will be updated after processing
      metadata: validationResult.data.metadata,
      isExplicit: validationResult.data.isExplicit,
      isPublished: false,
    };

    // Save to database (implementation depends on your database setup)
    // const track = await db.track.create({ data: trackData });

    logger.info("Track uploaded successfully", {
      ipfsHash,
      title: trackData.title,
    });

    return NextResponse.json({
      success: true,
      track: trackData,
      ipfsHash,
    });
  } catch (error) {
    logger.error("Error uploading track:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: any) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const genre = searchParams.get("genre");
    const search = searchParams.get("search");

    // Build query
    const query: any = {};
    if (genre) query.genre = genre;
    if (search) query.search = search;
    query.page = page;
    query.limit = limit;

    // Get tracks from database (implementation depends on your database setup)
    // const tracks = await db.track.findMany({
    //   where: query,
    //   include: { artist: true },
    //   orderBy: { createdAt: 'desc' },
    //   skip: (page - 1) * limit,
    //   take: limit,
    // });

    return NextResponse.json({
      tracks: [], // Replace with actual tracks
      pagination: {
        page,
        limit,
        total: 0, // Replace with actual total
      },
    });
  } catch (error) {
    logger.error("Error fetching tracks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
