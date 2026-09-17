import { useState, useCallback, useRef } from "react";
import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import TextBox from "@/components/TextBox";
import CustomInstructions from "@/components/CustomInstructions";
import ChunkSelectionModal from "@/components/ChunkSelectionModal";
import DownloadModal from "@/components/DownloadModal";
import ChatInterface from "@/components/ChatInterface";
import ApiKeyManager from "@/components/ApiKeyManager";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { TextChunk, RewriteRequest, RewriteResponse } from "@shared/schema";

export default function Home() {
  const [provider, setProvider] = useState<string>("anthropic");
  const [inputText, setInputText] = useState("");
  const [styleExcerpt, setStyleExcerpt] = useState("");
  const [outputText, setOutputText] = useState("");
  const [customInstructions, setCustomInstructions] = useState("Preserve every source claim and its meaning.");
  const [selectedPresets, setSelectedPresets] = useState<string[]>([]);
  const [showApiKeyManager, setShowApiKeyManager] = useState(false);

  const [contentMixText, setContentMixText] = useState("");
  const [mixingMode, setMixingMode] = useState<'style' | 'content' | 'both'>('style');

  const [inputAiScore, setInputAiScore] = useState<number | null>(null);
  const [outputAiScore, setOutputAiScore] = useState<number | null>(null);
  const [fidelityWarning, setFidelityWarning] = useState<string | null>(null);

  const [inputChunks, setInputChunks] = useState<TextChunk[]>([]);
  const [selectedChunkIds, setSelectedChunkIds] = useState<string[]>([]);
  const [showChunkModal, setShowChunkModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const [lastJobId, setLastJobId] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);

  const onDragStart = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartWidth.current = sidebarWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = ev.clientX - dragStartX.current;
      setSidebarWidth(Math.max(160, Math.min(600, dragStartWidth.current + delta)));
    };
    const onUp = () => {
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [sidebarWidth]);

  const { toast } = useToast();

  const analyzeTextMutation = useMutation({
    mutationFn: async (text: string) => {
      return await apiRequest("/api/analyze-text", { method: "POST", body: { text } });
    },
    onSuccess: (data, text) => {
      if (text === inputText) {
        setInputAiScore(data.aiScore);
        if (data.needsChunking) {
          setInputChunks(data.chunks);
          setSelectedChunkIds(data.chunks.map((chunk: TextChunk) => chunk.id));
        }
      }
    },
    onError: (error: any) => {
      toast({ title: "Analysis Error", description: error.message, variant: "destructive" });
    },
  });

  const rewriteMutation = useMutation({
    mutationFn: async (request: RewriteRequest) => {
      return await apiRequest("/api/rewrite", { method: "POST", body: request }) as Promise<RewriteResponse>;
    },
    onSuccess: (data) => {
      setOutputText(data.rewrittenText);
      setStyleExcerpt(data.styleExcerpt);
      setOutputAiScore(data.outputAiScore);
      setFidelityWarning(data.fidelityWarning || null);
      setLastJobId(data.jobId);
      toast({
        title: data.fidelityWarning ? "Rewrite Complete — Review Warning" : "Rewrite Complete",
        description: data.fidelityWarning || `AI detection reduced from ${data.inputAiScore}% to ${data.outputAiScore}%`,
        variant: data.fidelityWarning ? "destructive" : "default",
      });
    },
    onError: (error: any) => {
      toast({ title: "Rewrite Error", description: error.message, variant: "destructive" });
    },
  });

  const reRewriteMutation = useMutation({
    mutationFn: async (params: { jobId: string; customInstructions?: string; selectedPresets?: string[]; provider?: string }) => {
      return await apiRequest(`/api/re-rewrite/${params.jobId}`, {
        method: "POST",
        body: {
          customInstructions: params.customInstructions,
          selectedPresets: params.selectedPresets,
          provider: params.provider,
        }
      }) as Promise<RewriteResponse>;
    },
    onSuccess: (data) => {
      setOutputText(data.rewrittenText);
      setStyleExcerpt(data.styleExcerpt);
      setOutputAiScore(data.outputAiScore);
      setFidelityWarning(data.fidelityWarning || null);
      setLastJobId(data.jobId);
      toast({
        title: data.fidelityWarning ? "Re-rewrite Complete — Review Warning" : "Re-rewrite Complete",
        description: data.fidelityWarning || `AI detection score: ${data.outputAiScore}%`,
        variant: data.fidelityWarning ? "destructive" : "default",
      });
    },
    onError: (error: any) => {
      toast({ title: "Re-rewrite Error", description: error.message, variant: "destructive" });
    },
  });

  const handleInputTextChange = (text: string) => {
    setInputText(text);
    if (text.trim()) {
      analyzeTextMutation.mutate(text);
    } else {
      setInputAiScore(null);
      setInputChunks([]);
    }
  };

  const handleGenerateRewrite = () => {
    if (!inputText.trim()) {
      toast({ title: "Input Required", description: "Please provide input text to rewrite", variant: "destructive" });
      return;
    }

    setFidelityWarning(null);
    const request: RewriteRequest = {
      inputText: inputChunks.length > 0 && selectedChunkIds.length > 0
        ? inputChunks.filter(chunk => selectedChunkIds.includes(chunk.id)).map(chunk => chunk.content).join('\n\n')
        : inputText,
      contentMixText: contentMixText.trim() || undefined,
      customInstructions: customInstructions.trim() || undefined,
      selectedPresets: selectedPresets.length > 0 ? selectedPresets : undefined,
      provider,
      selectedChunkIds: selectedChunkIds.length > 0 ? selectedChunkIds : undefined,
      mixingMode,
    };

    rewriteMutation.mutate(request);
  };

  const handleReRewrite = () => {
    if (!lastJobId) {
      toast({ title: "No Previous Job", description: "Generate a rewrite first", variant: "destructive" });
      return;
    }
    setFidelityWarning(null);
    reRewriteMutation.mutate({
      jobId: lastJobId,
      customInstructions: customInstructions.trim() || undefined,
      selectedPresets: selectedPresets.length > 0 ? selectedPresets : undefined,
      provider,
    });
  };

  const handleChunkSelection = (chunkIds: string[]) => {
    setSelectedChunkIds(chunkIds);
    setShowChunkModal(false);
  };

  const handleClearAll = () => {
    setInputText("");
    setContentMixText("");
    setStyleExcerpt("");
    setOutputText("");
    setCustomInstructions("");
    setInputAiScore(null);
    setOutputAiScore(null);
    setFidelityWarning(null);
    setInputChunks([]);
    setSelectedChunkIds([]);
    setLastJobId(null);
    setSelectedPresets([]);
    toast({ title: "Cleared", description: "All content has been cleared successfully." });
  };

  const isProcessing = rewriteMutation.isPending || reRewriteMutation.isPending;

  if (showApiKeyManager) {
    return (
      <div className="min-h-screen bg-gray-50 font-inter p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <button onClick={() => setShowApiKeyManager(false)} className="text-blue-600 hover:text-blue-800 flex items-center">
              <i className="fas fa-arrow-left mr-2"></i>
              Back to App
            </button>
          </div>
          <ApiKeyManager onKeysUpdated={() => setShowApiKeyManager(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      <Header
        provider={provider}
        onProviderChange={setProvider}
        onShowApiKeys={() => setShowApiKeyManager(true)}
      />

      <div className="flex h-screen pt-16">
        {/* Resizable left sidebar */}
        <div style={{ width: sidebarWidth, minWidth: 160, maxWidth: 600, flexShrink: 0 }} className="overflow-hidden">
          <LeftSidebar
            selectedPresets={selectedPresets}
            onPresetsChange={setSelectedPresets}
          />
        </div>

        {/* Drag handle */}
        <div
          onMouseDown={onDragStart}
          className="w-1.5 flex-shrink-0 bg-gray-200 hover:bg-blue-400 cursor-col-resize transition-colors active:bg-blue-500"
          title="Drag to resize panel"
        />

        <main className="flex-1 overflow-y-auto min-w-0">
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <TextBox
                title="Input Text (Box A)"
                icon="fas fa-upload"
                placeholder="Paste or upload your AI-generated text that you want to rewrite..."
                value={inputText}
                onChange={handleInputTextChange}
                aiScore={inputAiScore}
                isLoading={analyzeTextMutation.isPending}
                supportFileUpload
                showChunking={inputChunks.length > 0}
                chunkCount={inputChunks.length}
                selectedChunkCount={selectedChunkIds.length}
                wordCount={inputText.trim().split(/\s+/).filter(w => w.length > 0).length}
                onSelectChunks={() => setShowChunkModal(true)}
                onClear={() => {
                  setInputText("");
                  setInputAiScore(null);
                  setInputChunks([]);
                  setSelectedChunkIds([]);
                }}
                onEnterSubmit={handleGenerateRewrite}
                canSubmit={!!inputText.trim()}
              />

              <TextBox
                title="Book Passage Used (Box B)"
                icon="fas fa-book-open"
                placeholder="The exact Nineteen Eighty-Four passage used for the rewrite will appear here..."
                value={styleExcerpt}
                onChange={() => {}}
                readOnly
              />

              <TextBox
                title="Content Reference (Box C)"
                icon="fas fa-layer-group"
                placeholder="Paste or upload content you want to blend with your text..."
                value={contentMixText}
                onChange={(text) => {
                  setContentMixText(text);
                  setMixingMode(text.trim() ? 'both' : 'style');
                }}
                isLoading={analyzeTextMutation.isPending}
                supportFileUpload
                onClear={() => {
                  setContentMixText("");
                  setMixingMode('style');
                }}
                onEnterSubmit={handleGenerateRewrite}
                canSubmit={!!inputText.trim()}
              />

              <TextBox
                title="Rewritten Output (Box D)"
                icon="fas fa-download"
                placeholder="Rewritten text will appear here..."
                value={outputText}
                onChange={() => {}}
                aiScore={outputAiScore}
                isLoading={isProcessing}
                warning={fidelityWarning}
                readOnly
                showReRewrite
                onReRewrite={handleReRewrite}
                canReRewrite={!!lastJobId && !isProcessing}
                onDownload={() => setShowDownloadModal(true)}
                onClear={() => {
                  setOutputText("");
                  setOutputAiScore(null);
                  setFidelityWarning(null);
                  setStyleExcerpt("");
                  setLastJobId(null);
                }}
              />
            </div>

            <CustomInstructions
              value={customInstructions}
              onChange={setCustomInstructions}
              onGenerate={handleGenerateRewrite}
              isGenerating={isProcessing}
              canGenerate={!!inputText.trim()}
              selectedPresets={selectedPresets}
              hasContentMix={!!contentMixText.trim()}
              onClearAll={handleClearAll}
            />

            <div className="mt-8 mb-8">
              <ChatInterface
                inputText={inputText}
                contentMixText={contentMixText}
                outputText={outputText}
                onSendToBox={(boxId, text) => {
                  switch (boxId) {
                    case 'input':
                      setInputText(text);
                      setInputAiScore(null);
                      break;
                    case 'content':
                      setContentMixText(text);
                      setMixingMode(text.trim() ? 'both' : 'style');
                      break;
                    case 'output':
                      setOutputText(text);
                      break;
                  }
                  toast({ description: `Content sent to ${boxId.charAt(0).toUpperCase() + boxId.slice(1)} Box successfully!` });
                }}
              />
            </div>
          </div>
        </main>
      </div>

      <ChunkSelectionModal
        isOpen={showChunkModal}
        onClose={() => setShowChunkModal(false)}
        chunks={inputChunks}
        selectedIds={selectedChunkIds}
        onSelectionChange={handleChunkSelection}
      />

      <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        content={outputText}
        filename="rewritten-text"
      />
    </div>
  );
}
