// app/api/widgets/[id]/upload-logo/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await supabaseServer();
    const { id: widgetId } = await params;

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify widget ownership
    const { data: widget, error: widgetError } = await supabase
      .from("widgets")
      .select("id, owner_id, logo_url")
      .eq("id", widgetId)
      .single();

    if (widgetError || !widget) {
      return NextResponse.json({ error: "Widget not found" }, { status: 404 });
    }

    if (widget.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get("logo") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Max size: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Delete old logo if exists
    if (widget.logo_url) {
      try {
        // Extract file path from URL
        const oldPath = widget.logo_url.split("/widget-logos/")[1];
        if (oldPath) {
          await supabase.storage.from("widget-logos").remove([oldPath]);
        }
      } catch (err) {
        console.error("Error deleting old logo:", err);
        // Continue even if deletion fails
      }
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${widgetId}-${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("widget-logos")
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("widget-logos").getPublicUrl(uploadData.path);

    // Update widget with new logo URL
    const { error: updateError } = await supabase
      .from("widgets")
      .update({ logo_url: publicUrl })
      .eq("id", widgetId);

    if (updateError) {
      console.error("Update error:", updateError);
      // Try to delete uploaded file if database update fails
      await supabase.storage.from("widget-logos").remove([filePath]);
      return NextResponse.json(
        { error: "Failed to update widget" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      logoUrl: publicUrl,
      message: "Logo uploaded successfully",
    });
  } catch (err: any) {
    console.error("Logo upload error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle OPTIONS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
