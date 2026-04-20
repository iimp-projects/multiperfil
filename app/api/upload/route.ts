import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "sa-east-1",
  // Disable automatic checksums to avoid '400 Bad Request' in pre-signed URLs
  // if the client (browser) doesn't send the checksum headers.
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
  // Defensive initialization: only provide credentials if they are explicitly set in env.
  // This allows the SDK to automatically use IAM Task Roles in ECS if variables are missing.
  ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      }
    : {}),
});

export async function POST(req: NextRequest) {
  try {
    const { filename, fileType, bucketName } = await req.json();

    if (!filename || !fileType || !bucketName) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Define the key (path) in S3
    // We add a timestamp to avoid collisions
    const timestamp = Date.now();
    const key = `profiles/${timestamp}_${filename}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: fileType,
    });

    // Generate pre-signed URL (valid for 5 minutes)
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    // The public URL will depend on the bucket's public access configuration
    // Usually: https://{bucket}.s3.{region}.amazonaws.com/{key}
    const publicUrl = `https://${bucketName}.s3.${process.env.AWS_REGION || "sa-east-1"}.amazonaws.com/${key}`;

    return NextResponse.json({
      success: true,
      uploadUrl,
      publicUrl,
      key,
    });
  } catch (error: unknown) {
    console.error("S3 Presigned URL Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
