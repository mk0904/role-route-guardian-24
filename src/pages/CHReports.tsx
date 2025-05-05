import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Download, FileText, Filter, RefreshCw, Users, TrendingUp, Star, CheckCircle2, BarChart2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { 
  fetchMonthlySummaryReport,
  fetchCategoryBreakdown,
  exportBranchVisitData,
  exportBHPerformanceSummary,
  exportBranchAssignments,
  fetchCategoryStatsByMonth
} from "@/services/reportService";
import { toast } from "@/components/ui/use-toast";

// Utility to get the current month name
const getCurrentMonthName = () => {
  const months = ["January", "February", "March", "April", "May", "June", "July", 
    "August", "September", "October", "November", "December"];
  return months[new Date().getMonth()];
};

// Constants
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

const StatSummary = ({ title, value, suffix = "", icon, gradient }: { title: string; value: number | string; suffix?: string; icon: React.ReactNode; gradient: string }) => {
  return (
    <div className={`rounded-lg border p-6 ${gradient} text-white flex items-center gap-4`}>
      <div className="flex-shrink-0">{icon}</div>
      <div>
        <div className="text-sm opacity-80">{title}</div>
      <div className="mt-1 flex items-end">
        <span className="text-4xl font-bold">{value}</span>
        {suffix && <span className="text-xl ml-1 mb-1">{suffix}</span>}
        </div>
      </div>
    </div>
  );
};

