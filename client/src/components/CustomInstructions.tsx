import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CustomInstructionsProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  canGenerate: boolean;
  selectedPresets?: string[];
  hasStyleSample?: boolean;
  hasContentMix?: boolean;
  onClearAll?: () => void;
}

export default function CustomInstructions({
  value,
  onChange,
  onGenerate,
  isGenerating,
  canGenerate,
  selectedPresets = [],
  hasStyleSample = false,
  hasContentMix = false,
  onClearAll,
}: CustomInstructionsProps) {
  return (
    <Card className="mt-6 bg-white border border-gray-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <i className="fas fa-magic mr-2 text-primary"></i>
              AI Text Rewriter
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Transform your text with AI detection bypass and style customization
            </p>
          </div>
          
          {/* Status Indicators */}
          <div className="flex space-x-2">
            {selectedPresets.length > 0 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                <i className="fas fa-cog mr-1"></i>
                {selectedPresets.length} Preset{selectedPresets.length > 1 ? 's' : ''}
              </Badge>
            )}
            {hasStyleSample && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                <i className="fas fa-palette mr-1"></i>
                Style Sample
              </Badge>
            )}
            {hasContentMix && (
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <i className="fas fa-layer-group mr-1"></i>
                Content Mix
              </Badge>
            )}
          </div>
        </div>

        {/* Custom Instructions */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Instructions (Optional)
          </label>
          <Textarea
            className="w-full h-20 resize-none border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm text-gray-900 placeholder-gray-500 p-3"
            placeholder="Add specific instructions for the rewrite: tone, style, complexity, target audience, etc..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            Example: "Make it more casual and conversational" or "Use academic language with technical terms"
          </p>
        </div>

        {/* Main Rewrite Button */}
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-sm font-medium text-gray-700">Ready to Rewrite:</span>
                <span className={`text-sm font-semibold px-2 py-1 rounded-full ${
                  isGenerating 
                    ? 'bg-yellow-100 text-yellow-700' 
                    : canGenerate 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-500'
                }`}>
                  {isGenerating ? 'Processing...' : canGenerate ? 'Ready' : 'Add Input Text'}
                </span>
              </div>
              <p className="text-xs text-gray-600">
                {canGenerate 
                  ? "Your text will be rewritten to reduce AI detection while maintaining meaning"
                  : "Please enter text in Box A to start the rewriting process"
                }
              </p>
            </div>
            
            <div className="flex space-x-3">
              {onClearAll && (
                <Button
                  onClick={onClearAll}
                  variant="outline"
                  size="lg"
                  className="font-semibold px-6 py-3 text-base text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                >
                  <i className="fas fa-trash-alt mr-2"></i>
                  Delete All
                </Button>
              )}
              <Button
                onClick={onGenerate}
                disabled={!canGenerate || isGenerating}
                size="lg"
                className="font-semibold px-8 py-3 text-base bg-primary hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {isGenerating ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Rewriting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-wand-magic-sparkles mr-2"></i>
                    Start Rewrite
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        {!isGenerating && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-900 mb-1">💡 Quick Tips:</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Use Clear buttons (🗑️) to remove content from individual boxes</li>
              <li>• Press Ctrl+Enter in any text box to start rewrite instantly</li>
              <li>• Try different AI providers for varied rewriting approaches</li>
              <li>• Use "Delete All" to start completely fresh</li>
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}
