import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Database } from "@/integrations/supabase/types";

type BranchVisit = Database['public']['Tables']['branch_visits']['Row'];
type Branch = Database['public']['Tables']['branches']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

export interface BranchCategoryStats {
  category: string;
  total: number;
  visited: number;
  coverage: number;
}

export interface MonthlyStats {
  month: string;
  branchCoverage: number;
  participationRate?: number;
}

export interface BHPerformance {
  id: string;
  name: string;
  coverage: number;
  reports: number;
  e_code?: string;
}

interface DashboardStats {
  totalBranches: number;
  visitedBranches: number;
  coverage: number;
  activeBHs: number;
  avgCoverage: number;
  attritionRate: number;
  manningPercentage: number;
  erPercentage: number;
  vsLastMonth: {
    coverage: number;
    avgCoverage: number;
    attritionRate: number;
    manningPercentage: number;
    erPercentage: number;
  };
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  try {
    console.log("Fetching dashboard stats...");
    
    // Get total branches
    const { count: totalBranches, error: branchError } = await supabase
      .from('branches')
      .select('*', { count: 'exact', head: true });

    if (branchError) {
      console.error("Error fetching branches:", branchError);
      throw branchError;
    }

    // Get current month's visits
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const { data: currentMonthVisits, error: currentVisitsError } = await supabase
      .from('branch_visits')
      .select(`
        branch_id,
        visit_date,
        manning_percentage,
        attrition_percentage,
        er_percentage,
        total_employees_invited,
        total_participants,
        new_employees_covered,
        new_employees_total
      `)
      .in('status', ['submitted', 'approved'])
      .gte('visit_date', firstDayOfMonth.toISOString())
      .lte('visit_date', today.toISOString()) as { data: BranchVisit[] | null, error: any };

    if (currentVisitsError) {
      console.error("Error fetching current month visits:", currentVisitsError);
      throw currentVisitsError;
    }

    // Get previous month's visits
    const lastMonth = new Date(firstDayOfMonth);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthEnd = new Date(firstDayOfMonth);
    lastMonthEnd.setDate(0);

    const { data: lastMonthVisits, error: lastMonthVisitsError } = await supabase
      .from('branch_visits')
      .select(`
        branch_id,
        visit_date,
        manning_percentage,
        attrition_percentage,
        er_percentage,
        total_employees_invited,
        total_participants,
        new_employees_covered,
        new_employees_total
      `)
      .in('status', ['submitted', 'approved'])
      .gte('visit_date', lastMonth.toISOString())
      .lte('visit_date', lastMonthEnd.toISOString()) as { data: BranchVisit[] | null, error: any };

    if (lastMonthVisitsError) {
      console.error("Error fetching last month visits:", lastMonthVisitsError);
      throw lastMonthVisitsError;
    }

    // Calculate current month metrics
    const currentVisitedBranches = new Set(currentMonthVisits?.map(v => v.branch_id) || []);
    const currentCoverage = totalBranches ? Math.round((currentVisitedBranches.size / totalBranches) * 100) : 0;

    let currentManningSum = 0;
    let currentAttritionSum = 0;
    let currentErSum = 0;
    let currentValidVisits = 0;

    currentMonthVisits?.forEach(visit => {
      if (visit.manning_percentage !== null) {
        currentManningSum += visit.manning_percentage;
        currentValidVisits++;
      }
      if (visit.attrition_percentage !== null) currentAttritionSum += visit.attrition_percentage;
      if (visit.er_percentage !== null) currentErSum += visit.er_percentage;
    });

    const currentMetrics = {
      coverage: currentCoverage,
      avgCoverage: currentValidVisits > 0 ? Math.round(currentManningSum / currentValidVisits) : 0,
      attritionRate: currentValidVisits > 0 ? Math.round(currentAttritionSum / currentValidVisits) : 0,
      manningPercentage: currentValidVisits > 0 ? Math.round(currentManningSum / currentValidVisits) : 0,
      erPercentage: currentValidVisits > 0 ? Math.round(currentErSum / currentValidVisits) : 0
    };

    // Calculate last month metrics for comparison
    const lastVisitedBranches = new Set(lastMonthVisits?.map(v => v.branch_id) || []);
    const lastCoverage = totalBranches ? Math.round((lastVisitedBranches.size / totalBranches) * 100) : 0;

    let lastManningSum = 0;
    let lastAttritionSum = 0;
    let lastErSum = 0;
    let lastValidVisits = 0;

    lastMonthVisits?.forEach(visit => {
      if (visit.manning_percentage !== null) {
        lastManningSum += visit.manning_percentage;
        lastValidVisits++;
      }
      if (visit.attrition_percentage !== null) lastAttritionSum += visit.attrition_percentage;
      if (visit.er_percentage !== null) lastErSum += visit.er_percentage;
    });

    const lastMetrics = {
      coverage: lastCoverage,
      avgCoverage: lastValidVisits > 0 ? Math.round(lastManningSum / lastValidVisits) : 0,
      attritionRate: lastValidVisits > 0 ? Math.round(lastAttritionSum / lastValidVisits) : 0,
      manningPercentage: lastValidVisits > 0 ? Math.round(lastManningSum / lastValidVisits) : 0,
      erPercentage: lastValidVisits > 0 ? Math.round(lastErSum / lastValidVisits) : 0
    };

    // Get active BHs count
    const { data: activeBhrs, error: activeBhrsError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'BH');

    if (activeBhrsError) {
      console.error("Error fetching active BHs:", activeBhrsError);
      throw activeBhrsError;
    }

    return {
      totalBranches: totalBranches || 0,
      visitedBranches: currentVisitedBranches.size,
      coverage: currentMetrics.coverage,
      activeBHs: activeBhrs?.length || 0,
      avgCoverage: currentMetrics.avgCoverage,
      attritionRate: currentMetrics.attritionRate,
      manningPercentage: currentMetrics.manningPercentage,
      erPercentage: currentMetrics.erPercentage,
      vsLastMonth: {
        coverage: currentMetrics.coverage - lastMetrics.coverage,
        avgCoverage: currentMetrics.avgCoverage - lastMetrics.avgCoverage,
        attritionRate: currentMetrics.attritionRate - lastMetrics.attritionRate,
        manningPercentage: currentMetrics.manningPercentage - lastMetrics.manningPercentage,
        erPercentage: currentMetrics.erPercentage - lastMetrics.erPercentage
      }
    };
  } catch (error: any) {
    console.error("Error fetching dashboard stats:", error);
    toast({
      variant: "destructive",
      title: "Error loading dashboard",
      description: error.message || "Unable to load dashboard statistics"
    });
    return {
      totalBranches: 0,
      visitedBranches: 0,
      coverage: 0,
      activeBHs: 0,
      avgCoverage: 0,
      attritionRate: 0,
      manningPercentage: 0,
      erPercentage: 0,
      vsLastMonth: {
        coverage: 0,
        avgCoverage: 0,
        attritionRate: 0,
        manningPercentage: 0,
        erPercentage: 0
      }
    };
  }
}