const CategoryCard = ({ 
  name, 
  visits,
  avgManning,
  avgAttrition,
  branchCount,
  color = "blue" 
}: { 
  name: string; 
  visits: number;
  avgManning: number;
  avgAttrition: number;
  branchCount: number;
  color?: "blue" | "purple" | "gold" | "silver" | "bronze";
}) => {
  const getColorClasses = () => {
    switch (color) {
      case "purple": return { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" };
      case "gold": return { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" };
      case "silver": return { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" };
      case "bronze": return { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200" };
      default: return { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" };
    }
  };
  const colorClasses = getColorClasses();
  return (
    <div className={`rounded-lg border ${colorClasses.border} overflow-hidden`}>
      <div className={`py-2 px-4 ${colorClasses.bg} ${colorClasses.text}`}>
        <Badge variant="outline" className={`${colorClasses.text} bg-white font-medium`}>
          {name}
        </Badge>
        <div className="mt-2 text-lg font-medium">{visits} visits</div>
        <div className="text-xs mt-1">{branchCount} branches</div>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span>Manning</span>
          <span className="font-medium">{avgManning}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Attrition</span>
          <span className="font-medium">{avgAttrition}%</span>
        </div>
      </div>
    </div>
  );
};

interface DownloadButtonProps {
  label: string; 
  icon: React.ReactNode; 
  onClick: () => void;
  isLoading?: boolean;
}

const DownloadButton = ({ label, icon, onClick, isLoading = false }: DownloadButtonProps) => {
  return (
    <Button 
      variant="outline" 
      onClick={onClick} 
      className="flex items-center gap-2 h-auto py-3"
      disabled={isLoading}
    >
      {isLoading ? (
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900"></div>
      ) : (
        icon
      )}
      <div className="text-left">
        <div className="font-medium">{label}</div>
        <div className="text-xs text-slate-500">Download Excel</div>
      </div>
    </Button>
  );
};

const CHReports = () => {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthName());
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR.toString());
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBH, setSelectedBH] = useState("all");
  const [isDownloadingVisits, setIsDownloadingVisits] = useState(false);
  const [isDownloadingBH, setIsDownloadingBH] = useState(false);
  const [isDownloadingAssignments, setIsDownloadingAssignments] = useState(false);

  // Fetch summary report data
  const monthNumber = MONTHS.indexOf(selectedMonth) + 1; // 1-based month
  const yearNumber = parseInt(selectedYear, 10);
  const { data: summaryData, isLoading: isSummaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: ['ch-reports-summary', selectedMonth, selectedYear],
    queryFn: () => fetchMonthlySummaryReport(yearNumber, monthNumber)
  });

  // Fetch category breakdown data
  const { data: categoryData, isLoading: isCategoryLoading, refetch: refetchCategory } = useQuery({
    queryKey: ['ch-category-breakdown', selectedMonth, selectedYear],
    queryFn: () => fetchCategoryStatsByMonth(yearNumber, monthNumber)
  });

  const resetFilters = () => {
    setSelectedMonth(getCurrentMonthName());
    setSelectedYear(CURRENT_YEAR.toString());
    setSelectedLocation("all");
    setSelectedCategory("all");
    setSelectedBH("all");
    refetchSummary();
    refetchCategory();
  };

  const getCategoryColorByName = (name: string): "blue" | "purple" | "gold" | "silver" | "bronze" => {
    switch (name.toLowerCase()) {
      case "platinum": return "purple";
      case "diamond": return "blue";
      case "gold": return "gold";
      case "silver": return "silver";
      case "bronze": return "bronze";
      default: return "blue";
    }
  };

  // Export functions
  const handleDownloadBranchVisits = async () => {
    setIsDownloadingVisits(true);
    try {
      const data = await exportBranchVisitData();
      
      if (data.length === 0) {
        toast({
          title: "No data to export",
          description: "There are no branch visits matching your filters."
        });
        return;
      }
      
      // Convert data to CSV
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => JSON.stringify(row[header as keyof typeof row])).join(','))
      ].join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `branch_visits_${selectedMonth}_${selectedYear}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download complete",
        description: "Branch visit data has been exported successfully."
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "There was an error exporting the branch visit data."
      });
    } finally {
      setIsDownloadingVisits(false);
    }
  };

  const handleDownloadBHPerformance = async () => {
    setIsDownloadingBH(true);
    try {
      const data = await exportBHPerformanceSummary();
      
      if (data.length === 0) {
        toast({
          title: "No data to export",
          description: "There are no BH performance data to export."
        });
        return;
      }
      
      // Convert data to CSV
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => JSON.stringify(row[header as keyof typeof row])).join(','))
      ].join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `bh_performance_${selectedMonth}_${selectedYear}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download complete",
        description: "BH performance summary has been exported successfully."
      });
    } catch (error) {
      console.error("Error exporting BH data:", error);
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "There was an error exporting the BH performance data."
      });
    } finally {
      setIsDownloadingBH(false);
    }
  };

  const handleDownloadBranchAssignments = async () => {
    setIsDownloadingAssignments(true);
    try {
      const data = await exportBranchAssignments();
      
      if (data.length === 0) {
        toast({
          title: "No data to export",
          description: "There are no branch assignments to export."
        });
        return;
      }
      
      // Convert data to CSV
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => JSON.stringify(row[header as keyof typeof row])).join(','))
      ].join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'branch_assignments.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download complete",
        description: "Branch assignments data has been exported successfully."
      });
    } catch (error) {
      console.error("Error exporting assignments data:", error);
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "There was an error exporting the branch assignments data."
      });
    } finally {
      setIsDownloadingAssignments(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">Reports</h1>
        <p className="text-slate-600">Generate and download detailed branch visit reports</p>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-6">
            <Button 
              onClick={() => setFiltersOpen(!filtersOpen)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              {filtersOpen ? 'Hide Filters' : 'Show Filters'}
            </Button>
            <div className="flex gap-3">
              <Button 
                variant="ghost" 
                onClick={resetFilters}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Reset
              </Button>
              <Button 
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  refetchSummary();
                  refetchCategory();
                  toast({
                    title: "Report generated",
                    description: `Report for ${selectedMonth} ${selectedYear} has been generated.`
                  });
                }}
              >
                <FileText className="h-4 w-4" />
                Generate Report
              </Button>
            </div>
          </div>

          <Collapsible open={filtersOpen}>
            <CollapsibleContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="month">Month</Label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger id="month">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map(month => (
                        <SelectItem key={month} value={month}>{month}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger id="year">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS.map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger id="location">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      <SelectItem value="mumbai">Mumbai</SelectItem>
                      <SelectItem value="delhi">Delhi</SelectItem>
                      <SelectItem value="bangalore">Bangalore</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Branch Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="platinum">Platinum</SelectItem>
                      <SelectItem value="diamond">Diamond</SelectItem>
                      <SelectItem value="gold">Gold</SelectItem>
                      <SelectItem value="silver">Silver</SelectItem>
                      <SelectItem value="bronze">Bronze</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bh">BH</Label>
                  <Select value={selectedBH} onValueChange={setSelectedBH}>
                    <SelectTrigger id="bh">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All BHs</SelectItem>
                      <SelectItem value="bh1">Sanjay Singh</SelectItem>
                      <SelectItem value="bh2">Priya Sharma</SelectItem>
                      <SelectItem value="bh3">Vikram Malhotra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label>Report Type</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="summary" defaultChecked />
                      <label
                        htmlFor="summary"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Summary Report
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="detailed" />
                      <label
                        htmlFor="detailed"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Detailed Report
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Monthly Summary Report */}
      <div className="mb-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Monthly Summary Report: {selectedMonth} {selectedYear}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatSummary
            title="Total Branch Visits"
            value={isSummaryLoading ? "..." : summaryData?.length || 0}
            icon={<BarChart2 className="h-8 w-8 text-blue-100" />}
            gradient="bg-gradient-to-br from-blue-500 to-blue-700"
          />
          <StatSummary
            title="Coverage Percentage"
            value={isSummaryLoading ? "..." : summaryData ? Math.round((new Set(summaryData.map(v => v.branch_id)).size / summaryData.length) * 100) : 0}
            suffix="%"
            icon={<TrendingUp className="h-8 w-8 text-green-100" />}
            gradient="bg-gradient-to-br from-green-500 to-green-700"
          />
          <StatSummary
            title="Avg. Participation"
            value={isSummaryLoading ? "..." : summaryData ? Math.round(summaryData.reduce((acc, v) => acc + (v.total_participants || 0), 0) / summaryData.length) : 0}
            suffix="%"
            icon={<Users className="h-8 w-8 text-amber-100" />}
            gradient="bg-gradient-to-br from-amber-500 to-yellow-600"
          />
          <StatSummary
            title="Top Performer"
            value={isSummaryLoading ? "..." : summaryData ? summaryData[0]?.bh_name || "N/A" : "N/A"}
            icon={<Star className="h-8 w-8 text-purple-100" />}
            gradient="bg-gradient-to-br from-purple-500 to-indigo-600"
          />
        </div>
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4">Category Breakdown</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {isCategoryLoading ? (
              <div className="col-span-full flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : categoryData && categoryData.length > 0 ? (
              categoryData.map((category, index) => (
                <CategoryCard
                  key={index}
                  name={category.name}
                  visits={category.visits}
                  avgManning={category.avgManning}
                  avgAttrition={category.avgAttrition}
                  branchCount={category.branchCount}
                  color={getCategoryColorByName(category.name)}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500">
                No category data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Available Reports */}
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-4">Available Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DownloadButton 
            label="Branch Visit Data"
            icon={<Download className="h-5 w-5" />}
            onClick={handleDownloadBranchVisits}
            isLoading={isDownloadingVisits}
          />
          <DownloadButton 
            label="BH Performance Summary"
            icon={<Download className="h-5 w-5" />}
            onClick={handleDownloadBHPerformance}
            isLoading={isDownloadingBH}
          />
          <DownloadButton 
            label="Branch Assignments"
            icon={<Download className="h-5 w-5" />}
            onClick={handleDownloadBranchAssignments}
            isLoading={isDownloadingAssignments}
          />
        </div>
      </div>
    </div>
  );
};

export default CHReports;
