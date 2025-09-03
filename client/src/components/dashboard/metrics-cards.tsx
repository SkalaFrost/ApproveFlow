import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Clock, GitBranch, PieChart, TrendingUp, TrendingDown } from "lucide-react";

interface Metrics {
  totalDocuments: number;
  pendingApprovals: number;
  activeWorkflows: number;
  completionRate: number;
}

export default function MetricsCards() {
  const { data: metrics, isLoading } = useQuery<Metrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16 mb-4" />
              <Skeleton className="h-4 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">No metrics available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const cards = [
    {
      title: "Total Documents",
      value: metrics.totalDocuments.toLocaleString(),
      icon: FileText,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
      trend: "+12%",
      trendDirection: "up" as const,
      trendText: "from last month",
    },
    {
      title: "Pending Approvals",
      value: metrics.pendingApprovals.toString(),
      icon: Clock,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
      trend: "-8%",
      trendDirection: "down" as const,
      trendText: "from yesterday",
    },
    {
      title: "Active Workflows",
      value: metrics.activeWorkflows.toString(),
      icon: GitBranch,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
      trend: "+3",
      trendDirection: "up" as const,
      trendText: "new this week",
    },
    {
      title: "Completion Rate",
      value: `${metrics.completionRate}%`,
      icon: PieChart,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
      trend: "+2.1%",
      trendDirection: "up" as const,
      trendText: "vs last quarter",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const TrendIcon = card.trendDirection === "up" ? TrendingUp : TrendingDown;
        const trendColor = card.trendDirection === "up" ? "text-green-600" : "text-yellow-600";
        
        return (
          <Card 
            key={index} 
            className="hover-lift transition-all"
            data-testid={`metric-${card.title.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                  <p className="text-3xl font-bold text-foreground">{card.value}</p>
                </div>
                <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`${card.color} w-6 h-6`} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className={trendColor}>
                  <TrendIcon className="w-4 h-4 mr-1 inline" />
                  {card.trend}
                </span>
                <span className="text-muted-foreground ml-2">{card.trendText}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
