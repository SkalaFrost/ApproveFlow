import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import Forms from "@/pages/forms";
import FormDesigner from "@/pages/form-designer";
import Workflows from "@/pages/workflows";
import WorkflowDesigner from "@/pages/workflow-designer";
import Documents from "@/pages/documents";
import Approvals from "@/pages/approvals";
import Users from "@/pages/users";
import Roles from "@/pages/roles";
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/layout/sidebar";

function Router() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/forms" component={Forms} />
          <Route path="/forms/designer/:id?" component={FormDesigner} />
          <Route path="/workflows" component={Workflows} />
          <Route path="/workflows/designer/:id?" component={WorkflowDesigner} />
          <Route path="/documents" component={Documents} />
          <Route path="/approvals" component={Approvals} />
          <Route path="/users" component={Users} />
          <Route path="/roles" component={Roles} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
