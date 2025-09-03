import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Download, Trash2 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Document } from "@shared/schema";

const statusConfig = {
  draft: { label: "Draft", className: "bg-gray-100 text-gray-800" },
  submitted: { label: "Submitted", className: "bg-blue-100 text-blue-800" },
  in_review: { label: "In Review", className: "bg-yellow-100 text-yellow-800" },
  approved: { label: "Approved", className: "bg-green-100 text-green-800" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-800" },
  completed: { label: "Completed", className: "bg-purple-100 text-purple-800" },
};

export default function Documents() {
  const { data: documents, isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/documents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
    },
  });

  const handleCreateDocument = () => {
    // TODO: Navigate to document creation
    console.log("Create document");
  };

  const handleViewDocument = (id: string) => {
    // TODO: Navigate to document view
    console.log("View document:", id);
  };

  const handleDownloadDocument = (id: string) => {
    // TODO: Implement document download
    console.log("Download document:", id);
  };

  const handleDeleteDocument = async (id: string) => {
    if (confirm("Are you sure you want to delete this document?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <>
        <Header 
          title="Documents"
          onCreateClick={handleCreateDocument}
        />
        <main className="flex-1 p-6 overflow-auto bg-background">
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Skeleton className="h-5 w-1/3 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header 
        title="Documents"
        onCreateClick={handleCreateDocument}
      />
      
      <main className="flex-1 p-6 overflow-auto bg-background">
        {!documents || documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96">
            <div className="text-center">
              <h3 className="text-lg font-medium text-foreground mb-2">No documents yet</h3>
              <p className="text-muted-foreground mb-6">
                Start by creating your first document
              </p>
              <Button onClick={handleCreateDocument} data-testid="button-create-first-document">
                Create Your First Document
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((document) => {
              const statusInfo = statusConfig[document.status as keyof typeof statusConfig] || statusConfig.draft;
              
              return (
                <Card key={document.id} className="hover-lift transition-all" data-testid={`document-card-${document.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-foreground truncate">{document.title}</h3>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                          <span>Form ID: {document.formId}</span>
                          <span>Step: {document.currentStep || 0}</span>
                          <span>Created: {document.createdAt ? new Date(document.createdAt).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <Badge className={statusInfo.className}>
                          {statusInfo.label}
                        </Badge>
                        
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDocument(document.id)}
                            data-testid={`button-view-${document.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadDocument(document.id)}
                            data-testid={`button-download-${document.id}`}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteDocument(document.id)}
                            disabled={deleteMutation.isPending}
                            data-testid={`button-delete-${document.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