export async function fetchBranchCategoryStats(): Promise<BranchCategoryStats[]> {
  try {
    // Get all branches with their categories
    const { data: branches, error: branchError } = await supabase
      .from('branches')
      .select('id, category') as { data: Branch[] | null, error: any };

    if (branchError) {
      throw branchError;
    }

    if (!branches) {
      return [];
    }

    // Get current month's visits
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const { data: visits, error: visitError } = await supabase
      .from('branch_visits')
      .select('branch_id')
      .in('status', ['submitted', 'approved'])
      .gte('visit_date', firstDayOfMonth.toISOString())
      .lte('visit_date', today.toISOString());

    if (visitError) {
      throw visitError;
    }

    // Create a set of visited branch IDs
    const visitedBranchIds = new Set(visits?.map(v => v.branch_id) || []);

    // Group branches by category
    const categoryStats: Record<string, { total: number; visited: number }> = {};

    branches.forEach(branch => {
      const category = branch.category || 'unknown';
      if (!categoryStats[category]) {
        categoryStats[category] = { total: 0, visited: 0 };
      }
      categoryStats[category].total++;
      if (visitedBranchIds.has(branch.id)) {
        categoryStats[category].visited++;
      }
    });

    // Convert to array format and calculate coverage
    return Object.entries(categoryStats).map(([category, stats]) => ({
      category: category.charAt(0).toUpperCase() + category.slice(1),
      total: stats.total,
      visited: stats.visited,
      coverage: Math.round((stats.visited / stats.total) * 100)
    })).sort((a, b) => b.coverage - a.coverage);

  } catch (error: any) {
    console.error("Error fetching branch category stats:", error);
    toast({
      variant: "destructive",
      title: "Error loading category stats",
      description: error.message || "Unable to load branch category statistics"
    });
    return [];
  }
}

