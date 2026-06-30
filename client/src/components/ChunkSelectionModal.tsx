import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { TextChunk } from "@shared/schema";

interface ChunkSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  chunks: TextChunk[];
  selectedIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
}

export default function ChunkSelectionModal({
  isOpen,
  onClose,
  chunks,
  selectedIds,
  onSelectionChange,
}: ChunkSelectionModalProps) {
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(selectedIds);

  useEffect(() => {
    setLocalSelectedIds(selectedIds);
  }, [selectedIds, isOpen]);

  const handleChunkToggle = (chunkId: string, checked: boolean) => {
    if (checked) {
      setLocalSelectedIds(prev => [...prev, chunkId]);
    } else {
      setLocalSelectedIds(prev => prev.filter(id => id !== chunkId));
    }
  };

  const handleConfirm = () => {
    onSelectionChange(localSelectedIds);
  };

  const handleCancel = () => {
    setLocalSelectedIds(selectedIds);
    onClose();
  };

  const handleSelectAll = () => {
    setLocalSelectedIds(chunks.map(chunk => chunk.id));
  };

  const handleSelectNone = () => {
    setLocalSelectedIds([]);
  };

  const getAiScoreColor = (score?: number) => {
    if (!score) return "text-gray-500";
    if (score <= 30) return "text-green-600";
    if (score <= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select Text Chunks</DialogTitle>
          <DialogDescription>
            Your document has been split into chunks. Select which chunks you want to rewrite:
          </DialogDescription>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              <i className="fas fa-check-double mr-1"></i>Select All
            </Button>
            <Button variant="outline" size="sm" onClick={handleSelectNone}>
              <i className="fas fa-times mr-1"></i>Select None
            </Button>
          </div>
        </DialogHeader>
        
        <ScrollArea className="max-h-96 pr-4">
          <div className="space-y-4">
            {chunks.map((chunk) => (
              <div key={chunk.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <Checkbox
                        checked={localSelectedIds.includes(chunk.id)}
                        onCheckedChange={(checked) => handleChunkToggle(chunk.id, !!checked)}
                      />
                      <span className="font-medium text-gray-900">
                        Chunk (Words {chunk.startWord}-{chunk.endWord})
                      </span>
                    </label>
                    <span className={`text-sm ${getAiScoreColor(chunk.aiScore)}`}>
                      {chunk.aiScore ? `AI Score: ${chunk.aiScore}%` : 'Analyzing...'}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-700">
                    {chunk.content.length > 300 
                      ? `${chunk.content.substring(0, 300)}...`
                      : chunk.content
                    }
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-gray-600">
              {localSelectedIds.length} of {chunks.length} chunks selected
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleConfirm}>
                Process Selected Chunks
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
