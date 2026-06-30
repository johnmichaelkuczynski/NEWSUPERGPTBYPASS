import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  filename: string;
}

export default function DownloadModal({
  isOpen,
  onClose,
  content,
  filename,
}: DownloadModalProps) {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const downloadFile = async (format: 'txt' | 'pdf' | 'docx') => {
    setIsDownloading(format);
    
    try {
      const response = await fetch(`/api/download/${format}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          filename,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Download failed');
      }

      // Get the file blob
      const blob = await response.blob();
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Complete",
        description: `${format.toUpperCase()} file downloaded successfully`,
      });
      
      onClose();
    } catch (error: any) {
      toast({
        title: "Download Error",
        description: error.message || `Failed to download ${format.toUpperCase()} file`,
        variant: "destructive",
      });
    } finally {
      setIsDownloading(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Download Options</DialogTitle>
          <DialogDescription>
            Choose your preferred download format:
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start h-auto p-4 hover:bg-gray-50 hover:border-primary-300"
            onClick={() => downloadFile('pdf')}
            disabled={isDownloading === 'pdf'}
          >
            <div className="flex items-center space-x-3">
              {isDownloading === 'pdf' ? (
                <i className="fas fa-spinner fa-spin text-red-500 text-xl"></i>
              ) : (
                <i className="fas fa-file-pdf text-red-500 text-xl"></i>
              )}
              <div className="text-left">
                <span className="font-medium text-gray-900 block">
                  {isDownloading === 'pdf' ? 'Generating PDF...' : 'PDF Document'}
                </span>
                <p className="text-sm text-gray-600">Formatted document with styling</p>
              </div>
            </div>
          </Button>
          
          <Button
            variant="outline"
            className="w-full justify-start h-auto p-4 hover:bg-gray-50 hover:border-primary-300"
            onClick={() => downloadFile('docx')}
            disabled={isDownloading === 'docx'}
          >
            <div className="flex items-center space-x-3">
              {isDownloading === 'docx' ? (
                <i className="fas fa-spinner fa-spin text-blue-500 text-xl"></i>
              ) : (
                <i className="fas fa-file-word text-blue-500 text-xl"></i>
              )}
              <div className="text-left">
                <span className="font-medium text-gray-900 block">
                  {isDownloading === 'docx' ? 'Generating Word Doc...' : 'Word Document'}
                </span>
                <p className="text-sm text-gray-600">Editable .docx format</p>
              </div>
            </div>
          </Button>
          
          <Button
            variant="outline"
            className="w-full justify-start h-auto p-4 hover:bg-gray-50 hover:border-primary-300"
            onClick={() => downloadFile('txt')}
            disabled={isDownloading === 'txt'}
          >
            <div className="flex items-center space-x-3">
              {isDownloading === 'txt' ? (
                <i className="fas fa-spinner fa-spin text-gray-500 text-xl"></i>
              ) : (
                <i className="fas fa-file-alt text-gray-500 text-xl"></i>
              )}
              <div className="text-left">
                <span className="font-medium text-gray-900 block">
                  {isDownloading === 'txt' ? 'Generating Text File...' : 'Plain Text'}
                </span>
                <p className="text-sm text-gray-600">Simple .txt file</p>
              </div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
