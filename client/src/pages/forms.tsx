import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Trash2, Copy, Eye } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Form } from "@shared/schema";

export default function Forms() {
  const [, setLocation] = useLocation();
  const { data: forms, isLoading } = useQuery<Form[]>({
    queryKey: ["/api/forms"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/forms/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms"] });
    },
  });

  const handleCreateForm = () => {
    setLocation("/forms/designer");
  };

  const handleEditForm = (id: string) => {
    setLocation(`/forms/designer/${id}`);
  };

  const handleDeleteForm = async (id: string) => {
    if (confirm("Are you sure you want to delete this form?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDuplicateForm = (form: Form) => {
    // TODO: Implement form duplication
    console.log("Duplicate form:", form.id);
  };

  const handlePreviewForm = (id: string) => {
    // TODO: Implement form preview
    console.log("Preview form:", id);
  };

  if (isLoading) {
    return (
      <>
        <Header 
          title="Form Management"
          onCreateClick={handleCreateForm}
        />
        <main className="flex-1 p-6 overflow-auto bg-background">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <div className="flex justify-between">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-20" />
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
        title="Form Management"
        onCreateClick={handleCreateForm}
      />
      
      <main className="flex-1 p-6 overflow-auto bg-background">
        {!forms || forms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96">
            <div className="text-center">
              <h3 className="text-lg font-medium text-foreground mb-2">No forms yet</h3>
              <p className="text-muted-foreground mb-6">
                Get started by creating your first form
              </p>
              <Button onClick={handleCreateForm} data-testid="button-create-first-form">
                Create Your First Form
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forms.map((form) => (
              <Card key={form.id} className="hover-lift transition-all" data-testid={`form-card-${form.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{form.name}</CardTitle>
                      {form.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {form.description}
                        </p>
                      )}
                    </div>
                    <Badge variant={form.isActive ? "default" : "secondary"}>
                      {form.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <span>Components: {Array.isArray(form.schema) ? form.schema.length : 0}</span>
                    <span>{form.createdAt ? new Date(form.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePreviewForm(form.id)}
                        data-testid={`button-preview-${form.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDuplicateForm(form)}
                        data-testid={`button-duplicate-${form.id}`}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditForm(form.id)}
                        data-testid={`button-edit-${form.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteForm(form.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-${form.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
