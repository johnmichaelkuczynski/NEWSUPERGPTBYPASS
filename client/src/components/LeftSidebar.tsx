import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { instructionPresets } from "@/lib/instructionPresets";
import { writingSamples, getCategories, getSamplesByCategory, getCategoryCounts } from "@/lib/writingSamples";

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
  onContentSampleSelect
}: LeftSidebarProps) {
  const [selectedSampleId, setSelectedSampleId] = useState<string>("formal-functional-relationships");

  const handlePresetSelect = (presetId: string) => {
    if (!selectedPresets.includes(presetId)) {
      onPresetsChange([...selectedPresets, presetId]);
    }
  };

  const handlePresetRemove = (presetId: string) => {
    onPresetsChange(selectedPresets.filter(id => id !== presetId));
  };



  const handleStyleSampleSelect = (sampleId: string) => {
    const sample = writingSamples.find(s => s.id === sampleId);
    if (sample) {
      setSelectedSampleId(sample.id);
      onStyleSampleSelect(sample.content);
    }
  };

  const groupedPresets = instructionPresets.reduce((acc, preset) => {
    if (!acc[preset.category]) {
      acc[preset.category] = [];
    }
    acc[preset.category].push(preset);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <aside className="w-80 bg-white shadow-sm border-r border-gray-200 overflow-y-auto">
      <ScrollArea className="h-full">
        <div className="p-4">
          {/* Instruction Presets Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <i className="fas fa-sliders-h mr-2 text-primary"></i>
              Instruction Presets
            </h3>
            
            <div className="space-y-3">
              <Select onValueChange={handlePresetSelect}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Add instruction preset..." />
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
                            <span className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {preset.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Selected Presets Display */}
              {selectedPresets.length > 0 && (
                <div className="bg-gray-50 border rounded-lg p-3">
                  <div className="text-sm font-medium text-gray-900 mb-2">
                    Selected Presets ({selectedPresets.length})
                  </div>
                  <div className="space-y-2">
                    {selectedPresets.map((presetId) => {
                      const preset = instructionPresets.find(p => p.id === presetId);
                      return preset ? (
                        <div key={presetId} className="flex items-center justify-between bg-white border rounded px-2 py-1">
                          <div className="flex-1">
                            <span className="text-sm font-medium">{preset.name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                            onClick={() => handlePresetRemove(presetId)}
                          >
                            ×
                          </Button>
                        </div>
                      ) : null;
                    })}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-xs h-6 px-2"
                    onClick={() => onPresetsChange([])}
                  >
                    Clear All
                  </Button>
                </div>
              )}


            </div>
          </div>

          <Separator className="my-6" />

          {/* Writing Style Samples Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <i className="fas fa-book mr-2 text-primary"></i>
              Writing Samples
            </h3>
            <div className="space-y-3">
              <Select value={selectedSampleId} onValueChange={handleStyleSampleSelect}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a writing sample..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {getCategories().map((category) => {
                    const categorySamples = getSamplesByCategory(category);
                    const categoryCount = getCategoryCounts()[category];
                    return (
                      <div key={category}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          {category} ({categoryCount})
                        </div>
                        {categorySamples.map((sample) => (
                          <SelectItem key={sample.id} value={sample.id}>
                            <div className="flex flex-col items-start">
                              <span className="font-medium">{sample.name}</span>
                              <span className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {sample.preview}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </div>
                    );
                  })}
                </SelectContent>
              </Select>
              
              {selectedSampleId && (
                <div className="bg-gray-50 border rounded-lg p-3">
                  <div className="text-sm">
                    <div className="font-medium text-gray-900 mb-2">
                      {writingSamples.find(s => s.id === selectedSampleId)?.name}
                    </div>
                    <div className="text-gray-600 text-xs leading-relaxed max-h-24 overflow-y-auto">
                      {writingSamples.find(s => s.id === selectedSampleId)?.preview}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-6 px-2 flex-1"
                      onClick={() => {
                        const sample = writingSamples.find(s => s.id === selectedSampleId);
                        if (sample) onStyleSampleSelect(sample.content);
                      }}
                    >
                      Send to Style Box (B)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-6 px-2 flex-1"
                      onClick={() => {
                        const sample = writingSamples.find(s => s.id === selectedSampleId);
                        if (sample) onContentSampleSelect(sample.content);
                      }}
                    >
                      Send to Content Box (C)
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-xs h-6 px-2 w-full"
                    onClick={() => {
                      setSelectedSampleId("");
                      onStyleSampleSelect("");
                    }}
                  >
                    Clear Sample
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}
