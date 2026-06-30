import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface StyleUploaderProps {
  onStyleUploaded: (content: string, type: 'style' | 'content') => void;
}

export default function StyleUploader({ onStyleUploaded }: StyleUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<'style' | 'content'>('style');
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const allowedTypes = ['.txt', '.doc', '.docx'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a TXT, DOC, or DOCX file.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      onStyleUploaded(data.document.content, uploadType);
      
      toast({
        title: "Upload Successful",
        description: `${uploadType === 'style' ? 'Style sample' : 'Content reference'} uploaded successfully`,
      });
    } catch (error) {
      toast({
        title: "Upload Error",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset the input
      event.target.value = '';
    }
  };

  const handleTextPaste = () => {
    const textArea = document.getElementById('paste-area') as HTMLTextAreaElement;
    const content = textArea.value.trim();
    
    if (!content) {
      toast({
        title: "No Content",
        description: "Please paste some text first.",
        variant: "destructive",
      });
      return;
    }

    onStyleUploaded(content, uploadType);
    textArea.value = '';
    
    toast({
      title: "Content Added",
      description: `${uploadType === 'style' ? 'Style sample' : 'Content reference'} added successfully`,
    });
  };

  return (
    <Card className="p-4 bg-white border border-gray-200">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <i className="fas fa-upload mr-2 text-primary"></i>
            Upload Style or Content
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Upload your own writing samples for style cloning or content mixing
          </p>
        </div>

        {/* Upload Type Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Upload Purpose:</Label>
          <div className="flex space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="uploadType"
                value="style"
                checked={uploadType === 'style'}
                onChange={(e) => setUploadType(e.target.value as 'style' | 'content')}
                className="text-primary focus:ring-primary"
              />
              <span className="text-sm text-gray-700">
                <i className="fas fa-palette mr-1"></i>
                Style Clone (mimic writing style)
              </span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="uploadType"
                value="content"
                checked={uploadType === 'content'}
                onChange={(e) => setUploadType(e.target.value as 'style' | 'content')}
                className="text-primary focus:ring-primary"
              />
              <span className="text-sm text-gray-700">
                <i className="fas fa-layer-group mr-1"></i>
                Content Mix (blend with content)
              </span>
            </label>
          </div>
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Upload File:</Label>
          <div className="flex items-center space-x-2">
            <Input
              type="file"
              accept=".txt,.doc,.docx"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="flex-1"
            />
            {isUploading && (
              <i className="fas fa-spinner fa-spin text-primary"></i>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Supported formats: TXT, DOC, DOCX (max 50MB)
          </p>
        </div>

        {/* Text Paste */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Or Paste Text:</Label>
          <Textarea
            id="paste-area"
            placeholder={uploadType === 'style' 
              ? "Paste a writing sample whose style you want to mimic..." 
              : "Paste content you want to blend with your original text..."
            }
            className="h-24 resize-none"
          />
          <Button
            onClick={handleTextPaste}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <i className="fas fa-plus mr-2"></i>
            Add {uploadType === 'style' ? 'Style Sample' : 'Content Reference'}
          </Button>
        </div>
      </div>
    </Card>
  );
}