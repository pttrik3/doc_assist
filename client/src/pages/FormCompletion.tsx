import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, FileText, User } from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

export default function FormCompletion() {
  const [title, setTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [clientInfo, setClientInfo] = useState("");
  const [completedForm, setCompletedForm] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);

  const { data: templates } = trpc.templates.list.useQuery();
  const searchParams = new URLSearchParams(useSearch());

  // Auto-select template from URL parameter
  useEffect(() => {
    const templateParam = searchParams.get('template');
    if (templateParam && templates) {
      const templateId = parseInt(templateParam);
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setSelectedTemplateId(templateId);
        setFormContent(template.content);
        setTitle(template.name);
      }
    }
  }, [templates]);

  const completeFormMutation = trpc.forms.complete.useMutation({
    onSuccess: (data) => {
      setCompletedForm(data.completedContent);
      toast.success("Document completed successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to complete document");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !formContent.trim() || !clientInfo.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setCompletedForm("");
    completeFormMutation.mutate({
      title,
      formContent,
      clientInfo,
    });
  };

  const handleReset = () => {
    setTitle("");
    setFormContent("");
    setClientInfo("");
    setCompletedForm("");
    setSelectedTemplateId(null);
  };

  const handleTemplateSelect = (templateId: string) => {
    if (templateId === "") {
      setSelectedTemplateId(null);
      setFormContent("");
      return;
    }
    
    const id = parseInt(templateId);
    setSelectedTemplateId(id);
    
    const template = templates?.find(t => t.id === id);
    if (template) {
      setFormContent(template.content);
      if (!title) {
        setTitle(template.name);
      }
    }
  };

  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Complete Document</h1>
        <p className="text-muted-foreground">
          Enter your blank document and client information to automatically complete it
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Details
              </CardTitle>
              <CardDescription>
                Select a template or paste your blank document questions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template">Select Template (Optional)</Label>
                <select
                  id="template"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={selectedTemplateId || ""}
                  onChange={(e) => handleTemplateSelect(e.target.value)}
                  disabled={completeFormMutation.isPending}
                >
                  <option value="">-- Custom Document --</option>
                  {templates?.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Document Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Client Assessment Document"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={completeFormMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="formContent">Blank Document Questions</Label>
                <Textarea
                  id="formContent"
                  placeholder="Paste your blank document questions here..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  disabled={completeFormMutation.isPending}
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Client Information
              </CardTitle>
              <CardDescription>
                Enter all relevant client details in free-form text
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                id="clientInfo"
                placeholder="Enter client information here (e.g., name, age, background, medical history, etc.)..."
                value={clientInfo}
                onChange={(e) => setClientInfo(e.target.value)}
                disabled={completeFormMutation.isPending}
                className="min-h-[200px]"
              />
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={completeFormMutation.isPending}
              className="flex-1"
            >
              {completeFormMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Completing Document...
                </>
              ) : (
                "Complete Document"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={completeFormMutation.isPending}
            >
              Reset
            </Button>
          </div>
        </div>

        {/* Output Section */}
        <div>
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle>Completed Document</CardTitle>
              <CardDescription>
                Generated answers will appear here with answers in bold
              </CardDescription>
            </CardHeader>
            <CardContent>
              {completedForm ? (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <Streamdown>{completedForm}</Streamdown>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>Complete the document to see results here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
