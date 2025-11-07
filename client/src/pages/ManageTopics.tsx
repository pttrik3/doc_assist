import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, Home, Edit2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const MODALITIES = [
  { value: "cbt", label: "CBT" },
  { value: "dbt", label: "DBT" },
  { value: "personCentered", label: "Person Centered" },
  { value: "motivationEnhancement", label: "Motivation Enhancement" },
  { value: "mindfulness", label: "Mindfulness" },
  { value: "act", label: "ACT" },
  { value: "twelveStep", label: "12 Step Education" },
];

export default function ManageTopics() {
  const [, setLocation] = useLocation();
  const [selectedModality, setSelectedModality] = useState<string>("cbt");
  const [newTopic, setNewTopic] = useState<string>("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState<string>("");

  const { data: allTopics, isLoading, refetch } = trpc.commonTopics.list.useQuery();
  
  const createMutation = trpc.commonTopics.create.useMutation({
    onSuccess: () => {
      toast.success("Topic added successfully!");
      setNewTopic("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add topic");
    },
  });

  const updateMutation = trpc.commonTopics.update.useMutation({
    onSuccess: () => {
      toast.success("Topic updated successfully!");
      setEditingId(null);
      setEditingText("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update topic");
    },
  });

  const deleteMutation = trpc.commonTopics.delete.useMutation({
    onSuccess: () => {
      toast.success("Topic deleted successfully!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete topic");
    },
  });

  const handleAddTopic = () => {
    if (!newTopic.trim()) {
      toast.error("Please enter a topic");
      return;
    }

    const maxSortOrder = filteredTopics.reduce((max, topic) => Math.max(max, topic.sortOrder), 0);
    
    createMutation.mutate({
      modality: selectedModality,
      topic: newTopic.trim(),
      sortOrder: maxSortOrder + 1,
    });
  };

  const handleUpdateTopic = (id: number) => {
    if (!editingText.trim()) {
      toast.error("Topic cannot be empty");
      return;
    }

    updateMutation.mutate({
      id,
      topic: editingText.trim(),
    });
  };

  const handleDeleteTopic = (id: number) => {
    if (confirm("Are you sure you want to delete this topic?")) {
      deleteMutation.mutate({ id });
    }
  };

  const startEditing = (id: number, currentText: string) => {
    setEditingId(id);
    setEditingText(currentText);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingText("");
  };

  const filteredTopics = allTopics?.filter(topic => topic.modality === selectedModality) || [];

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Manage Common Topics</h1>
          <p className="text-muted-foreground">
            Add, edit, or remove common topics for each modality
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setLocation("/")}
          className="flex items-center gap-2"
        >
          <Home className="h-4 w-4" />
          Home
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Modality</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Select value={selectedModality} onValueChange={setSelectedModality}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODALITIES.map((modality) => (
                <SelectItem key={modality.value} value={modality.value}>
                  {modality.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="space-y-2">
            <label className="text-sm font-medium">Add New Topic</label>
            <div className="flex gap-2">
              <Input
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                placeholder="Enter a new topic..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddTopic();
                }}
              />
              <Button
                onClick={handleAddTopic}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Current Topics ({filteredTopics.length})
            </label>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredTopics.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No topics yet. Add your first topic above.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTopics.map((topic) => (
                  <div
                    key={topic.id}
                    className="flex items-center gap-2 p-3 rounded-lg border bg-card"
                  >
                    {editingId === topic.id ? (
                      <>
                        <Input
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="flex-1"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleUpdateTopic(topic.id);
                            if (e.key === "Escape") cancelEditing();
                          }}
                          autoFocus
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUpdateTopic(topic.id)}
                          disabled={updateMutation.isPending}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={cancelEditing}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1">{topic.topic}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditing(topic.id, topic.topic)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteTopic(topic.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
