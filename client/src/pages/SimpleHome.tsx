import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Header from "@/components/Header";
import TextBox from "@/components/TextBox";
import DownloadModal from "@/components/DownloadModal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAiDetection } from "@/hooks/useAiDetection";
import type { RewriteResponse } from "@shared/schema";

export default function SimpleHome() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [styleText, setStyleText] = useState("");
  const inputDetection = useAiDetection(inputText);
  const outputDetection = useAiDetection(outputText);
  const styleDetection = useAiDetection(styleText);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [lastJobId, setLastJobId] = useState<string | null>(null);
  const { toast } = useToast();

  const transformMutation = useMutation({
    mutationFn: async (text: string) =>
      apiRequest("/api/rewrite", {
        method: "POST",
        body: { inputText: text, provider: "text-transformer" },
      }) as Promise<RewriteResponse>,
    onSuccess: (data) => {
      setOutputText(data.rewrittenText);
      setLastJobId(data.jobId);
      toast({ title: "Transformation Complete", description: "The passage was reconstructed for directness and clarity." });
    },
    onError: (error: Error) => {
      toast({ title: "Transformation Error", description: error.message, variant: "destructive" });
    },
  });

  const reTransformMutation = useMutation({
    mutationFn: async () =>
      apiRequest(`/api/re-rewrite/${lastJobId}`, {
        method: "POST",
        body: { provider: "text-transformer" },
      }) as Promise<RewriteResponse>,
    onSuccess: (data) => {
      setOutputText(data.rewrittenText);
      setLastJobId(data.jobId);
      toast({ title: "Transformation Complete" });
    },
    onError: (error: Error) => {
      toast({ title: "Transformation Error", description: error.message, variant: "destructive" });
    },
  });

  const handleInputChange = (text: string) => {
    setInputText(text);
  };

  const canTransform = !!inputText.trim();
  const isProcessing = transformMutation.isPending || reTransformMutation.isPending;

  const handleTransform = () => {
    if (canTransform) {
      transformMutation.mutate(inputText);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      <Header />
      <main className="min-h-screen pt-20">
        <div className="p-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <TextBox
              title="Input Text (Box A)"
              icon="fas fa-upload"
              placeholder="Paste or upload the passage to transform..."
              value={inputText}
              aiScore={inputDetection.score}
              isAnalyzing={inputDetection.pending}
              aiScoreError={inputDetection.error}
              onChange={handleInputChange}
              isLoading={false}
              supportFileUpload
              wordCount={inputText.trim().split(/\s+/).filter(Boolean).length}
              onClear={() => window.location.reload()}
              onEnterSubmit={handleTransform}
              canSubmit={canTransform && !isProcessing}
              actionLabel="Transform"
              showAiScore
              containerClassName="h-[calc(100vh-7rem)] min-h-[620px]"
            />
            <TextBox
              title="Transformed Output (Box B)"
              icon="fas fa-download"
              placeholder="The direct, reconstructed passage will appear here..."
              value={outputText}
              aiScore={outputDetection.score}
              isAnalyzing={outputDetection.pending}
              aiScoreError={outputDetection.error}
              onChange={() => {}}
              isLoading={isProcessing}
              readOnly
              showReRewrite
              onReRewrite={() => reTransformMutation.mutate()}
              canReRewrite={!!lastJobId && !isProcessing}
              onDownload={() => setShowDownloadModal(true)}
              onClear={() => window.location.reload()}
              repeatActionLabel="Retransform"
              showAiScore
              containerClassName="h-[calc(100vh-7rem)] min-h-[620px]"
            />
          </div>
          <div className="mt-4">
            <TextBox
              title="Style Sample"
              icon="fas fa-pen-nib"
              placeholder="Type, paste, upload, or drag and drop a style sample here..."
              value={styleText}
              aiScore={styleDetection.score}
              isAnalyzing={styleDetection.pending}
              aiScoreError={styleDetection.error}
              onChange={setStyleText}
              isLoading={false}
              supportFileUpload
              wordCount={styleText.trim().split(/\s+/).filter(Boolean).length}
              onClear={() => setStyleText("")}
              showAiScore
              containerClassName="h-[420px] min-h-[320px]"
            />
          </div>
        </div>
      </main>
      <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        content={outputText}
        filename="transformed-text"
      />
    </div>
  );
}