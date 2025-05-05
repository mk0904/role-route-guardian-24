import { useState, useEffect } from "react";
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
import { BarChart2, Users, ClipboardCheck, PieChart as PieChartIcon } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { fetchDashboardStats } from "@/services/zhService";
import { fetchRecentReports } from "@/services/reportService";
import BranchVisitDetailsModal from "@/components/branch/BranchVisitDetailsModal";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { Building2, ClipboardList } from "lucide-react";

const ZHDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardStats, setDashboardStats] = useState<any>({
    totalBranches: 0,
    totalBHRs: 0,
    activeBHRs: 0,
    visitedBranches: 0,
    coverage: 0,
    totalVisits: 0,
    submittedApproval: 0,
    participationRate: 0,
    newEmployeeCoverage: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [categoryData, setCategoryData] = useState<{name: string; value: number; color: string}[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        // Get dashboard stats
        const stats = await fetchDashboardStats(user.id);
        setDashboardStats(stats);

        // Get recent reports
        const reports = await fetchRecentReports(5);
        setRecentReports(reports);
        
      } catch (error: any) {
        console.error("Error fetching dashboard data:", error);
        toast({
          variant: "destructive",
          title: "Error loading dashboard",
          description: error.message || "Unable to load dashboard data"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusClass = (status: string) => {
    const classes = {
      submitted: "bg-blue-100 text-blue-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      draft: "bg-slate-100 text-slate-800"
    };
    return classes[status as keyof typeof classes] || classes.draft;
  };

  const handleViewReport = async (reportId: string) => {
    try {
      const report = recentReports.find(r => r.id === reportId);
      if (report) {
        setSelectedVisit(report);
        setIsModalOpen(true);
      }
    } catch (error: any) {
      console.error("Error loading report:", error);
      toast({
        variant: "destructive",
        title: "Error loading report",
        description: error.message || "Unable to load report details"
      });
    }
  };

  return (
    <div className="px-6 py-8 md:px-8 lg:px-10 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent mb-8">
        Zonal Head Dashboard
      </h1>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-32"></CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-md hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-blue-900">Total Branches</h3>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl font-bold text-blue-700">
                    {dashboardStats.totalBranches}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-slate-600">
                      {dashboardStats.visitedBranches} visited
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      this month
                    </span>
                  </div>
                  <div className="mt-3">
                    <Progress value={dashboardStats.coverage} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-0 shadow-md hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-emerald-900">Active BHRs</h3>
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Users className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl font-bold text-emerald-700">
                    {dashboardStats.activeBHRs}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-slate-600">
                      out of {dashboardStats.totalBHRs} total BHRs
                    </span>
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                      this month
                    </span>
                  </div>
                  <div className="mt-3">
                    <Progress 
                      value={(dashboardStats.activeBHRs / dashboardStats.totalBHRs) * 100} 
                      className="h-2" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-0 shadow-md hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-violet-900">Branch Visits</h3>
                  <div className="p-2 bg-violet-100 rounded-lg">
                    <ClipboardList className="h-5 w-5 text-violet-600" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl font-bold text-violet-700">
                    {dashboardStats.totalVisits}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-slate-600">
                      visits completed
                    </span>
                    <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">
                      this month
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-0 shadow-md hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-amber-900">submitted Reviews</h3>
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <ClipboardCheck className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl font-bold text-amber-700">
                    {dashboardStats.submittedApproval}
                  </span>
                  <span className="text-sm text-slate-600 mt-1">
                    reports awaiting review
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4 bg-white hover:bg-amber-50"
                    onClick={() => navigate("/zh/review-reports")}
                  >
                    Review Reports
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="shadow-sm hover:shadow-md transition-shadow mb-8">
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-lg font-medium">Recent Branch Visit Reports</CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              {recentReports.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardCheck className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-600">No reports found</p>
                  <p className="text-xs text-slate-500 mt-1">Reports will appear here as they are submitted</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="pb-3 font-medium text-slate-700">BHR</th>
                        <th className="pb-3 font-medium text-slate-700">Branch</th>
                        <th className="pb-3 font-medium text-slate-700">Visit Date</th>
                        <th className="pb-3 font-medium text-slate-700">Status</th>
                        <th className="pb-3 font-medium text-slate-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentReports.map((report) => (
                        <tr key={report.id} className="border-b last:border-0 hover:bg-slate-50">
                          <td className="py-3">
                            <div className="font-medium text-slate-800">
                              {report.bh_name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {report.bh_code}
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="font-medium text-slate-800">
                              {report.branch_name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {report.branch_location}
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="font-medium text-slate-700">
                              {formatDate(report.visit_date)}
                            </div>
                          </td>
                          <td className="py-3">
                            <span className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${getStatusClass(report.status)}`}>
                              {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                            </span>
                          </td>
                          <td className="py-3">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleViewReport(report.id)}
                              className="hover:bg-slate-100"
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-auto hover:bg-slate-100"
                onClick={() => navigate("/zh/review-reports")}
              >
                View All Reports
              </Button>
            </CardFooter>
          </Card>
        </>
      )}
      
      {/* Branch Visit Details Modal */}
      <BranchVisitDetailsModal 
        visit={selectedVisit} 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setSelectedVisit(null);
        }}
      />
    </div>
  );
};

export default ZHDashboard;
