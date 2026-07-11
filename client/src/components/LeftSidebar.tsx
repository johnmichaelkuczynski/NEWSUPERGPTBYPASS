import { useState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { instructionPresets } from "@/lib/instructionPresets";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const EXCERPT_CHARS = 12000;

type ExcerptPosition = "beginning" | "middle" | "end";

interface WritingSample {
  id: string;
  label: string;
  content: string;
}

interface LeftSidebarProps {
  selectedPresets: string[];
  onPresetsChange: (presets: string[]) => void;
  selectedStyleSample: string;
  onStyleSampleSelect: (content: string) => void;
  onContentSampleSelect: (content: string) => void;
}

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function getExcerpt(content: string, position: ExcerptPosition): string {
  if (content.length <= EXCERPT_CHARS) return content;

  let startChar: number;
  if (position === "beginning") {
    startChar = 0;
  } else if (position === "end") {
    startChar = Math.max(0, content.length - EXCERPT_CHARS);
  } else {
    startChar = Math.max(0, Math.floor((content.length - EXCERPT_CHARS) / 2));
  }

  // Snap to word boundary
  if (startChar > 0) {
    const nextSpace = content.indexOf(" ", startChar);
    if (nextSpace !== -1) startChar = nextSpace + 1;
  }

  let endChar = startChar + EXCERPT_CHARS;
  const lastSpace = content.lastIndexOf(" ", endChar);
  if (lastSpace > startChar) endChar = lastSpace;

  return content.slice(startChar, endChar).trim();
}

export default function LeftSidebar({
  selectedPresets,
  onPresetsChange,
  selectedStyleSample,
  onStyleSampleSelect,
  onContentSampleSelect,
}: LeftSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [excerptPos, setExcerptPos] = useState<ExcerptPosition>("beginning");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: samples = [] } = useQuery<WritingSample[]>({
    queryKey: ["/api/writing-samples"],
  });

  const handleUpload = async (file: File) => {
    if (!file.name.endsWith(".txt")) {
      setUploadError("Only .txt files");
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/writing-samples/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      queryClient.invalidateQueries({ queryKey: ["/api/writing-samples"] });
    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handlePresetSelect = (presetId: string) => {
    if (!selectedPresets.includes(presetId)) {
      onPresetsChange([...selectedPresets, presetId]);
    }
  };

  const handlePresetRemove = (presetId: string) => {
    onPresetsChange(selectedPresets.filter((id) => id !== presetId));
  };

  const groupedPresets = instructionPresets.reduce((acc, preset) => {
    if (!acc[preset.category]) acc[preset.category] = [];
    acc[preset.category].push(preset);
    return acc;
  }, {} as Record<string, typeof instructionPresets>);

  const filteredSamples = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return samples;
    return samples.filter(
      (s) =>
        s.label.toLowerCase().includes(q) ||
        s.content.toLowerCase().includes(q)
    );
  }, [searchQuery, samples]);

  const selectedSample = samples.find((s) => s.id === selectedId);

  const handleSelect = (sample: WritingSample) => {
    setSelectedId(sample.id);
    setExcerptPos("beginning");
  };

  const isLong = selectedSample ? selectedSample.content.length > EXCERPT_CHARS : false;
  const excerpt = selectedSample ? getExcerpt(selectedSample.content, excerptPos) : "";
  const totalWords = selectedSample ? wordCount(selectedSample.content) : 0;
  const excerptWords = excerpt ? wordCount(excerpt) : 0;

  return (
    <aside className="h-full bg-white border-r border-gray-200 flex flex-col overflow-hidden">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">

          {/* Instruction Presets */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <i className="fas fa-sliders-h text-primary"></i>
              Instruction Presets
            </h3>

            <Select onValueChange={handlePresetSelect}>
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder="Add preset..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {Object.entries(groupedPresets).map(([category, presets]) => (
                  <div key={category}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {category}
                    </div>
                    {presets.map((preset) => (
                      <SelectItem
                        key={preset.id}
                        value={preset.id}
                        disabled={selectedPresets.includes(preset.id)}
                      >
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{preset.name}</span>
                          <span className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {preset.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>

            {selectedPresets.length > 0 && (
              <div className="mt-3 bg-gray-50 border rounded-lg p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500">
                    Active ({selectedPresets.length})
                  </span>
                  <button
                    className="text-xs text-gray-400 hover:text-red-500"
                    onClick={() => onPresetsChange([])}
                  >
                    Clear all
                  </button>
                </div>
                {selectedPresets.map((presetId) => {
                  const preset = instructionPresets.find((p) => p.id === presetId);
                  return preset ? (
                    <div key={presetId} className="flex items-center justify-between bg-white border rounded px-2 py-1">
                      <span className="text-xs font-medium text-gray-800 flex-1 min-w-0 truncate pr-1">
                        {preset.name}
                      </span>
                      <button
                        className="text-gray-300 hover:text-red-500 text-base leading-none flex-shrink-0"
                        onClick={() => handlePresetRemove(presetId)}
                      >
                        ×
                      </button>
                    </div>
                  ) : null;
                })}
              </div>
            )}
          </div>

          <Separator />

          {/* Writing Samples */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <i className="fas fa-book text-primary"></i>
              Writing Samples
              {samples.length > 0 && (
                <span className="font-normal text-gray-400 normal-case">
                  {samples.length}
                </span>
              )}
              <button
                className="ml-auto flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium normal-case disabled:opacity-50"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                title="Upload a .txt file"
              >
                <i className={`fas ${uploading ? "fa-spinner fa-spin" : "fa-plus"}`}></i>
                {uploading ? "Uploading…" : "Add"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
              />
            </h3>
            {uploadError && (
              <div className="mb-2 text-xs text-red-500 bg-red-50 border border-red-200 rounded px-2 py-1">
                {uploadError}
              </div>
            )}

            {samples.length === 0 ? (
              <div className="text-xs text-gray-400 text-center py-4">No samples available.</div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                {samples.length > 5 && (
                  <div className="relative border-b">
                    <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs pointer-events-none"></i>
                    <input
                      className="w-full pl-8 pr-7 py-2 text-sm outline-none bg-white placeholder-gray-400"
                      placeholder="Filter..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
                        onClick={() => setSearchQuery("")}
                      >
                        ×
                      </button>
                    )}
                  </div>
                )}
                <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                  {filteredSamples.length === 0 ? (
                    <div className="px-3 py-4 text-xs text-gray-400 text-center">No matches</div>
                  ) : filteredSamples.map((sample) => (
                    <button
                      key={sample.id}
                      onClick={() => handleSelect(sample)}
                      className={`w-full text-left px-3 py-2.5 hover:bg-blue-50 transition-colors ${
                        selectedId === sample.id ? "bg-blue-50 border-l-2 border-blue-500" : ""
                      }`}
                    >
                      <div className="text-sm font-medium text-gray-800">
                        {sample.label}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {wordCount(sample.content).toLocaleString()} words
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Preview + excerpt panel */}
            {selectedSample && (
              <div className="mt-3 border rounded-lg overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-800 truncate">
                      {selectedSample.label}
                    </div>
                    <div className="text-xs text-gray-400">
                      {totalWords.toLocaleString()} words total
                      {isLong && ` · using ~${excerptWords} word excerpt`}
                    </div>
                  </div>
                  <button
                    className="ml-2 flex-shrink-0 text-gray-400 hover:text-gray-600 text-lg leading-none"
                    onClick={() => setSelectedId(null)}
                  >
                    ×
                  </button>
                </div>

                {/* Section picker — only shown for long files */}
                {isLong && (
                  <div className="flex border-b">
                    {(["beginning", "middle", "end"] as ExcerptPosition[]).map((pos) => (
                      <button
                        key={pos}
                        onClick={() => setExcerptPos(pos)}
                        className={`flex-1 py-1.5 text-xs font-medium capitalize transition-colors ${
                          excerptPos === pos
                            ? "bg-blue-500 text-white"
                            : "bg-white text-gray-500 hover:bg-gray-50"
                        } ${pos === "middle" ? "border-x" : ""}`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                )}

                {/* Excerpt preview */}
                <div className="px-3 py-3 max-h-48 overflow-y-auto bg-white">
                  <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {excerpt}
                  </p>
                  {isLong && (
                    <p className="text-xs text-gray-300 mt-2 italic">
                      — excerpt from {excerptPos} of file —
                    </p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 px-3 py-2 bg-gray-50 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs h-8"
                    onClick={() => onStyleSampleSelect(excerpt)}
                  >
                    → Style Box (B)
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs h-8"
                    onClick={() => onContentSampleSelect(selectedSample.content)}
                    title="Sends full text to Content box"
                  >
                    → Content (C)
                  </Button>
                </div>
              </div>
            )}
          </div>

        </div>
      </ScrollArea>
    </aside>
  );
}
