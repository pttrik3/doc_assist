import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Key, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);

  const { data: hasKeyData, isLoading: checkingKey } = trpc.apiKey.hasKey.useQuery();
  const utils = trpc.useUtils();

  const saveKeyMutation = trpc.apiKey.save.useMutation({
    onSuccess: () => {
      toast.success("API key saved successfully!");
      setApiKey("");
      setShowKey(false);
      utils.apiKey.hasKey.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save API key");
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      toast.error("Please enter your API key");
      return;
    }

    saveKeyMutation.mutate({ apiKey });
  };

  return (
    <div className="container max-w-3xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Configure your DeepSeek API key and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Key
          </CardTitle>
          <CardDescription>
            Your API key is encrypted and stored securely. You will receive the API key from your administrator.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {checkingKey ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking API key status...
            </div>
          ) : hasKeyData?.hasKey ? (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                API key is configured. You can update it below if needed.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
              <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <AlertDescription className="text-orange-800 dark:text-orange-200">
                No API key configured. Please add your API key to use document completion.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">
                {hasKeyData?.hasKey ? "Update API Key" : "Enter API Key"}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="apiKey"
                  type={showKey ? "text" : "password"}
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={saveKeyMutation.isPending}
                  className="font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowKey(!showKey)}
                  disabled={saveKeyMutation.isPending}
                >
                  {showKey ? "Hide" : "Show"}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={saveKeyMutation.isPending || !apiKey.trim()}
            >
              {saveKeyMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save API Key"
              )}
            </Button>
          </form>

          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-2">About your API key:</h3>
            <p className="text-sm text-muted-foreground">
              Your API key will be provided by your administrator. Once you receive it, paste it here to enable document completion functionality.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
