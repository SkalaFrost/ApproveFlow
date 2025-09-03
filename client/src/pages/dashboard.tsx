import Header from "@/components/layout/header";
import MetricsCards from "@/components/dashboard/metrics-cards";
import RecentActivity from "@/components/dashboard/recent-activity";
import WorkflowVisualization from "@/components/workflow/workflow-visualization";
import PendingApprovals from "@/components/dashboard/pending-approvals";
import QuickActions from "@/components/dashboard/quick-actions";

export default function Dashboard() {
  return (
    <>
      <Header 
        title="Dashboard"
        showCreateButton={true}
        onCreateClick={() => console.log("Create new clicked")}
      />
      
      <main className="flex-1 p-6 overflow-auto bg-background">
        <div className="animate-fade-in">
          <MetricsCards />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <RecentActivity />
            </div>
            
            <div className="space-y-8">
              <WorkflowVisualization />
              <QuickActions />
              <PendingApprovals />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
