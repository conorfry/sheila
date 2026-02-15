"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface FileUploadButtonProps {
  caseId: string;
  slotKey: string;
  category: string;
  acceptedMime: string[];
  onUploadComplete: () => void;
}

export function FileUploadButton({
  caseId,
  slotKey,
  category,
  acceptedMime,
  onUploadComplete,
}: FileUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      // Step 1: Get presigned URL
      const presign = await api.post<{ uploadUrl: string; storagePath: string }>(
        `/cases/${caseId}/documents/presign`,
        {
          fileName: file.name,
          mimeType: file.type,
          category,
          slot_key: slotKey,
        },
      );

      // Step 2: Upload file to signed URL
      await fetch(presign.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      // Step 3: Record the upload
      await api.post(`/cases/${caseId}/documents/complete`, {
        storage_path: presign.storagePath,
        file_name: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        category,
        slot_key: slotKey,
      });

      setDone(true);
      onUploadComplete();
    } catch {
      // reset on error so user can retry
    } finally {
      setLoading(false);
      // Reset file input for re-upload
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedMime.join(",")}
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={() => fileInputRef.current?.click()}
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : done ? (
          <Check className="mr-2 h-4 w-4" />
        ) : (
          <Upload className="mr-2 h-4 w-4" />
        )}
        {loading ? "Uploading..." : done ? "Uploaded" : "Upload"}
      </Button>
    </>
  );
}
