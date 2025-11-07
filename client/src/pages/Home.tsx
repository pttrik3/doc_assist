import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTypewriter } from "@/hooks/useTypewriter";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Streamdown } from "streamdown";

export default function Home() {
  const { isAuthenticated, loading, user } = useAuth();
  const isAdmin = user?.email === "pmdcredit@gmail.com";
  const [, setLocation] = useLocation();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [clientInfo, setClientInfo] = useState<string>("");
  const [writingStyleExample, setWritingStyleExample] = useState<string>("");
  const [problem, setProblem] = useState<string>("");
  const [groupTopic, setGroupTopic] = useState<string>("");
  const [selectedCommonTopic, setSelectedCommonTopic] = useState<string>("");

  // Fetch common topics from database
  const { data: allCommonTopics } = trpc.commonTopics.list.useQuery();

  // Get available topics based on selected modalities
  const getAvailableTopics = () => {
    if (!allCommonTopics) return [];
    const topics: string[] = [];
    if (groupModalities.cbt) {
      topics.push(...allCommonTopics.filter(t => t.modality === "cbt").map(t => t.topic));
    }
    if (groupModalities.dbt) {
      topics.push(...allCommonTopics.filter(t => t.modality === "dbt").map(t => t.topic));
    }
    if (groupModalities.personCentered) {
      topics.push(...allCommonTopics.filter(t => t.modality === "personCentered").map(t => t.topic));
    }
    if (groupModalities.motivationEnhancement) {
      topics.push(...allCommonTopics.filter(t => t.modality === "motivationEnhancement").map(t => t.topic));
    }
    if (groupModalities.mindfulness) {
      topics.push(...allCommonTopics.filter(t => t.modality === "mindfulness").map(t => t.topic));
    }
    if (groupModalities.act) {
      topics.push(...allCommonTopics.filter(t => t.modality === "act").map(t => t.topic));
    }
    if (groupModalities.twelveStep) {
      topics.push(...allCommonTopics.filter(t => t.modality === "twelveStep").map(t => t.topic));
    }
    return Array.from(new Set(topics)); // Remove duplicates
  };
  const [groupModalities, setGroupModalities] = useState<{
    cbt: boolean;
    dbt: boolean;
    personCentered: boolean;
    motivationEnhancement: boolean;
    mindfulness: boolean;
    act: boolean;
    twelveStep: boolean;
  }>({
    cbt: false,
    dbt: false,
    personCentered: false,
    motivationEnhancement: false,
    mindfulness: false,
    act: false,
    twelveStep: false,
  });
  const [completedDocument, setCompletedDocument] = useState<string>("");
  const [generatedContent, setGeneratedContent] = useState(""); // Content to display with typewriter effect
  
  // Typewriter effect for displaying generated content
  const { displayedText: typewriterText, isTyping } = useTypewriter({
    text: generatedContent,
    speed: 30, // 30ms between words
    onComplete: () => {
      // When typewriter completes, update the final document state
      const template = templates?.find((t) => t.id.toString() === selectedTemplateId);
      if (template?.name === "Treatment Plan") {
        setAllTreatmentPlans(prev => [...prev, generatedContent]);
        setGeneratedContent(""); // Clear for next treatment plan
      } else {
        setCompletedDocument(generatedContent);
        setGeneratedContent(""); // Clear after displaying
      }
    },
  });
  const [allTreatmentPlans, setAllTreatmentPlans] = useState<string[]>([]);
  const [showContinueTreatmentPlan, setShowContinueTreatmentPlan] = useState<boolean>(false);
  const [showNextProblemInput, setShowNextProblemInput] = useState<boolean>(false);

  // Auto-scroll during typewriter effect
  useEffect(() => {
    if (typewriterText || isTyping) {
      const box = document.getElementById('completed-document-box');
      if (box) {
        box.scrollTop = box.scrollHeight;
      }
    }
  }, [typewriterText, isTyping]);

  // Clear all data function
  const handleClearData = () => {
    if (window.confirm("Are you sure you want to clear all completed documents? This action cannot be undone.")) {
      setCompletedDocument("");
      setGeneratedContent("");
      setAllTreatmentPlans([]);
      setShowContinueTreatmentPlan(false);
      setShowNextProblemInput(false);
      setProblem("");
      toast.success("All data cleared");
    }
  };
  const [toneAdjustments, setToneAdjustments] = useState<{
    casual: boolean;
    concise: boolean;
    clinical: boolean;
    detailed: boolean;
  }>({
    casual: false,
    concise: false,
    clinical: false,
    detailed: false,
  });
  
  const { data: templates } = trpc.templates.list.useQuery();

  const saveDraftMutation = trpc.forms.saveDraft.useMutation({
    onSuccess: () => {
      toast.success("Draft saved successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save draft");
    },
  });

  const completeFormMutation = trpc.forms.complete.useMutation({
    onSuccess: (data) => {
      const template = templates?.find((t) => t.id.toString() === selectedTemplateId);
      
      if (template?.name === "Treatment Plan") {
        // Add to treatment plans array with typewriter effect
        setGeneratedContent(data.completedContent);
        setShowContinueTreatmentPlan(true);
      } else {
        // For non-Treatment Plan documents, trigger typewriter effect
        setGeneratedContent(data.completedContent);
      }
      
      toast.success("Document completed successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to complete document");
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center space-y-4">
            <h1 className="text-2xl font-bold">Documentation Assistant</h1>
            <p className="text-muted-foreground">
              Sign in to access your document templates
            </p>
            <div className="p-3 bg-muted/50 rounded-lg text-left">
              <p className="text-xs text-muted-foreground leading-relaxed">
                🔒 <strong>Privacy Notice:</strong> No personal information about you is collected or stored. Email login ensures that only you can access your documents and data on this site.
              </p>
            </div>
            <a href={getLoginUrl()}>
              <Button size="lg" className="w-full">
                Sign In
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSaveDraft = () => {
    if (!selectedTemplateId) {
      toast.error("Please select a document template");
      return;
    }

    const template = templates?.find(t => t.id.toString() === selectedTemplateId);
    if (!template) {
      toast.error("Template not found");
      return;
    }

    // Group Session DAP Notes don't require client information
    if (template.name !== "Group Session DAP Note" && !clientInfo.trim()) {
      toast.error("Please enter client information");
      return;
    }

    saveDraftMutation.mutate({
      title: template.name,
      formContent: template.content,
      clientInfo: clientInfo,
      writingStyleExample: writingStyleExample.trim() || undefined,
      completedContent: completedDocument || undefined,
    });
  };

  const handleComplete = () => {
    if (!selectedTemplateId) {
      toast.error("Please select a document template");
      return;
    }

    const template = templates?.find(t => t.id.toString() === selectedTemplateId);
    if (!template) {
      toast.error("Template not found");
      return;
    }

    // Group Session DAP Notes don't require client information
    if (template.name !== "Group Session DAP Note" && !clientInfo.trim()) {
      toast.error("Please enter client information");
      return;
    }

    // Check if Treatment Plan requires Problem field
    if (template.name === "Treatment Plan" && !problem.trim()) {
      toast.error("Please enter the Problem for Treatment Plan");
      return;
    }

    // Check if Group Session DAP Note requires Group Topic
    if (template.name === "Group Session DAP Note" && !groupTopic.trim()) {
      toast.error("Please enter the Group Topic");
      return;
    }

    let enhancedClientInfo = writingStyleExample.trim()
      ? `${clientInfo}\n\nWRITING STYLE REFERENCE: Please match the tone and writing style of this example:\n${writingStyleExample}`
      : clientInfo;

    // Add Problem to client info for Treatment Plan
    if (template.name === "Treatment Plan" && problem.trim()) {
      enhancedClientInfo = `PROBLEM: ${problem}\n\n${enhancedClientInfo}`;
    }

    // Add Group Topic and Modalities for Group Session DAP Note
    if (template.name === "Group Session DAP Note") {
      const selectedModalities = [];
      if (groupModalities.cbt) selectedModalities.push("CBT");
      if (groupModalities.dbt) selectedModalities.push("DBT");
      if (groupModalities.personCentered) selectedModalities.push("Person Centered");
      if (groupModalities.motivationEnhancement) selectedModalities.push("Motivation Enhancement");
      if (groupModalities.mindfulness) selectedModalities.push("Mindfulness");
      if (groupModalities.act) selectedModalities.push("ACT");
      if (groupModalities.twelveStep) selectedModalities.push("12 Step Education");
      
      // Group Session DAP Notes only need topic and modalities, no client info
      enhancedClientInfo = `GROUP TOPIC: ${groupTopic}${selectedModalities.length > 0 ? `\nMODALITIES: ${selectedModalities.join(", ")}` : ""}`;
    }

    // Use tRPC mutation to generate document
    // The typewriter effect will be applied when displaying the result
    completeFormMutation.mutate({
      title: template.name,
      formContent: template.content,
      clientInfo: enhancedClientInfo,
      templateName: template.name,
    });
    

  };

  const handleToneAdjustment = () => {
    if (!selectedTemplateId || !clientInfo.trim()) {
      toast.error("Please complete a document first");
      return;
    }

    const selectedTones = [];
    if (toneAdjustments.casual) selectedTones.push("more casual");
    if (toneAdjustments.concise) selectedTones.push("more concise");
    if (toneAdjustments.clinical) selectedTones.push("more clinical");
    if (toneAdjustments.detailed) selectedTones.push("more detailed");

    if (selectedTones.length === 0) {
      toast.error("Please select at least one tone adjustment");
      return;
    }

    const template = templates?.find(t => t.id.toString() === selectedTemplateId);
    if (!template) {
      toast.error("Template not found");
      return;
    }

    const toneInstruction = selectedTones.join(" and ");
    
    // Scroll to top to show progress
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    completeFormMutation.mutate({
      title: template.name,
      formContent: template.content,
      clientInfo: `${clientInfo}\n\nTONE ADJUSTMENT: Please adjust the tone to be ${toneInstruction}.`,
      templateName: template.name,
    });
  };

  return (
    <>
      {/* Background Logo */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: 'url(/logo-background.jpg)',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center center',
          backgroundSize: '70%',
          opacity: 0.2
        }}
      />
      <div className="min-h-screen p-4 relative z-10">
      <div className="container max-w-4xl mx-auto py-8">
        <div className="space-y-6">
          {/* Input Card */}
          <Card>
            <CardContent className="pt-8 pb-8 space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold">Documentation Assistant</h1>
                <p className="text-muted-foreground">
                  Select a document and enter client information
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Document</label>
                  <Select value={selectedTemplateId} onValueChange={(value) => {
                    // Clear all previous documents when selecting a new template
                    setCompletedDocument("");
                    setGeneratedContent("");
                    setAllTreatmentPlans([]);
                    setShowContinueTreatmentPlan(false);
                    setShowNextProblemInput(false);
                    setSelectedTemplateId(value);
                  }}>
                    <SelectTrigger className="w-full h-12">
                      <SelectValue placeholder="Select a document template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates?.map((template) => (
                        <SelectItem key={template.id} value={template.id.toString()} className="py-3">
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTemplateId && (
                  <>
                    {templates?.find(t => t.id.toString() === selectedTemplateId)?.name === "Treatment Plan" && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">What problem do you need the Treatment Plan for?</label>
                        <Textarea
                          value={problem}
                          onChange={(e) => setProblem(e.target.value)}
                          placeholder="Enter the primary problem (e.g., Alcohol Use Disorder, Methamphetamine Dependence, Generalized Anxiety Disorder)..."
                          className="resize-none"
                          rows={2}
                        />
                      </div>
                    )}
                    {templates?.find(t => t.id.toString() === selectedTemplateId)?.name === "Group Session DAP Note" && (
                      <>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Modality (Optional - Select to see common topics)</label>
                          <div className="grid grid-cols-2 gap-3">
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={groupModalities.cbt}
                                onChange={(e) => setGroupModalities(prev => ({ ...prev, cbt: e.target.checked }))}
                                className="w-4 h-4 rounded border-input"
                              />
                              <span className="text-sm">CBT</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={groupModalities.dbt}
                                onChange={(e) => setGroupModalities(prev => ({ ...prev, dbt: e.target.checked }))}
                                className="w-4 h-4 rounded border-input"
                              />
                              <span className="text-sm">DBT</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={groupModalities.personCentered}
                                onChange={(e) => setGroupModalities(prev => ({ ...prev, personCentered: e.target.checked }))}
                                className="w-4 h-4 rounded border-input"
                              />
                              <span className="text-sm">Person Centered</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={groupModalities.motivationEnhancement}
                                onChange={(e) => setGroupModalities(prev => ({ ...prev, motivationEnhancement: e.target.checked }))}
                                className="w-4 h-4 rounded border-input"
                              />
                              <span className="text-sm">Motivation Enhancement</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={groupModalities.mindfulness}
                                onChange={(e) => setGroupModalities(prev => ({ ...prev, mindfulness: e.target.checked }))}
                                className="w-4 h-4 rounded border-input"
                              />
                              <span className="text-sm">Mindfulness</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={groupModalities.act}
                                onChange={(e) => setGroupModalities(prev => ({ ...prev, act: e.target.checked }))}
                                className="w-4 h-4 rounded border-input"
                              />
                              <span className="text-sm">ACT</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={groupModalities.twelveStep}
                                onChange={(e) => setGroupModalities(prev => ({ ...prev, twelveStep: e.target.checked }))}
                                className="w-4 h-4 rounded border-input"
                              />
                              <span className="text-sm">12 Step Education</span>
                            </label>
                          </div>
                        </div>
                        {getAvailableTopics().length > 0 && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Common Topics (Optional)</label>
                            <Select value={selectedCommonTopic} onValueChange={(value) => {
                              setSelectedCommonTopic(value);
                              setGroupTopic(value);
                            }}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a common topic or type your own below" />
                              </SelectTrigger>
                              <SelectContent>
                                {getAvailableTopics().map((topic, index) => (
                                  <SelectItem key={index} value={topic}>
                                    {topic}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">What Was The Group Topic:</label>
                          <Textarea
                            value={groupTopic}
                            onChange={(e) => setGroupTopic(e.target.value)}
                            placeholder="Enter the group topic or select from common topics above..."
                            className="resize-none"
                            rows={2}
                          />
                        </div>
                      </>
                    )}
                    {templates?.find(t => t.id.toString() === selectedTemplateId)?.name !== "Group Session DAP Note" && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Client Information</label>
                        <Textarea
                          value={clientInfo}
                          onChange={(e) => setClientInfo(e.target.value)}
                          placeholder="Enter all relevant client details in free-form text (e.g., name, age, background, medical history, etc.)..."
                          className="resize-none"
                          rows={4}
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Example of Your Tone and Writing Style (Optional)</label>
                      <Textarea
                        value={writingStyleExample}
                        onChange={(e) => setWritingStyleExample(e.target.value)}
                        placeholder="Paste a short example of your writing style so I can match your tone..."
                        className="resize-none"
                        rows={3}
                      />
                    </div>
                  </>
                )}

                {selectedTemplateId && (
                  <div className="space-y-3 pt-4">
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={handleComplete}
                      disabled={completeFormMutation.isPending}
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
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        size="lg"
                        className="flex-1"
                        onClick={handleSaveDraft}
                        disabled={saveDraftMutation.isPending}
                      >
                        {saveDraftMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save for Later"
                        )}
                      </Button>
                      {isAdmin && (
                        <>
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => setLocation("/history")}
                          >
                            View History
                          </Button>
                          <Button
                            variant="destructive"
                            className="flex-1"
                            onClick={handleClearData}
                          >
                            Clear Data
                          </Button>
                          {templates?.find(t => t.id.toString() === selectedTemplateId)?.name === "Group Session DAP Note" && (
                            <Button
                              variant="outline"
                              size="lg"
                              className="flex-1"
                              onClick={() => setLocation("/manage-topics")}
                            >
                              Manage Topics
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {!selectedTemplateId && isAdmin && (
                  <div className="pt-4">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full"
                      onClick={() => setLocation("/history")}
                    >
                      View History
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Loading Animation */}
          {completeFormMutation.isPending && (
            <Card className="border-2 border-primary/20">
              <CardContent className="pt-8 pb-8">
                <div className="flex flex-col items-center justify-center space-y-6 py-8">
                  <div className="relative">
                    <Loader2 className="h-16 w-16 animate-spin text-primary" />
                    <div className="absolute inset-0 h-16 w-16 animate-ping opacity-20 rounded-full bg-primary" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-semibold">Generating Document...</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Please wait while we complete your document. This may take 30-60 seconds.
                    </p>
                  </div>
                  <div className="w-full max-w-md">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary animate-pulse" style={{ width: '100%' }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Completed Document Card - Show typewriter text or completed */}
          {(typewriterText || completedDocument || isTyping) && (
            <Card>
              <CardContent className="pt-8 pb-8">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold mb-2">Completed Document</h2>
                    <p className="text-sm text-muted-foreground">
                      Results with answers in bold
                    </p>
                  </div>
                  
                  <div className="prose prose-sm max-w-none bg-muted/50 rounded-lg p-6 max-h-[600px] overflow-y-auto" id="completed-document-box">
                    <Streamdown>{typewriterText || completedDocument}</Streamdown>
                    {isTyping && <span className="inline-block w-1 h-4 bg-primary animate-pulse ml-1">|</span>}
                  </div>
                  
                  <div className="p-4 bg-background rounded-lg border space-y-3">
                    <p className="text-sm font-medium">Adjust the tone (select one or more):</p>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={toneAdjustments.casual}
                          onChange={(e) => setToneAdjustments({ ...toneAdjustments, casual: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">More Casual</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={toneAdjustments.concise}
                          onChange={(e) => setToneAdjustments({ ...toneAdjustments, concise: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">More Concise</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={toneAdjustments.clinical}
                          onChange={(e) => setToneAdjustments({ ...toneAdjustments, clinical: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">More Clinical</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={toneAdjustments.detailed}
                          onChange={(e) => setToneAdjustments({ ...toneAdjustments, detailed: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">More Detailed</span>
                      </label>
                    </div>
                    <Button size="sm" className="w-full mt-2" onClick={handleToneAdjustment}>
                      Regenerate with Selected Adjustments
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Treatment Plans Stacked */}
          {allTreatmentPlans.length > 0 && (
            <Card className="shadow-md">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Completed Treatment Plans</h3>
                <div className="space-y-8">
                  {allTreatmentPlans.map((plan, index) => (
                    <div key={index} className="border-b pb-6 last:border-b-0 last:pb-0">
                      <h4 className="text-md font-semibold mb-3 text-muted-foreground">
                        Treatment Plan #{index + 1}
                      </h4>
                      <div className="prose prose-sm max-w-none">
                        <Streamdown>{plan}</Streamdown>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Continue Treatment Plan Prompt */}
          {showContinueTreatmentPlan && (
            <Card className="shadow-md">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Is there another problem that needs a Treatment Plan?</h3>
                  <p className="text-sm text-muted-foreground">
                    You can create another Treatment Plan for the same client without re-entering their information.
                  </p>
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => {
                        setShowNextProblemInput(true);
                        setShowContinueTreatmentPlan(false);
                        setProblem("");
                      }}
                      className="flex-1"
                    >
                      Yes, Create Another Treatment Plan
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowContinueTreatmentPlan(false);
                        setShowNextProblemInput(false);
                      }}
                      className="flex-1"
                    >
                      No, I'm Done
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Next Problem Input */}
          {showNextProblemInput && (
            <Card className="shadow-md">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Enter Next Problem for Treatment Plan</h3>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      What problem do you need the Treatment Plan for?
                    </label>
                    <Textarea
                      value={problem}
                      onChange={(e) => setProblem(e.target.value)}
                      placeholder="Enter the primary problem (e.g., Alcohol Use Disorder, Methamphetamine Dependence, Generalized Anxiety Disorder)..."
                      className="min-h-[80px]"
                    />
                  </div>
                  <Button 
                    onClick={() => {
                      if (!problem.trim()) {
                        toast.error("Please enter a problem");
                        return;
                      }
                      handleComplete();
                      setShowNextProblemInput(false);
                    }}
                    disabled={!problem.trim() || completeFormMutation.isPending}
                    className="w-full"
                  >
                    {completeFormMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Completing Treatment Plan...
                      </>
                    ) : (
                      "Complete Treatment Plan"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      </div>
    </>
  );
}
