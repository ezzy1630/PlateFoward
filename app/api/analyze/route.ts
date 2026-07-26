import { NextResponse } from "next/server";
import { analyzeImage } from "@/lib/cerebras/client";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let imageBase64: string;
    let mimeType = "image/jpeg";
    let transcript: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const imageFile = formData.get("image") as File | null;
      if (!imageFile) {
        return NextResponse.json(
          { error: "Image file is required" },
          { status: 400 },
        );
      }
      const bytes = await imageFile.arrayBuffer();
      imageBase64 = Buffer.from(bytes).toString("base64");
      mimeType = imageFile.type || "image/jpeg";
      transcript = (formData.get("transcript") as string) || undefined;
    } else {
      let body: Record<string, unknown>;
      try {
        body = await request.json();
      } catch {
        return NextResponse.json(
          { error: "Invalid JSON body" },
          { status: 400 },
        );
      }
      if (!body.image || typeof body.image !== "string") {
        return NextResponse.json(
          { error: "Image base64 string is required" },
          { status: 400 },
        );
      }
      imageBase64 = body.image;
      mimeType = (body.mimeType as string) || "image/jpeg";
      transcript = (body.transcript as string) || undefined;
    }

    const result = await analyzeImage({ imageBase64, mimeType, transcript });

    if (result.source === "gemma") {
      return NextResponse.json(result, { status: 200 });
    }

    return NextResponse.json(result, { status: 503 });
  } catch {
    return NextResponse.json(
      { source: "error" as const, canUseFallback: true, errorCode: "INTERNAL_ERROR" },
      { status: 503 },
    );
  }
}
