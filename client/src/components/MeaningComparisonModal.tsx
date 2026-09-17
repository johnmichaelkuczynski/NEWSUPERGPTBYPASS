import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface MeaningComparison {
  sameMeaning: boolean;
  confidence: number;
  summary: string;
  differences: Array<{
    category: string;
    inputMeaning: string;
    outputMeaning: string;
    explanation: string;
    severity: "minor" | "material";
  }>;
}

interface MeaningComparisonModalProps {
  result: MeaningComparison | null;
  isOpen: boolean;
  onClose: () => void;
  onFix: () => void;
  isFixing: boolean;
}

export default function MeaningComparisonModal({ result, isOpen, onClose, onFix, isFixing }: MeaningComparisonModalProps) {
  if (!result) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Meaning Comparison</DialogTitle>
          <DialogDescription>
            Comparison of Input Text (Box A) and Rewritten Output (Box D)
          </DialogDescription>
        </DialogHeader>

        <div className={`rounded-lg border p-4 ${result.sameMeaning ? "border-green-300 bg-green-50" : "border-amber-300 bg-amber-50"}`}>
          <div className={`text-lg font-semibold ${result.sameMeaning ? "text-green-800" : "text-amber-900"}`}>
            {result.sameMeaning ? "The input and output have the same meaning." : "The input and output differ in meaning."}
          </div>
          <p className="mt-1 text-sm text-gray-700">{result.summary}</p>
          <p className="mt-2 text-xs font-medium text-gray-600">Confidence: {result.confidence}%</p>
        </div>

        {!result.sameMeaning && result.differences.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Meaning differences</h3>
            {result.differences.map((difference, index) => (
              <div key={index} className="rounded-lg border border-gray-200 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded bg-gray-100 px-2 py-1 text-xs font-semibold capitalize text-gray-700">
                    {difference.category.replace(/_/g, " ")}
                  </span>
                  <span className={`rounded px-2 py-1 text-xs font-semibold ${difference.severity === "material" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {difference.severity === "material" ? "Material difference" : "Minor difference"}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold">Input meaning:</span> {difference.inputMeaning}</p>
                  <p><span className="font-semibold">Output meaning:</span> {difference.outputMeaning}</p>
                  <p className="text-gray-600">{difference.explanation}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          {!result.sameMeaning && (
            <Button onClick={onFix} disabled={isFixing}>
              <i className="fas fa-wand-magic-sparkles mr-2"></i>
              {isFixing ? "Fixing Output..." : "Fix Output"}
            </Button>
          )}
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}