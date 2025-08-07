"use client";

import { UploadButton } from "@/lib/uploadthing";
import { useRouter } from "next/navigation";
import { useState, startTransition } from "react";

export default function Home() {
  const router = useRouter();
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 gap-6">
      <UploadButton
        endpoint="imageUploader"
        input={{}} // required, even if empty
        onUploadProgress={(progress) => {
          setUploadProgress(progress);
        }}
        onClientUploadComplete={([data]) => {
          const configId = data?.serverData?.configId;

          if (configId) {
            startTransition(() => {
              router.push(`/configure/design?id=${configId}`);
            });
          } else {
            alert("Upload completed, but no config ID was returned.");
            console.warn("Upload response:", data);
          }
        }}
        onUploadError={(error: Error) => {
          alert(`Upload failed: ${error.message}`);
        }}
      />

      {uploadProgress !== null && (
        <p className="text-sm text-gray-500">Uploading: {uploadProgress}%</p>
      )}
    </main>
  );
}
