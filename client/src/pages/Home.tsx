import { useState, useEffect } from "react";
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
import { writingSamples } from "@/lib/writingSamples";
import type { TextChunk, RewriteRequest, RewriteResponse } from "@shared/schema";

export default function Home() {
  const [provider, setProvider] = useState<string>("anthropic");
  const [inputText, setInputText] = useState("");
  const [styleText, setStyleText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [selectedPresets, setSelectedPresets] = useState<string[]>([]);
  const [selectedStyleSample, setSelectedStyleSample] = useState<string>("");
  const [showApiKeyManager, setShowApiKeyManager] = useState(false);

  const [contentMixText, setContentMixText] = useState("");
  const [mixingMode, setMixingMode] = useState<'style' | 'content' | 'both'>('style');

  const [inputAiScore, setInputAiScore] = useState<number | null>(null);
  const [styleAiScore, setStyleAiScore] = useState<number | null>(null);
  const [outputAiScore, setOutputAiScore] = useState<number | null>(null);

  const [inputChunks, setInputChunks] = useState<TextChunk[]>([]);
  const [selectedChunkIds, setSelectedChunkIds] = useState<string[]>([]);
  const [showChunkModal, setShowChunkModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const [lastJobId, setLastJobId] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    const defaultSample = writingSamples.find(sample => sample.id === "formal-functional-relationships");
    if (defaultSample && !selectedStyleSample) {
      setSelectedStyleSample(defaultSample.content);
      setStyleText(defaultSample.content);
    }
  }, []);

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
      } else if (text === styleText) {
        setStyleAiScore(data.aiScore);
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
      setOutputAiScore(data.outputAiScore);
      setLastJobId(data.jobId);
      toast({
        title: "Rewrite Complete",
        description: `AI detection reduced from ${data.inputAiScore}% to ${data.outputAiScore}%`,
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
      setOutputAiScore(data.outputAiScore);
      setLastJobId(data.jobId);
      toast({ title: "Re-rewrite Complete", description: `AI detection score: ${data.outputAiScore}%` });
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

  const handleStyleTextChange = (text: string) => {
    setStyleText(text);
    if (text.trim()) {
      analyzeTextMutation.mutate(text);
    } else {
      setStyleAiScore(null);
    }
  };

  const handleStyleSampleSelect = (content: string) => {
    setSelectedStyleSample(content);
    handleStyleTextChange(content);
  };

  const handleGenerateRewrite = () => {
    if (!inputText.trim()) {
      toast({ title: "Input Required", description: "Please provide input text to rewrite", variant: "destructive" });
      return;
    }

    const request: RewriteRequest = {
      inputText: inputChunks.length > 0 && selectedChunkIds.length > 0
        ? inputChunks.filter(chunk => selectedChunkIds.includes(chunk.id)).map(chunk => chunk.content).join('\n\n')
        : inputText,
      styleText: styleText.trim() || undefined,
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
    setStyleText("");
    setContentMixText("");
    setOutputText("");
    setCustomInstructions("");
    setInputAiScore(null);
    setStyleAiScore(null);
    setOutputAiScore(null);
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
        <LeftSidebar
          selectedPresets={selectedPresets}
          onPresetsChange={setSelectedPresets}
          selectedStyleSample={selectedStyleSample}
          onStyleSampleSelect={handleStyleSampleSelect}
          onContentSampleSelect={(content) => {
            setContentMixText(content);
            setMixingMode(styleText.trim() ? 'both' : 'content');
            toast({ description: "Writing sample sent to Content Box successfully!" });
          }}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="grid grid-cols-4 gap-4 mb-6" style={{ height: '65%' }}>
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
                title="Style Sample (Box B)"
                icon="fas fa-palette"
                placeholder="Paste or upload a sample of human-written text whose style you want to mimic..."
                value={styleText}
                onChange={handleStyleTextChange}
                aiScore={styleAiScore}
                isLoading={analyzeTextMutation.isPending}
                supportFileUpload
                onClear={() => {
                  setStyleText("");
                  setStyleAiScore(null);
                }}
                onEnterSubmit={handleGenerateRewrite}
                canSubmit={!!inputText.trim()}
              />

              <TextBox
                title="Content Reference (Box C)"
                icon="fas fa-layer-group"
                placeholder="Paste or upload content you want to blend with your text..."
                value={contentMixText}
                onChange={(text) => {
                  setContentMixText(text);
                  setMixingMode(text.trim() ? (styleText.trim() ? 'both' : 'content') : 'style');
                }}
                isLoading={analyzeTextMutation.isPending}
                supportFileUpload
                onClear={() => {
                  setContentMixText("");
                  setMixingMode(styleText.trim() ? 'style' : 'style');
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
                readOnly
                showReRewrite
                onReRewrite={handleReRewrite}
                canReRewrite={!!lastJobId && !isProcessing}
                onDownload={() => setShowDownloadModal(true)}
                onClear={() => {
                  setOutputText("");
                  setOutputAiScore(null);
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
              hasStyleSample={!!styleText.trim()}
              hasContentMix={!!contentMixText.trim()}
              onClearAll={handleClearAll}
            />

            <div className="mt-8 mb-8">
              <ChatInterface
                inputText={inputText}
                styleText={styleText}
                contentMixText={contentMixText}
                outputText={outputText}
                onSendToBox={(boxId, text) => {
                  switch (boxId) {
                    case 'input':
                      setInputText(text);
                      setInputAiScore(null);
                      break;
                    case 'style':
                      setStyleText(text);
                      setMixingMode(contentMixText.trim() ? 'both' : 'style');
                      break;
                    case 'content':
                      setContentMixText(text);
                      setMixingMode(styleText.trim() ? 'both' : 'content');
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
