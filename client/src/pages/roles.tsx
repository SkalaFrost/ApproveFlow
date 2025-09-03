import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Trash2, Shield, Users, Calendar } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertRoleSchema } from "@shared/schema";
import type { Role, User } from "@shared/schema";
import { z } from "zod";

const permissions = [
  { id: 'read', label: 'Read', description: 'View documents and forms' },
  { id: 'create', label: 'Create', description: 'Create new documents and forms' },
  { id: 'update', label: 'Update', description: 'Edit existing documents and forms' },
  { id: 'delete', label: 'Delete', description: 'Delete documents and forms' },
  { id: 'approve', label: 'Approve', description: 'Approve documents in workflows' },
  { id: 'admin', label: 'Admin', description: 'Full system administration access' },
];

type CreateRoleForm = z.infer<typeof insertRoleSchema>;

export default function Roles() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const { toast } = useToast();

  const { data: roles, isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ["/api/roles"],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const form = useForm<CreateRoleForm>({
    resolver: zodResolver(insertRoleSchema),
    defaultValues: {
      name: "",
      description: "",
      permissions: {},
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateRoleForm) => apiRequest("POST", "/api/roles", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      toast({
        title: "Success",
        description: "Role created successfully",
      });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create role. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Role> }) => 
      apiRequest("PATCH", `/api/roles/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      toast({
        title: "Success",
        description: "Role updated successfully",
      });
      setEditingRole(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update role. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/roles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "Role deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete role. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateRole = () => {
    setIsCreateDialogOpen(true);
    form.reset();
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
  };

  const handleDeleteRole = async (id: string, name: string) => {
    // Check if any users have this role
    const usersWithRole = users?.filter(user => user.role === name) || [];
    
    if (usersWithRole.length > 0) {
      toast({
        title: "Cannot Delete Role",
        description: `This role is assigned to ${usersWithRole.length} user(s). Please reassign them first.`,
        variant: "destructive",
      });
      return;
    }

    if (confirm(`Are you sure you want to delete role "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (data: CreateRoleForm) => {
    createMutation.mutate(data);
  };

  const getUserCountForRole = (roleName: string) => {
    return users?.filter(user => user.role === roleName).length || 0;
  };

  const getPermissionsList = (permissions: any) => {
    if (!permissions || typeof permissions !== 'object') return [];
    
    return Object.keys(permissions).filter(key => permissions[key] === true);
  };

  if (rolesLoading) {
    return (
      <>
        <Header 
          title="Roles & Permissions"
          onCreateClick={handleCreateRole}
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
        title="Roles & Permissions"
        onCreateClick={handleCreateRole}
      />
      
      <main className="flex-1 p-6 overflow-auto bg-background">
        {!roles || roles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96">
            <div className="text-center">
              <h3 className="text-lg font-medium text-foreground mb-2">No roles found</h3>
              <p className="text-muted-foreground mb-6">
                Create your first role to get started
              </p>
              <Button onClick={handleCreateRole} data-testid="button-create-first-role">
                <Shield className="w-4 h-4 mr-2" />
                Create Your First Role
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role) => {
              const userCount = getUserCountForRole(role.name);
              const permissionsList = getPermissionsList(role.permissions);
              
              return (
                <Card key={role.id} className="hover-lift transition-all" data-testid={`role-card-${role.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate capitalize">
                          {role.name}
                        </CardTitle>
                        {role.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {role.description}
                          </p>
                        )}
                      </div>
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="w-4 h-4 mr-2" />
                        <span>{userCount} user{userCount !== 1 ? 's' : ''}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>{role.createdAt ? new Date(role.createdAt).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Permissions:</p>
                        <div className="flex flex-wrap gap-1">
                          {permissionsList.length > 0 ? (
                            permissionsList.slice(0, 3).map((permission) => (
                              <Badge key={permission} variant="outline" className="text-xs">
                                {permission}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              No permissions
                            </Badge>
                          )}
                          {permissionsList.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{permissionsList.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditRole(role)}
                        className="flex-1"
                        data-testid={`button-edit-${role.id}`}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteRole(role.id, role.name)}
                        disabled={deleteMutation.isPending || userCount > 0}
                        data-testid={`button-delete-${role.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Create Role Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., manager, editor, viewer" 
                          {...field}
                          data-testid="input-role-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe what this role can do..."
                          {...field}
                          value={field.value || ""}
                          data-testid="textarea-role-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div>
                  <FormLabel>Permissions</FormLabel>
                  <div className="mt-2 space-y-3">
                    {permissions.map((permission) => (
                      <FormField
                        key={permission.id}
                        control={form.control}
                        name="permissions"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                            <FormControl>
                              <Checkbox
                                checked={(field.value as Record<string, boolean>)?.[permission.id] || false}
                                onCheckedChange={(checked) => {
                                  const currentPermissions = (field.value as Record<string, boolean>) || {};
                                  field.onChange({
                                    ...currentPermissions,
                                    [permission.id]: checked,
                                  });
                                }}
                                data-testid={`checkbox-permission-${permission.id}`}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="font-medium">
                                {permission.label}
                              </FormLabel>
                              <p className="text-sm text-muted-foreground">
                                {permission.description}
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                    data-testid="button-cancel-create-role"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending}
                    data-testid="button-create-role"
                  >
                    {createMutation.isPending ? "Creating..." : "Create Role"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit Role Dialog */}
        {editingRole && (
          <Dialog open={!!editingRole} onOpenChange={() => setEditingRole(null)}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Role: {editingRole.name}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm"><strong>Description:</strong> {editingRole.description || 'No description'}</p>
                  <p className="text-sm"><strong>Users:</strong> {getUserCountForRole(editingRole.name)}</p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Permissions</h4>
                  <div className="space-y-3">
                    {permissions.map((permission) => (
                      <div key={permission.id} className="flex flex-row items-start space-x-3 rounded-md border p-3">
                        <Checkbox
                          checked={(editingRole.permissions as Record<string, boolean>)?.[permission.id] || false}
                          onCheckedChange={(checked) => {
                            const currentPermissions = (editingRole.permissions as Record<string, boolean>) || {};
                            const updatedPermissions = {
                              ...currentPermissions,
                              [permission.id]: checked,
                            };
                            updateMutation.mutate({ 
                              id: editingRole.id, 
                              data: { permissions: updatedPermissions }
                            });
                          }}
                          disabled={updateMutation.isPending}
                          data-testid={`checkbox-edit-permission-${permission.id}`}
                        />
                        <div className="space-y-1 leading-none">
                          <p className="font-medium text-sm">{permission.label}</p>
                          <p className="text-sm text-muted-foreground">
                            {permission.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={() => setEditingRole(null)}
                    data-testid="button-close-edit-role"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </>
  );
}
