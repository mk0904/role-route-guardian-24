import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { FilePlus, Users, Calendar, ClipboardCheck, TrendingUp, Building2, FileText, Eye, Check, Trash2, Clock } from "lucide-react";
import { 
  getBranchVisitStats, 
  getBranchCategoryCoverage,
  getVisitMetrics, 
  getBHVisitMetrics 
} from "@/services/branchService";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type BranchCategoryStats = {
  category: string;
  completion: number;
  color: string;
};

type VisitMetricsType = {
  hrConnectSessions: { completed: number; total: number };
  avgParticipation: number;
  employeeCoverage: number;
  newEmployeeCoverage: number;
};

const BHDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Branch visit stats
  const [stats, setStats] = useState({
    assignedBranches: 0,
    branchesVisited: 0,
    submittedVisits: 0,
    approvedVisits: 0,
    totalVisits: 0,
    completionRate: 0,
  });
  
  const [branchCategories, setBranchCategories] = useState<BranchCategoryStats[]>([]);
  
  const [visitMetrics, setVisitMetrics] = useState<VisitMetricsType>({
    hrConnectSessions: { completed: 0, total: 0 },
    avgParticipation: 0,
    employeeCoverage: 0,
    newEmployeeCoverage: 0
  });
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        // Fetch profile from local storage or Supabase
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        if (profileData) {
          setProfile(profileData);
        }
        
        // Fetch branch visit stats
        const visitStats = await getBranchVisitStats(user.id);
        setStats(visitStats);
        
        // Fetch branch category coverage
        const categoryCoverage = await getBranchCategoryCoverage(user.id);
        setBranchCategories(categoryCoverage);
        
        // Get visit metrics for this BH user
        const metrics = await getBHVisitMetrics(user.id);
        setVisitMetrics(metrics);
        
      } catch (error) {
        console.error("Error fetching BH dashboard data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load dashboard data.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user?.id]);
  
  // Format category names for display
  const formatCategoryName = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };
  
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Welcome section */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Welcome back, {profile?.full_name || "Branch Head"}
        </h1>
        <p className="text-muted-foreground">
          Here's an overview of your branch visits and performance metrics for this month.
        </p>
      </div>
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-sm text-slate-600">Loading dashboard data...</p>
        </div>
      ) : (
        <>
          {/* Stats cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="bg-blue-50">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-blue-700 font-medium mb-6">Assigned Branches</h3>
                    <div className="text-4xl font-bold text-blue-900">{stats.assignedBranches}</div>
                    <p className="mt-1 text-sm text-blue-700">Total branches under your supervision</p>
                  </div>
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-violet-50">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-violet-700 font-medium mb-6">Branches Covered</h3>
                    <div className="text-4xl font-bold text-violet-900">{stats.branchesVisited}</div>
                    <p className="mt-1 text-sm text-violet-700">Branches visited this month</p>
                    <span className="mt-2 inline-block text-xs text-violet-600 bg-violet-100 px-2 py-0.5 rounded">this month</span>
                  </div>
                  <Building2 className="h-6 w-6 text-violet-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-emerald-50">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-emerald-700 font-medium mb-6">Total Visits</h3>
                    <div className="text-4xl font-bold text-emerald-900">{stats.totalVisits}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm text-emerald-700">Total visits made</span>
                      <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">this month</span>
                    </div>
                  </div>
                  <ClipboardCheck className="h-6 w-6 text-emerald-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-orange-50">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-orange-700 font-medium mb-6">Approved Reports</h3>
                    <div className="text-4xl font-bold text-orange-900">{stats.approvedVisits}</div>
                    <p className="mt-1 text-sm text-orange-700">Total approved this month</p>
                    <span className="mt-2 inline-block text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded">this month</span>
                  </div>
                  <Calendar className="h-6 w-6 text-orange-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-50">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-slate-700 font-medium mb-6">Completion Rate</h3>
                    <div className="text-4xl font-bold text-slate-900">{stats.completionRate}%</div>
                    <p className="mt-1 text-sm text-slate-700">Of assigned branches visited</p>
                    <span className="mt-2 inline-block text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">this month</span>
                  </div>
                  <TrendingUp className="h-6 w-6 text-slate-600" />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Branch visit progress */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Branch Visit Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-slate-600 mb-4">Branch Categories</h4>
                    <div className="space-y-4">
                      {branchCategories.map((cat) => {
                        // Extract the first bg-* class from cat.color
                        const bgClass = cat.color.split(' ').find(c => c.startsWith('bg-')) || 'bg-slate-500';
                        
                        return (
                          <div key={cat.category}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${bgClass}`} />
                                <span className="text-sm font-medium">{formatCategoryName(cat.category)}</span>
                              </div>
                              <span className="text-sm font-medium">{cat.completion}%</span>
                            </div>
                            <div className="bg-slate-100 rounded-full h-[6px] overflow-hidden">
                              <div 
                                className={`h-full ${bgClass} transition-all duration-500 ease-in-out h-[6px]`}
                                style={{ width: `${cat.completion}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Visit Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-muted-foreground">HR Connect Sessions</h4>
                      <span className="text-sm font-medium">
                        {visitMetrics.hrConnectSessions.completed} / {visitMetrics.hrConnectSessions.total}
                      </span>
                    </div>
                    <Progress
                      value={visitMetrics.hrConnectSessions.total > 0 ? 
                        (visitMetrics.hrConnectSessions.completed / visitMetrics.hrConnectSessions.total) * 100 : 0
                      }
                      className="h-[6px]"
                      indicatorClassName="bg-blue-500 h-[6px]"
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Average Participation</h4>
                      <span className="text-sm font-medium">
                        {visitMetrics.avgParticipation}%
                      </span>
                    </div>
                    <Progress value={visitMetrics.avgParticipation} className="h-[6px]" indicatorClassName="bg-green-500 h-[6px]" />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Employee Coverage</h4>
                      <span className="text-sm font-medium">
                        {visitMetrics.employeeCoverage}%
                      </span>
                    </div>
                    <Progress value={visitMetrics.employeeCoverage} className="h-[6px]" indicatorClassName="bg-purple-500 h-[6px]" />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-muted-foreground">New Employee Coverage</h4>
                      <span className="text-sm font-medium">
                        {visitMetrics.newEmployeeCoverage}%
                      </span>
                    </div>
                    <Progress value={visitMetrics.newEmployeeCoverage} className="h-[6px]" indicatorClassName="bg-orange-500 h-[6px]" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button 
                  onClick={() => navigate("/bh/new-visit")}
                  className="w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <FilePlus className="h-4 w-4" />
                  Create New Visit
                </Button>
              </CardFooter>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default BHDashboard;
