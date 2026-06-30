import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface ApiKeyManagerProps {
  onKeysUpdated: () => void;
}

export default function ApiKeyManager({ onKeysUpdated }: ApiKeyManagerProps) {
  const [keys, setKeys] = useState({
    openai: "",
    anthropic: "",
    deepseek: "",
    perplexity: "",
    venice: "",
    gptzero: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/set-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(keys)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "API keys have been saved successfully!"
        });
        onKeysUpdated();
      } else {
        throw new Error("Failed to save keys");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save API keys. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <i className="fas fa-key mr-2 text-yellow-600"></i>
          Enter Your API Keys
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="openai">Zhi 1 API Key</Label>
          <Input
            id="openai"
            type="password"
            placeholder="sk-..."
            value={keys.openai}
            onChange={(e) => setKeys(prev => ({ ...prev, openai: e.target.value }))}
          />
        </div>

        <div>
          <Label htmlFor="anthropic">Zhi 2 API Key</Label>
          <Input
            id="anthropic"
            type="password"
            placeholder="sk-ant-..."
            value={keys.anthropic}
            onChange={(e) => setKeys(prev => ({ ...prev, anthropic: e.target.value }))}
          />
        </div>

        <div>
          <Label htmlFor="deepseek">Zhi 3 API Key</Label>
          <Input
            id="deepseek"
            type="password"
            placeholder="sk-..."
            value={keys.deepseek}
            onChange={(e) => setKeys(prev => ({ ...prev, deepseek: e.target.value }))}
          />
        </div>

        <div>
          <Label htmlFor="perplexity">Zhi 4 API Key</Label>
          <Input
            id="perplexity"
            type="password"
            placeholder="pplx-..."
            value={keys.perplexity}
            onChange={(e) => setKeys(prev => ({ ...prev, perplexity: e.target.value }))}
          />
        </div>

        <div>
          <Label htmlFor="venice">Zhi 5 API Key</Label>
          <Input
            id="venice"
            type="password"
            placeholder="..."
            value={keys.venice}
            onChange={(e) => setKeys(prev => ({ ...prev, venice: e.target.value }))}
          />
        </div>

        <div>
          <Label htmlFor="gptzero">GPTZero API Key</Label>
          <Input
            id="gptzero"
            type="password"
            placeholder="..."
            value={keys.gptzero}
            onChange={(e) => setKeys(prev => ({ ...prev, gptzero: e.target.value }))}
          />
        </div>

        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? "Saving..." : "Save API Keys"}
        </Button>
      </CardContent>
    </Card>
  );
}