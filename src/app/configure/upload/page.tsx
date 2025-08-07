"use client";

import { UploadButton } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState, startTransition } from "react";

export default function Home() {
  const router = useRouter();
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  return (
    <div
      className={cn(
        "relative h-full flex-1 my-16 w-full rounded-2xl bg-gray-100 p-2 ring-1 ring-inset ring-gray-900/10 lg:rounded-2xl flex justify-center flex-col items-center"
      )}
    >
      <main className="flex min-h-screen flex-col items-center justify-center p-24 gap-6">
        <UploadButton
          className="bg-gray-300 rounded-2xl p-2"
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
      <div className="mb-12 mx-auto">
        <p>Please select a file to upload</p>
      </div>
    </div>
  );
}
