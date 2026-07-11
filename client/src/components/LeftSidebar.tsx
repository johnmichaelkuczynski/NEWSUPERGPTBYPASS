import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { instructionPresets } from "@/lib/instructionPresets";
import { useQuery } from "@tanstack/react-query";

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

export default function LeftSidebar({
  selectedPresets,
  onPresetsChange,
  selectedStyleSample,
  onStyleSampleSelect,
  onContentSampleSelect,
}: LeftSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: samples = [] } = useQuery<WritingSample[]>({
    queryKey: ["/api/writing-samples"],
  });

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
    if (!q) return samples.slice(0, 10);
    return samples
      .filter((s) =>
        s.label.toLowerCase().includes(q) ||
        s.content.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [searchQuery, samples]);

  const selectedSample = samples.find((s) => s.id === selectedId);

  const handleSelect = (sample: WritingSample) => {
    setSelectedId(sample.id);
    onStyleSampleSelect(sample.content);
  };

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
                <span className="ml-auto font-normal text-gray-400 normal-case">
                  {samples.length} total
                </span>
              )}
            </h3>

            {/* List with optional filter */}
            {samples.length === 0 ? (
              <div className="text-xs text-gray-400 text-center py-4">No samples available.</div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                {/* Filter input — only shown when there are enough samples to need it */}
                {samples.length > 5 && (
                  <div className="relative border-b">
                    <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs pointer-events-none"></i>
                    <input
                      className="w-full pl-8 pr-7 py-2 text-sm outline-none bg-white placeholder-gray-400"
                      placeholder="Filter samples..."
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
                <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
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
                      <div className="text-xs text-gray-400 mt-0.5 truncate">
                        {sample.content.slice(0, 65)}…
                      </div>
                    </button>
                  ))}
                </div>
                {filteredSamples.length === 10 && searchQuery && (
                  <div className="px-3 py-1.5 bg-gray-50 border-t text-xs text-gray-400 text-center">
                    Showing top 10 — refine filter to see more
                  </div>
                )}
              </div>
            )}

            {/* Full preview */}
            {selectedSample && (
              <div className="mt-3 border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b">
                  <span className="text-sm font-semibold text-gray-800 truncate">
                    {selectedSample.label}
                  </span>
                  <button
                    className="ml-2 flex-shrink-0 text-gray-400 hover:text-gray-600 text-lg leading-none"
                    onClick={() => setSelectedId(null)}
                  >
                    ×
                  </button>
                </div>
                <div className="px-3 py-3 max-h-56 overflow-y-auto">
                  <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {selectedSample.content}
                  </p>
                </div>
                <div className="flex gap-2 px-3 py-2 bg-gray-50 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs h-8"
                    onClick={() => onStyleSampleSelect(selectedSample.content)}
                  >
                    → Style Box (B)
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs h-8"
                    onClick={() => onContentSampleSelect(selectedSample.content)}
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
