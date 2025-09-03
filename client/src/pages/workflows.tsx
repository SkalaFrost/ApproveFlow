import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Trash2, Play, Pause } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Workflow } from "@shared/schema";

export default function Workflows() {
  const [, setLocation] = useLocation();
  const { data: workflows, isLoading } = useQuery<Workflow[]>({
    queryKey: ["/api/workflows"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/workflows/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => 
      apiRequest("PATCH", `/api/workflows/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
    },
  });

  const handleCreateWorkflow = () => {
    setLocation("/workflows/designer");
  };

  const handleEditWorkflow = (id: string) => {
    setLocation(`/workflows/designer/${id}`);
  };

  const handleDeleteWorkflow = async (id: string) => {
    if (confirm("Are you sure you want to delete this workflow?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleWorkflow = (id: string, isActive: boolean) => {
    toggleMutation.mutate({ id, isActive: !isActive });
  };

  if (isLoading) {
    return (
      <>
        <Header 
          title="Workflows"
          onCreateClick={handleCreateWorkflow}
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
        title="Workflows"
        onCreateClick={handleCreateWorkflow}
      />
      
      <main className="flex-1 p-6 overflow-auto bg-background">
        {!workflows || workflows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96">
            <div className="text-center">
              <h3 className="text-lg font-medium text-foreground mb-2">No workflows yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first approval workflow to get started
              </p>
              <Button onClick={handleCreateWorkflow} data-testid="button-create-first-workflow">
                Create Your First Workflow
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflows.map((workflow) => (
              <Card key={workflow.id} className="hover-lift transition-all" data-testid={`workflow-card-${workflow.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{workflow.name}</CardTitle>
                      {workflow.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {workflow.description}
                        </p>
                      )}
                    </div>
                    <Badge variant={workflow.isActive ? "default" : "secondary"}>
                      {workflow.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <span>Steps: {Array.isArray(workflow.steps) ? workflow.steps.length : 0}</span>
                    <span>{workflow.createdAt ? new Date(workflow.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleWorkflow(workflow.id, workflow.isActive)}
                      disabled={toggleMutation.isPending}
                      data-testid={`button-toggle-${workflow.id}`}
                    >
                      {workflow.isActive ? (
                        <>
                          <Pause className="w-4 h-4 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Activate
                        </>
                      )}
                    </Button>
                    
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditWorkflow(workflow.id)}
                        data-testid={`button-edit-${workflow.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteWorkflow(workflow.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-${workflow.id}`}
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
