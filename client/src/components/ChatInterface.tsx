import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  provider?: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  inputText: string;
  styleText: string;
  contentMixText: string;
  outputText: string;
  onSendToBox: (boxId: 'input' | 'style' | 'content' | 'output', text: string) => void;
}

export default function ChatInterface({ 
  inputText, 
  styleText, 
  contentMixText, 
  outputText, 
  onSendToBox 
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string>("anthropic");
  const [isLoading, setIsLoading] = useState(false);

  const providers = [
    { value: "openai", label: "Zhi 1" },
    { value: "anthropic", label: "Zhi 2" },
    { value: "deepseek", label: "Zhi 3" },
    { value: "perplexity", label: "Zhi 4" },
    { value: "venice", label: "Zhi 5" },
  ];

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    try {
      const response = await apiRequest("/api/chat", {
        method: "POST",
        body: {
          message: currentInput,
          provider: selectedProvider,
          context: {
            inputText: inputText || null,
            styleText: styleText || null,
            contentMixText: contentMixText || null,
            outputText: outputText || null
          }
        }
      });

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        provider: selectedProvider,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        provider: selectedProvider,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold flex items-center">
            <i className="fas fa-comments mr-2 text-blue-600"></i>
            Chat with AI - Test LLM Providers
          </CardTitle>
          <div className="flex space-x-2">
            <Button 
              onClick={clearChat} 
              variant="outline" 
              size="sm"
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <i className="fas fa-trash mr-2"></i>
              Clear
            </Button>
            <div className="flex items-center space-x-1">
              <span className="text-xs text-gray-500 mr-1">Send Chat to:</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onSendToBox('input', messages.map(m => `${m.role}: ${m.content}`).join('\n\n'))}
                className="px-2 py-1 text-xs"
                title="Send entire chat to Input Box (A)"
              >
                A
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onSendToBox('style', messages.map(m => `${m.role}: ${m.content}`).join('\n\n'))}
                className="px-2 py-1 text-xs"
                title="Send entire chat to Style Box (B)"
              >
                B
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onSendToBox('content', messages.map(m => `${m.role}: ${m.content}`).join('\n\n'))}
                className="px-2 py-1 text-xs"
                title="Send entire chat to Content Box (C)"
              >
                C
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onSendToBox('output', messages.map(m => `${m.role}: ${m.content}`).join('\n\n'))}
                className="px-2 py-1 text-xs"
                title="Send entire chat to Output Box (D)"
              >
                D
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 mt-3">
          <label className="text-sm font-medium">Provider:</label>
          <Select value={selectedProvider} onValueChange={setSelectedProvider}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {providers.map(provider => (
                <SelectItem key={provider.value} value={provider.value}>
                  {provider.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <ScrollArea className="h-64 w-full border rounded-md p-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p className="mb-2">No messages yet. Try asking:</p>
              <p className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                "Which LLM am I using?"
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map(message => (
                <div 
                  key={message.id}
                  className={`p-3 rounded-lg ${
                    message.role === 'user' 
                      ? 'bg-blue-100 ml-8' 
                      : 'bg-gray-100 mr-8'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-xs uppercase tracking-wide">
                      {message.role === 'user' ? 'You' : `AI (${message.provider})`}
                    </span>
                    <span className="text-xs text-gray-500">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.role === 'assistant' && (
                    <div className="flex gap-1 mt-2">
                      <button
                        onClick={() => onSendToBox('input', message.content)}
                        className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                        title="Send to Input Box (A)"
                      >
                        →A
                      </button>
                      <button
                        onClick={() => onSendToBox('style', message.content)}
                        className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                        title="Send to Style Box (B)"
                      >
                        →B
                      </button>
                      <button
                        onClick={() => onSendToBox('content', message.content)}
                        className="px-2 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
                        title="Send to Content Box (C)"
                      >
                        →C
                      </button>
                      <button
                        onClick={() => onSendToBox('output', message.content)}
                        className="px-2 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600"
                        title="Send to Output Box (D)"
                      >
                        →D
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="bg-gray-100 mr-8 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-spinner fa-spin"></i>
                    <span className="text-sm">AI is thinking...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="space-y-2">
          <div className="flex gap-2 text-xs">
            <span className="font-medium">Quick inserts:</span>
            <button
              onClick={() => setInput(prev => prev + (prev ? '\n\n' : '') + `Input Box A: "${inputText}"`)}
              disabled={!inputText || isLoading}
              className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
            >
              +A
            </button>
            <button
              onClick={() => setInput(prev => prev + (prev ? '\n\n' : '') + `Style Box B: "${styleText}"`)}
              disabled={!styleText || isLoading}
              className="px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
            >
              +B
            </button>
            <button
              onClick={() => setInput(prev => prev + (prev ? '\n\n' : '') + `Content Box C: "${contentMixText}"`)}
              disabled={!contentMixText || isLoading}
              className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 disabled:opacity-50"
            >
              +C
            </button>
            <button
              onClick={() => setInput(prev => prev + (prev ? '\n\n' : '') + `Output Box D: "${outputText}"`)}
              disabled={!outputText || isLoading}
              className="px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 disabled:opacity-50"
            >
              +D
            </button>
          </div>
          
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask the AI anything... Use +A/B/C/D buttons to reference box contents. (Press Enter to send, Shift+Enter for new line)"
              className="min-h-[80px] resize-none"
              disabled={isLoading}
            />
            <Button 
              onClick={sendMessage} 
              disabled={!input.trim() || isLoading}
              className="px-6"
            >
              <i className="fas fa-paper-plane mr-2"></i>
              Send
            </Button>
          </div>
        </div>

        <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
          <strong>Features:</strong> AI knows about all box contents • Use +A/B/C/D to reference boxes • Use →A/B/C buttons to send AI responses to boxes<br/>
          <strong>Quick tests:</strong> "Which LLM am I using?", "Rewrite my input text", "Analyze the style sample", "Improve the content reference"
        </div>
      </CardContent>
    </Card>
  );
}