export async function fetchMonthlyTrends(): Promise<MonthlyStats[]> {
  try {
    // Get date range for last 6 months
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 5); // Get 6 months including current
    startDate.setDate(1); // Start from first of month
    
    // Get total branches for coverage calculation
    const { count: totalBranches, error: branchError } = await supabase
      .from('branches')
      .select('*', { count: 'exact', head: true });
      
    if (branchError) {
      throw branchError;
    }
    
    // Get all visits within date range
    const { data: visits, error: visitError } = await supabase
      .from('branch_visits')
      .select(`
        visit_date,
        branch_id,
        total_employees_invited,
        total_participants
      `)
      .in('status', ['submitted', 'approved'])
      .gte('visit_date', startDate.toISOString())
      .lte('visit_date', endDate.toISOString()) as { data: BranchVisit[] | null, error: any };
      
    if (visitError) {
      throw visitError;
    }
    
    if (!visits || visits.length === 0) {
      return [];
    }
    
    // Group visits by month
    const monthlyStats: Record<string, {
      visitedBranches: Set<string>;
      totalInvited: number;
      totalParticipated: number;
    }> = {};
    
    visits.forEach(visit => {
      const visitDate = new Date(visit.visit_date);
      const monthKey = `${visitDate.getFullYear()}-${String(visitDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = {
          visitedBranches: new Set(),
          totalInvited: 0,
          totalParticipated: 0
        };
      }
      
      monthlyStats[monthKey].visitedBranches.add(visit.branch_id);
      monthlyStats[monthKey].totalInvited += visit.total_employees_invited || 0;
      monthlyStats[monthKey].totalParticipated += visit.total_participants || 0;
    });
    
    // Convert to array format
    const trends = Object.entries(monthlyStats).map(([monthKey, stats]) => {
      const [year, month] = monthKey.split('-').map(Number);
      const date = new Date(year, month - 1);
      
      return {
        month: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
        branchCoverage: totalBranches ? Math.round((stats.visitedBranches.size / totalBranches) * 100) : 0,
        participationRate: stats.totalInvited > 0 ? 
          Math.round((stats.totalParticipated / stats.totalInvited) * 100) : 0
      };
    });
    
    // Sort by date
    return trends.sort((a, b) => {
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateA.getTime() - dateB.getTime();
    });
    
  } catch (error: any) {
    console.error("Error fetching monthly trends:", error);
    toast({
      variant: "destructive",
      title: "Error loading trends",
      description: error.message || "Unable to load monthly trends"
    });
    return [];
  }
}

export async function fetchTopPerformers(): Promise<BHPerformance[]> {
  try {
    // Get current month's visits
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const { data: visits, error: visitError } = await supabase
      .from('branch_visits')
      .select(`
        user_id,
        branch_id,
        profiles:user_id (
          full_name,
          e_code
        )
      `)
      .in('status', ['submitted', 'approved'])
      .gte('visit_date', firstDayOfMonth.toISOString())
      .lte('visit_date', today.toISOString()) as { data: (BranchVisit & { profiles: Profile })[] | null, error: any };

    if (visitError) {
      throw visitError;
    }

    if (!visits || visits.length === 0) {
      return [];
    }

    // Get total branches count for coverage calculation
    const { count: totalBranches, error: branchError } = await supabase
      .from('branches')
      .select('*', { count: 'exact', head: true });

    if (branchError) {
      throw branchError;
    }

    // Group visits by BH
    const bhStats: Record<string, {
      id: string;
      name: string;
      e_code?: string;
      visitedBranches: Set<string>;
      totalVisits: number;
    }> = {};

    visits.forEach(visit => {
      const userId = visit.user_id;
      if (!userId || !visit.profiles) return;

      if (!bhStats[userId]) {
        bhStats[userId] = {
          id: userId,
          name: visit.profiles.full_name || 'Unknown',
          e_code: visit.profiles.e_code,
          visitedBranches: new Set(),
          totalVisits: 0
        };
      }

      bhStats[userId].visitedBranches.add(visit.branch_id);
      bhStats[userId].totalVisits++;
    });

    // Convert to array and calculate coverage
    const performers = Object.values(bhStats).map(bh => ({
      id: bh.id,
      name: bh.name,
      e_code: bh.e_code,
      coverage: totalBranches ? Math.round((bh.visitedBranches.size / totalBranches) * 100) : 0,
      reports: bh.totalVisits
    }));

    // Sort by coverage and then by number of reports
    return performers.sort((a, b) => {
      if (b.coverage === a.coverage) {
        return b.reports - a.reports;
      }
      return b.coverage - a.coverage;
    });

  } catch (error: any) {
    console.error("Error fetching top performers:", error);
    toast({
      variant: "destructive",
      title: "Error loading performers",
      description: error.message || "Unable to load top performers"
    });
    return [];
  }
}

export async function fetchAnalyticsData(month?: string, year?: string) {
  try {
    console.log("Fetching analytics data...");
    const currentDate = new Date();
    const selectedYear = year ? parseInt(year) : currentDate.getFullYear();
    const selectedMonth = month ? 
      MONTHS.indexOf(month) : 
      currentDate.getMonth();
    
    if (selectedMonth === -1) {
      throw new Error("Invalid month selected");
    }
    
    // Create date range for the selected month
    const startDate = new Date(selectedYear, selectedMonth, 1);
    const endDate = new Date(selectedYear, selectedMonth + 1, 0);
    
    // Create date range for previous month
    const prevStartDate = new Date(selectedYear, selectedMonth - 1, 1);
    const prevEndDate = new Date(selectedYear, selectedMonth, 0);
    
    // Get branches count
    const { count: totalBranches, error: branchError } = await supabase
      .from('branches')
      .select('*', { count: 'exact', head: true });
    
    if (branchError) throw branchError;
    
    // Get current month visits
    const { data: currentVisits, error: currentError } = await supabase
      .from('branch_visits')
      .select(`
        branch_id, 
        visit_date, 
        manning_percentage,
        attrition_percentage,
        er_percentage,
        non_vendor_percentage,
        total_employees_invited,
        total_participants,
        new_employees_total,
        new_employees_covered,
        cwt_cases
      `)
      .gte('visit_date', startDate.toISOString())
      .lte('visit_date', endDate.toISOString())
      .in('status', ['submitted', 'approved']);
    
    if (currentError) throw currentError;
    
    // Get previous month visits
    const { data: prevVisits, error: prevError } = await supabase
      .from('branch_visits')
      .select(`
        branch_id, 
        manning_percentage,
        attrition_percentage,
        er_percentage
      `)
      .gte('visit_date', prevStartDate.toISOString())
      .lte('visit_date', prevEndDate.toISOString())
      .in('status', ['submitted', 'approved']);
    
    if (prevError) throw prevError;
    
    // Get active BHs for this month
    const { data: activeBhrs, error: bhError } = await supabase
      .from('branch_visits')
      .select('user_id')
      .gte('visit_date', startDate.toISOString())
      .lte('visit_date', endDate.toISOString())
      .in('status', ['submitted', 'approved']);
    
    if (bhError) throw bhError;
    
    // Get total BHs
    const { count: totalBHs, error: totalBHError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'BH');
    
    if (totalBHError) throw totalBHError;
    
    // Count unique visited branches and calculate metrics
    const visits = currentVisits || [];
    const visitedBranchIds = new Set(visits.map(v => v.branch_id));
    const visitedCount = visitedBranchIds.size;
    const coverage = totalBranches ? Math.round((visitedCount / totalBranches) * 100) : 0;
    
    // Count unique active BHs
    const uniqueActiveBHs = new Set((activeBhrs || []).map(bh => bh.user_id));
    const activeBHsCount = uniqueActiveBHs.size;
    
    // Calculate participation rate
    const totalInvited = visits.reduce((sum, v) => sum + (v.total_employees_invited || 0), 0);
    const totalParticipated = visits.reduce((sum, v) => sum + (v.total_participants || 0), 0);
    const participationRate = totalInvited > 0 ? Math.round((totalParticipated / totalInvited) * 100) : 0;
    
    // Calculate averages for current month
    const visitCount = visits.length || 1; // Avoid division by zero
    const manningSum = visits.reduce((sum, v) => sum + (v.manning_percentage || 0), 0);
    const attritionSum = visits.reduce((sum, v) => sum + (v.attrition_percentage || 0), 0);
    const nonVendorSum = visits.reduce((sum, v) => sum + (v.non_vendor_percentage || 0), 0);
    
    // New employee coverage
    const newEmployeesTotal = visits.reduce((sum, v) => sum + (v.new_employees_total || 0), 0);
    const newEmployeesCovered = visits.reduce((sum, v) => sum + (v.new_employees_covered || 0), 0);
    const newEmployeeCoverage = newEmployeesTotal > 0 ? 
      Math.round((newEmployeesCovered / newEmployeesTotal) * 100) : 0;
    
    // Calculate averages for previous month
    const prevVisitCount = (prevVisits || []).length || 1;
    const prevManningSum = (prevVisits || []).reduce((sum, v) => sum + (v.manning_percentage || 0), 0);
    const prevAttritionSum = (prevVisits || []).reduce((sum, v) => sum + (v.attrition_percentage || 0), 0);
    const prevBranchIds = new Set((prevVisits || []).map(v => v.branch_id));
    const prevCoverage = totalBranches ? Math.round((prevBranchIds.size / totalBranches) * 100) : 0;
    
    // Calculate month-over-month changes
    const coverageChange = coverage - prevCoverage;
    const attritionChange = 
      Math.round(attritionSum / visitCount) - 
      Math.round(prevAttritionSum / prevVisitCount);
    
    // Source mix calculation (simulation since we don't have real source data)
    // In a real implementation, you would query the actual source data
    const sourceMixData = [
      { name: 'Direct', value: 45 },
      { name: 'Referral', value: 30 },
      { name: 'Agency', value: 25 }
    ];
    
    // Get top performers data
    // For simplicity, we'll reuse the fetchTopPerformers function
    const topPerformers = await fetchTopPerformers();
    const topBH = topPerformers.length > 0 ? topPerformers[0] : null;
    
    // Calculate top category by coverage
    const categoryData = await fetchCategoryBreakdown();
    const topCategory = categoryData && categoryData.length > 0 ? 
      categoryData.reduce((prev, current) => 
        prev.coverage > current.coverage ? prev : current
      ) : null;
    
    return {
      branchVisitCoverage: coverage,
      employeeParticipation: participationRate,
      activeBHs: { 
        active: activeBHsCount, 
        total: totalBHs || 0 
      },
      attritionRate: Math.round(attritionSum / visitCount),
      vsLastMonth: {
        branchVisitCoverage: coverageChange,
        employeeParticipation: 0, // No previous month data for this metric
        attritionRate: attritionChange
      },
      hrParameters: {
        manningPercentage: Math.round(manningSum / visitCount),
        nonVendorPercentage: Math.round(nonVendorSum / visitCount),
        employeeCoverage: participationRate,
        newEmployeeCoverage: newEmployeeCoverage
      },
      performanceIndicators: {
        avgAttrition: Math.round(attritionSum / visitCount),
        cwtCases: visits.reduce((sum, v) => sum + (v.cwt_cases || 0), 0)
      },
      sourceMix: sourceMixData,
      topPerformers: {
        bh: topBH ? { name: topBH.name, coverage: topBH.coverage } : { name: 'N/A', coverage: 0 },
        category: topCategory ? { name: topCategory.name, rate: topCategory.coverage } : { name: 'N/A', coverage: 0 },
        location: { name: 'Mumbai', coverage: 94 }, // Would need location-specific queries
        mostImproved: { name: 'Silver Category', improvement: 15 } // Would need historical data comparison
      }
    };
  } catch (error: any) {
    console.error("Error fetching analytics data:", error);
    toast({
      variant: "destructive",
      title: "Error loading analytics data",
      description: error.message || "An unexpected error occurred"
    });
    
    // Return default data structure with zeros
    return {
      branchVisitCoverage: 0,
      employeeParticipation: 0,
      activeBHs: { active: 0, total: 0 },
      attritionRate: 0,
      vsLastMonth: {
        branchVisitCoverage: 0,
        employeeParticipation: 0,
        attritionRate: 0
      },
      hrParameters: {
        manningPercentage: 0,
        nonVendorPercentage: 0,
        employeeCoverage: 0,
        newEmployeeCoverage: 0
      },
      performanceIndicators: {
        avgAttrition: 0,
        cwtCases: 0
      },
      sourceMix: [
        { name: 'Direct', value: 0 },
        { name: 'Referral', value: 0 },
        { name: 'Agency', value: 0 }
      ],
      topPerformers: {
        bh: { name: 'N/A', coverage: 0 },
        category: { name: 'N/A', rate: 0 },
        location: { name: 'N/A', coverage: 0 },
        mostImproved: { name: 'N/A', improvement: 0 }
      }
    };
  }
}

export async function fetchCategoryBreakdown() {
  try {
    console.log("Fetching category breakdown...");
    
    // Get all branches with categories
    const { data: branches, error: branchError } = await supabase
      .from('branches')
      .select('id, category');
    
    if (branchError) throw branchError;
    
    if (!branches || branches.length === 0) {
      return [];
    }
    
    // Get all branch visits
    const { data: visits, error: visitError } = await supabase
      .from('branch_visits')
      .select('branch_id')
      .in('status', ['submitted', 'approved']);
    
    if (visitError) throw visitError;
    
    // Create a set of visited branch IDs
    const visitedBranchIds = new Set((visits || []).map(v => v.branch_id));
    
    // Count branches and visited branches by category
    const categoryCounts: Record<string, { branches: number, visited: number }> = {};
    
    branches.forEach(branch => {
      if (!branch.category) return;
      
      const category = branch.category.charAt(0).toUpperCase() + branch.category.slice(1);
      
      if (!categoryCounts[category]) {
        categoryCounts[category] = { branches: 0, visited: 0 };
      }
      
      categoryCounts[category].branches++;
      if (visitedBranchIds.has(branch.id)) {
        categoryCounts[category].visited++;
      }
    });
    
    // Format the results
    return Object.entries(categoryCounts).map(([name, data]) => ({
      name,
      branches: data.branches,
      coverage: data.branches > 0 ? Math.round((data.visited / data.branches) * 100) : 0
    }));
  } catch (error: any) {
    console.error("Error fetching category breakdown:", error);
    toast({
      variant: "destructive",
      title: "Error loading category data",
      description: error.message || "An unexpected error occurred"
    });
    
    // Return empty array on error
    return [];
  }
}

export async function generateReportData(month?: string, year?: string) {
  try {
    // Get date range for the selected month
    const selectedYear = year ? parseInt(year) : new Date().getFullYear();
    const selectedMonth = month ? MONTHS.indexOf(month) : new Date().getMonth();
    
    const startDate = new Date(selectedYear, selectedMonth, 1);
    const endDate = new Date(selectedYear, selectedMonth + 1, 0);
    
    // Get branches count
    const { count: totalBranches, error: branchError } = await supabase
      .from('branches')
      .select('*', { count: 'exact', head: true });
    
    if (branchError) throw branchError;
    
    // Get branch visits for the selected month
    const { data: visits, error: visitError } = await supabase
      .from('branch_visits')
      .select(`
        id, 
        branch_id,
        user_id,
        visit_date,
        total_employees_invited,
        total_participants,
        new_employees_covered,
        new_employees_total,
        profiles:user_id (
          full_name,
          e_code
        )
      `)
      .gte('visit_date', startDate.toISOString())
      .lte('visit_date', endDate.toISOString())
      .in('status', ['submitted', 'approved']) as { data: (BranchVisit & { profiles: Profile })[] | null, error: any };
    
    if (visitError) throw visitError;
    
    if (!visits || visits.length === 0) {
      return {
        totalBranchVisits: 0,
        coveragePercentage: 0,
        avgParticipation: 0,
        employeeCoverage: 0,
        newEmployeeCoverage: 0,
        topPerformer: "No data",
        categoryBreakdown: []
      };
    }
    
    // Calculate coverage metrics
    const visitedBranchIds = new Set(visits.map(v => v.branch_id));
    const coveragePercentage = totalBranches ? 
      Math.round((visitedBranchIds.size / totalBranches) * 100) : 0;
    
    // Calculate participation and coverage rates
    let totalInvited = 0;
    let totalParticipated = 0;
    let totalEmployeeCoverage = 0;
    let totalNewEmployeeCoverage = 0;
    let validEmployeeCounts = 0;
    let validNewEmployeeCounts = 0;
    
    visits.forEach(visit => {
      if (visit.total_employees_invited && visit.total_participants) {
        totalInvited += visit.total_employees_invited;
        totalParticipated += visit.total_participants;
      }
      
      if (visit.new_employees_covered !== null && visit.new_employees_total !== null && visit.new_employees_total > 0) {
        totalNewEmployeeCoverage += (visit.new_employees_covered / visit.new_employees_total) * 100;
        validNewEmployeeCounts++;
      }
    });
    
    const avgParticipation = totalInvited > 0 ? 
      Math.round((totalParticipated / totalInvited) * 100) : 0;
      
    const employeeCoverage = validEmployeeCounts > 0 ?
      Math.round(totalEmployeeCoverage / validEmployeeCounts) : 0;
      
    const newEmployeeCoverage = validNewEmployeeCounts > 0 ?
      Math.round(totalNewEmployeeCoverage / validNewEmployeeCounts) : 0;
    
    // Find top performer
    const bhVisitCounts: Record<string, { name: string; count: number }> = {};
    visits.forEach(visit => {
      if (!visit.user_id || !visit.profiles?.full_name) return;
      
      if (!bhVisitCounts[visit.user_id]) {
        bhVisitCounts[visit.user_id] = {
          name: visit.profiles.full_name,
          count: 0
        };
      }
      bhVisitCounts[visit.user_id].count++;
    });
    
    const topPerformer = Object.values(bhVisitCounts).reduce(
      (top, current) => current.count > top.count ? current : top,
      { name: "No data", count: 0 }
    ).name;
    
    // Get category breakdown
    const categoryBreakdown = await fetchCategoryBreakdown();
    
    return {
      totalBranchVisits: visits.length,
      coveragePercentage,
      avgParticipation,
      employeeCoverage,
      newEmployeeCoverage,
      topPerformer,
      categoryBreakdown
    };
  } catch (error: any) {
    console.error("Error generating report data:", error);
    toast({
      variant: "destructive",
      title: "Error generating report",
      description: error.message || "Unable to generate report data"
    });
    
    return {
      totalBranchVisits: 0,
      coveragePercentage: 0,
      avgParticipation: 0,
      employeeCoverage: 0,
      newEmployeeCoverage: 0,
      topPerformer: "Error loading data",
      categoryBreakdown: []
    };
  }
}

// Helper function to get category colors
const getCategoryColor = (category: string) => {
  const colors = {
    platinum: "bg-violet-500",
    diamond: "bg-blue-500",
    gold: "bg-amber-500",
    silver: "bg-slate-400",
    bronze: "bg-orange-700"
  };
  return colors[category.toLowerCase()] || "bg-gray-500";
};

// Months array for date calculations
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
