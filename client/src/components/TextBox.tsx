import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useBoxAFileUpload } from "@/hooks/useBoxAFileUpload";

interface TextBoxProps {
  title: string;
  icon: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  aiScore?: number | null;
  isLoading?: boolean;
  supportFileUpload?: boolean;
  readOnly?: boolean;
  showChunking?: boolean;
  chunkCount?: number;
  selectedChunkCount?: number;
  wordCount?: number;
  onSelectChunks?: () => void;
  showReRewrite?: boolean;
  onReRewrite?: () => void;
  canReRewrite?: boolean;
  onDownload?: () => void;
  onClear?: () => void;
  onEnterSubmit?: () => void;
  canSubmit?: boolean;
}

export default function TextBox({
  title,
  icon,
  placeholder,
  value,
  onChange,
  aiScore,
  isLoading = false,
  supportFileUpload = false,
  readOnly = false,
  showChunking = false,
  chunkCount = 0,
  selectedChunkCount = 0,
  wordCount = 0,
  onSelectChunks,
  showReRewrite = false,
  onReRewrite,
  canReRewrite = false,
  onDownload,
  onClear,
  onEnterSubmit,
  canSubmit = false,
}: TextBoxProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Use Box A specific upload hook for Input Text (Box A), regular hook for others
  const isBoxA = title.includes('Box A');
  const regularUpload = useFileUpload();
  const boxAUpload = useBoxAFileUpload();
  
  const { uploadFile, isUploading } = isBoxA ? boxAUpload : regularUpload;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadFile(file);
      onChange(result.document.content);
      
      // Enhanced success message for Box A PDF processing
      const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const successMessage = isBoxA && isPDF 
        ? `PDF processed successfully using client-side extraction (${result.document.wordCount} words)`
        : `${result.document.filename} processed successfully`;
      
      toast({
        title: "File Uploaded",
        description: successMessage,
      });
    } catch (error: any) {
      toast({
        title: "Upload Error",
        description: error.message,
        variant: "destructive",
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    toast({
      title: "Copied",
      description: "Text copied to clipboard",
    });
  };

  const getAiScoreColor = (score: number) => {
    if (score <= 30) return "bg-green-500";
    if (score <= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getAiScoreText = (score: number) => {
    return `${score}% AI`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && onEnterSubmit && canSubmit) {
      e.preventDefault();
      onEnterSubmit();
    }
  };

  return (
    <div className="text-box-container">
      <div className="text-box-header">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <i className={`${icon} mr-2 text-primary`}></i>
            {title}
          </h2>
          <div className="flex items-center space-x-2">
            {onClear && value && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClear}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <i className="fas fa-trash mr-1"></i>Clear
              </Button>
            )}
            {supportFileUpload && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <i className="fas fa-file-upload mr-1"></i>
                  {isUploading ? "Uploading..." : "Upload File"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileUpload}
                />
              </>
            )}
            {value && (
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <i className="fas fa-copy mr-1"></i>Copy
              </Button>
            )}
            {readOnly && onDownload && value && (
              <Button variant="outline" size="sm" onClick={onDownload}>
                <i className="fas fa-download mr-1"></i>Download
              </Button>
            )}
          </div>
        </div>
        
        {/* AI Detection Score */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">GPTZero AI Detection:</span>
          <div className="flex items-center space-x-2">
            {isLoading ? (
              <Skeleton className="w-24 h-2" />
            ) : aiScore !== null && aiScore !== undefined ? (
              <>
                <div className="ai-score-bar">
                  <div 
                    className={`h-2 rounded-full ${getAiScoreColor(aiScore)}`}
                    style={{ width: `${aiScore}%` }}
                  ></div>
                </div>
                <span className={`text-sm font-medium ${aiScore <= 30 ? 'text-green-600' : aiScore <= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {getAiScoreText(aiScore)}
                </span>
              </>
            ) : (
              <span className="text-sm text-gray-400">Not analyzed</span>
            )}
          </div>
        </div>
      </div>
      
      <div className="text-box-content">
        {isLoading && !value ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        ) : (
          <Textarea
            className="w-full h-full resize-none border-0 focus:ring-0 text-sm text-gray-900 placeholder-gray-500 p-0"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            readOnly={readOnly}
          />
        )}
      </div>
      
      {/* Footer with additional controls */}
      {(showChunking || showReRewrite) && (
        <div className="text-box-footer">
          {showChunking && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Document Length: {wordCount.toLocaleString()} words
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={onSelectChunks}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <i className="fas fa-puzzle-piece mr-1"></i>
                Select Chunks ({selectedChunkCount}/{chunkCount})
              </Button>
            </div>
          )}
          
          {showReRewrite && (
            <Button
              className="w-full"
              onClick={onReRewrite}
              disabled={!canReRewrite}
            >
              <i className="fas fa-redo mr-2"></i>
              Re-rewrite Output
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
