import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

interface UploadResult {
  document: {
    id: string;
    filename: string;
    content: string;
    wordCount: number;
    aiScore: number;
  };
  chunks: any[];
  aiScore: number;
  needsChunking: boolean;
}

export function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async (file: File): Promise<UploadResult> => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      return response.json();
    },
    onMutate: () => {
      setIsUploading(true);
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  const uploadFile = async (file: File): Promise<UploadResult> => {
    return uploadMutation.mutateAsync(file);
  };

  return {
    uploadFile,
    isUploading,
    error: uploadMutation.error,
  };
}
