import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { instructionPresets } from "@/lib/instructionPresets";

interface LeftSidebarProps {
  selectedPresets: string[];
  onPresetsChange: (presets: string[]) => void;
}

export default function LeftSidebar({
  selectedPresets,
  onPresetsChange,
}: LeftSidebarProps) {
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

  return (
    <aside className="h-full bg-white border-r border-gray-200 flex flex-col overflow-hidden">
      <ScrollArea className="flex-1">
        <div className="p-4">
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
                const preset = instructionPresets.find((preset) => preset.id === presetId);
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
      </ScrollArea>
    </aside>
  );
}