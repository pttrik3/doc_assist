import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, FileText, Calendar, Eye, Home } from "lucide-react";
import { Streamdown } from "streamdown";
import { useLocation } from "wouter";

export default function History() {
  const [, setLocation] = useLocation();
  const [selectedForm, setSelectedForm] = useState<number | null>(null);
  
  const { data: forms, isLoading } = trpc.forms.list.useQuery();
  const { data: formDetail } = trpc.forms.get.useQuery(
    { id: selectedForm! },
    { enabled: selectedForm !== null }
  );

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Document History</h1>
          <p className="text-muted-foreground">
            View and manage your previously completed documents
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

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !forms || forms.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-lg font-medium mb-1">No documents yet</p>
              <p className="text-sm">Complete your first document to see it here</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {forms.map((form) => (
            <Card key={form.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {form.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(form.createdAt)}
                      </span>
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(form.status)}>
                    {form.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedForm(form.id)}
                    disabled={form.status !== "completed"}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Completed Document
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form Detail Dialog */}
      <Dialog open={selectedForm !== null} onOpenChange={() => setSelectedForm(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{formDetail?.title}</DialogTitle>
          </DialogHeader>
          {formDetail?.completedContent && (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <Streamdown>{formDetail.completedContent}</Streamdown>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
