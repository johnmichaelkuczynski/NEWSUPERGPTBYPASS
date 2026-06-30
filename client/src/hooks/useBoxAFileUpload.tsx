import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

interface UploadResult {
  document: {
    id: string;
    filename: string;
    content: string;
    wordCount: number;
    aiScore?: number;
  };
  chunks: any[];
  aiScore?: number;
  needsChunking: boolean;
}

/**
 * Enhanced file upload hook specifically for Box A (Input Text)
 * Handles PDFs with client-side processing and other files with server-side processing
 */
export function useBoxAFileUpload() {
  const [isUploading, setIsUploading] = useState(false);

  // Box A PDF processing mutation using new binary-safe server endpoint
  const boxAPDFMutation = useMutation({
    mutationFn: async (file: File): Promise<UploadResult> => {
      // Use FormData to send PDF as binary (not corrupted text)
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("/api/pdf/extract", {
        method: "POST",
        body: formData, // Do not set Content-Type manually
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'PDF extraction failed');
      }
      
      const { text } = await response.json();
      const wordCount = text.trim().split(/\s+/).filter((word: string) => word.length > 0).length;
      
      // Format result to match expected interface
      return {
        document: {
          id: `box-a-pdf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          filename: file.name,
          content: text || "[No readable text found in this PDF]",
          wordCount: wordCount,
        },
        chunks: [],
        needsChunking: wordCount > 500,
      };
    },
    onMutate: () => setIsUploading(true),
    onSettled: () => setIsUploading(false),
  });

  // Server-side processing for other file types
  const serverUploadMutation = useMutation({
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
    onMutate: () => setIsUploading(true),
    onSettled: () => setIsUploading(false),
  });

  const uploadFile = async (file: File): Promise<UploadResult> => {
    // Determine processing method based on file type
    const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    
    if (isPDF) {
      // Use Box A specific PDF processing
      return boxAPDFMutation.mutateAsync(file);
    } else {
      // Use server-side processing for other files
      return serverUploadMutation.mutateAsync(file);
    }
  };

  const getError = () => {
    return boxAPDFMutation.error || serverUploadMutation.error;
  };

  return {
    uploadFile,
    isUploading,
    error: getError(),
    isPDFProcessing: boxAPDFMutation.isPending,
    isServerUploading: serverUploadMutation.isPending,
  };
}