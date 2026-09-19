import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Header from "@/components/Header";
import TextBox from "@/components/TextBox";
import ChunkSelectionModal from "@/components/ChunkSelectionModal";
import DownloadModal from "@/components/DownloadModal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { RewriteResponse, TextChunk } from "@shared/schema";

export default function SimpleHome() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [inputAiScore, setInputAiScore] = useState<number | null>(null);
  const [outputAiScore, setOutputAiScore] = useState<number | null>(null);
  const [inputChunks, setInputChunks] = useState<TextChunk[]>([]);
  const [selectedChunkIds, setSelectedChunkIds] = useState<string[]>([]);
  const [showChunkModal, setShowChunkModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [lastJobId, setLastJobId] = useState<string | null>(null);
  const { toast } = useToast();

  const analyzeTextMutation = useMutation({
    mutationFn: async (text: string) =>
      apiRequest("/api/analyze-text", { method: "POST", body: { text } }),
    onSuccess: (data) => {
      setInputAiScore(data.aiScore);
      if (data.needsChunking) {
        setInputChunks(data.chunks);
        setSelectedChunkIds(data.chunks.map((chunk: TextChunk) => chunk.id));
      } else {
        setInputChunks([]);
        setSelectedChunkIds([]);
      }
    },
    onError: (error: Error) => {
      toast({ title: "Analysis Error", description: error.message, variant: "destructive" });
    },
  });

  const humanizeMutation = useMutation({
    mutationFn: async (text: string) =>
      apiRequest("/api/rewrite", {
        method: "POST",
        body: { inputText: text, provider: "walterwrites" },
      }) as Promise<RewriteResponse>,
    onSuccess: (data) => {
      setOutputText(data.rewrittenText);
      setOutputAiScore(data.outputAiScore);
      setLastJobId(data.jobId);
      toast({
        title: "Humanization Complete",
        description: `AI detection changed from ${data.inputAiScore}% to ${data.outputAiScore}%`,
      });
    },
    onError: (error: Error) => {
      toast({ title: "Humanization Error", description: error.message, variant: "destructive" });
    },
  });

  const reHumanizeMutation = useMutation({
    mutationFn: async () =>
      apiRequest(`/api/re-rewrite/${lastJobId}`, {
        method: "POST",
        body: { provider: "walterwrites" },
      }) as Promise<RewriteResponse>,
    onSuccess: (data) => {
      setOutputText(data.rewrittenText);
      setOutputAiScore(data.outputAiScore);
      setLastJobId(data.jobId);
      toast({ title: "Humanization Complete", description: `AI detection score: ${data.outputAiScore}%` });
    },
    onError: (error: Error) => {
      toast({ title: "Humanization Error", description: error.message, variant: "destructive" });
    },
  });

  const handleInputChange = (text: string) => {
    setInputText(text);
    if (text.trim()) analyzeTextMutation.mutate(text);
    else {
      setInputAiScore(null);
      setInputChunks([]);
      setSelectedChunkIds([]);
    }
  };

  const textToHumanize = inputChunks.length && selectedChunkIds.length
    ? inputChunks
        .filter((chunk) => selectedChunkIds.includes(chunk.id))
        .map((chunk) => chunk.content)
        .join("\n\n")
    : inputText;
  const wordCount = textToHumanize.trim().split(/\s+/).filter(Boolean).length;
  const canHumanize = wordCount >= 50 && wordCount <= 2000;
  const isProcessing = humanizeMutation.isPending || reHumanizeMutation.isPending;

  const handleHumanize = () => {
    if (!canHumanize) {
      toast({
        title: "Text Length",
        description: "Walter Writes requires between 50 and 2,000 words.",
        variant: "destructive",
      });
      return;
    }
    humanizeMutation.mutate(textToHumanize);
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
              placeholder="Paste or upload 50–2,000 words to humanize..."
              value={inputText}
              onChange={handleInputChange}
              aiScore={inputAiScore}
              isLoading={analyzeTextMutation.isPending}
              supportFileUpload
              showChunking={inputChunks.length > 0}
              chunkCount={inputChunks.length}
              selectedChunkCount={selectedChunkIds.length}
              wordCount={inputText.trim().split(/\s+/).filter(Boolean).length}
              onSelectChunks={() => setShowChunkModal(true)}
              onClear={() => window.location.reload()}
              onEnterSubmit={handleHumanize}
              canSubmit={canHumanize && !isProcessing}
              containerClassName="h-[calc(100vh-7rem)] min-h-[620px]"
            />
            <TextBox
              title="Humanized Output (Box B)"
              icon="fas fa-download"
              placeholder="Walter Writes humanized text will appear here..."
              value={outputText}
              onChange={() => {}}
              aiScore={outputAiScore}
              isLoading={isProcessing}
              readOnly
              showReRewrite
              onReRewrite={() => reHumanizeMutation.mutate()}
              canReRewrite={!!lastJobId && !isProcessing}
              onDownload={() => setShowDownloadModal(true)}
              onClear={() => window.location.reload()}
              containerClassName="h-[calc(100vh-7rem)] min-h-[620px]"
            />
          </div>
        </div>
      </main>
      <ChunkSelectionModal
        isOpen={showChunkModal}
        onClose={() => setShowChunkModal(false)}
        chunks={inputChunks}
        selectedIds={selectedChunkIds}
        onSelectionChange={(ids) => {
          setSelectedChunkIds(ids);
          setShowChunkModal(false);
        }}
      />
      <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        content={outputText}
        filename="humanized-text"
      />
    </div>
  );
}