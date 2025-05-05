import { supabase } from "@/integrations/supabase/client";
import { DateRange } from "react-day-picker";

export interface BranchVisitSummary {
  id: string;
  user_id: string;
  branch_id: string;
  branches?: {
    id?: string;
    name?: string;
    location?: string;
    branch_code?: string;
    category?: string;
  };
  visit_date: string;
  status: string;
  hr_connect_session: boolean;
  total_employees_invited?: number;
  total_participants?: number;
  manning_percentage?: number;
  attrition_percentage?: number;
  non_vendor_percentage?: number;
  performance_level?: string;
  er_percentage?: number;
  cwt_cases?: number;
  new_employees_total?: number;
  new_employees_covered?: number;
  star_employees_total?: number;
  star_employees_covered?: number;
  leaders_aligned_with_code?: string;
  employees_feel_safe?: string;
  employees_feel_motivated?: string;
  leaders_abusive_language?: string;
  employees_comfort_escalation?: string;
  inclusive_culture?: string;
  feedback?: string;
  created_at: string;
  updated_at: string;
  bh_name?: string;
  bh_code?: string;
  branch_name?: string;
  branch_location?: string;
}

export interface ReportStats {
  total: number;
  draft: number;
  submitted: number;
  approved: number;
  rejected: number;
}

export type QualitativeMetric = 
  | "leaders_aligned_with_code"
  | "employees_feel_safe"
  | "employees_feel_motivated"
  | "leaders_abusive_language"
  | "employees_comfort_escalation"
  | "inclusive_culture";

export interface HeatmapData {
  metric: QualitativeMetric;
  yes: number;
  no: number;
  total: number;
}

export async function fetchBHRReportStats(userId: string): Promise<ReportStats> {
  const { data, error } = await supabase
    .from("branch_visits")
    .select("status")
    .eq("user_id", userId);

  if (error) throw error;

  const stats: ReportStats = {
    total: data.length,
    draft: data.filter(item => item.status === "draft").length,
    submitted: data.filter(item => item.status === "submitted").length,
    approved: data.filter(item => item.status === "approved").length,
    rejected: data.filter(item => item.status === "rejected").length,
  };

  return stats;
}

export async function updateReportStatus(
  reportId: string, 
  status: "approved" | "rejected"
): Promise<void> {
  const { error } = await supabase
    .from("branch_visits")
    .update({ status })
    .eq("id", reportId);

  if (error) throw error;
}

export async function getQualitativeMetricsForHeatmap(
  dateRange?: DateRange,
  branchCategory?: string | null
): Promise<HeatmapData[]> {
  let query = supabase
    .from("branch_visits")
    .select(`
      leaders_aligned_with_code,
      employees_feel_safe,
      employees_feel_motivated,
      leaders_abusive_language,
      employees_comfort_escalation,
      inclusive_culture,
      branches:branch_id (
        category
      )
    `)
    .eq("status", "approved");
  
  if (dateRange?.from) {
    query = query.gte("visit_date", dateRange.from.toISOString());
    
    if (dateRange.to) {
      query = query.lte("visit_date", dateRange.to.toISOString());
    }
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error("Error fetching qualitative data:", error);
    throw error;
  }
  
  const filteredData = branchCategory
    ? data.filter(item => 
        item.branches && 
        (item.branches as any).category === branchCategory
      )
    : data;
  
  const metrics: QualitativeMetric[] = [
    "leaders_aligned_with_code",
    "employees_feel_safe",
    "employees_feel_motivated",
    "leaders_abusive_language",
    "employees_comfort_escalation",
    "inclusive_culture"
  ];
  
  const heatmapData: HeatmapData[] = metrics.map(metric => ({
    metric,
    yes: 0,
    no: 0,
    total: 0
  }));
  
  filteredData.forEach(item => {
    metrics.forEach(metric => {
      const value = item[metric];
      if (value) {
        const metricData = heatmapData.find(d => d.metric === metric);
        if (metricData) {
          if (value.toLowerCase() === 'yes') {
            metricData.yes += 1;
          } else if (value.toLowerCase() === 'no') {
            metricData.no += 1;
          }
          metricData.total += 1;
        }
      }
    });
  });
  
  return heatmapData;
}

export async function fetchRecentReports(limit = 5): Promise<BranchVisitSummary[]> {
  try {
    const { data, error } = await supabase
      .from("branch_visits")
      .select(`
        *,
        branches:branch_id (
          id,
          name,
          location,
          branch_code,
          category
        ),
        users:user_id (
          full_name,
          e_code
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (error) throw error;
    
    const formattedData = data.map(report => ({
      ...report,
      bh_name: report.users ? report.users.full_name : 'Unknown',
      bh_code: report.users ? report.users.e_code : 'Unknown',
      branch_name: report.branches ? report.branches.name : 'Unknown',
      branch_location: report.branches ? report.branches.location : 'Unknown',
    }));
    
    return formattedData;
  } catch (error) {
    console.error("Error fetching recent reports:", error);
    throw error;
  }
}

export async function fetchReportById(reportId: string): Promise<BranchVisitSummary | null> {
  try {
    const { data, error } = await supabase
      .from("branch_visits")
      .select(`
        *,
        branches:branch_id (
          id,
          name,
          location,
          branch_code,
          category
        ),
        users:user_id (
          full_name,
          e_code
        )
      `)
      .eq('id', reportId)
      .single();
      
    if (error) throw error;
    
    if (!data) return null;
    
    const formattedData = {
      ...data,
      bh_name: data.users ? data.users.full_name : 'Unknown',
      bh_code: data.users ? data.users.e_code : 'Unknown',
      branch_name: data.branches ? data.branches.name : 'Unknown',
      branch_location: data.branches ? data.branches.location : 'Unknown',
    };
    
    return formattedData;
  } catch (error) {
    console.error("Error fetching report by ID:", error);
    throw error;
  }
}

export async function fetchMonthlySummaryReport(year: number, month: number) {
  try {
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0).toISOString();
    
    const { data, error } = await supabase
      .from("branch_visits")
      .select(`
        *,
        branches:branch_id (
          id,
          name,
          location,
          branch_code,
          category
        ),
        users:user_id (
          full_name,
          e_code
        )
      `)
      .gte('visit_date', startDate)
      .lte('visit_date', endDate)
      .in('status', ['submitted', 'approved']);
      
    if (error) {
      console.error("Error fetching monthly summary report:", error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    return data.map(visit => ({
      ...visit,
      bh_name: visit.users?.full_name || 'Unknown',
      bh_code: visit.users?.e_code || 'Unknown',
      branch_name: visit.branches?.name || 'Unknown',
      branch_location: visit.branches?.location || 'Unknown'
    }));
  } catch (error) {
    console.error("Error in fetchMonthlySummaryReport:", error);
    throw error;
  }
}

export async function fetchCategoryBreakdown() {
  try {
    const { data, error } = await supabase
      .from("branches")
      .select("category");
    
    if (error) throw error;
    
    // Aggregate counts by category
    const categoryBreakdown = data.reduce((acc: Record<string, number>, branch: any) => {
      const category = branch.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
    
    // Return in the format expected by the UI
    return Object.entries(categoryBreakdown).map(([name, value]) => ({
      name,
      value
    }));
  } catch (error) {
    console.error("Error fetching category breakdown:", error);
    throw error;
  }
}

export async function exportBranchVisitData(dateRange?: DateRange) {
  try {
    let query = supabase
      .from("branch_visits")
      .select(`
        *,
        branches:branch_id (
          id,
          name,
          location,
          branch_code,
          category
        ),
        users:user_id (
          full_name,
          e_code
        )
      `);
    
    if (dateRange?.from) {
      query = query.gte('visit_date', dateRange.from.toISOString());
      if (dateRange.to) {
        query = query.lte('visit_date', dateRange.to.toISOString());
      }
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error("Error exporting branch visit data:", error);
    throw error;
  }
}

export async function exportBHRPerformanceSummary() {
  try {
    const { data: bhrs, error: bhrError } = await supabase
      .from("users")
      .select('*')
      .eq('role', 'BHR');
      
    if (bhrError) throw bhrError;
    
    const bhrPerformance = await Promise.all(bhrs.map(async (bhr) => {
      const { data: visits, error: visitError } = await supabase
        .from("branch_visits")
        .select('*')
        .eq('user_id', bhr.id);
        
      if (visitError) throw visitError;
      
      return {
        bhr_name: bhr.full_name,
        bhr_code: bhr.e_code,
        total_visits: visits.length,
        submitted_reports: visits.filter(v => v.status === 'submitted').length,
        approved_reports: visits.filter(v => v.status === 'approved').length,
        rejected_reports: visits.filter(v => v.status === 'rejected').length,
      };
    }));
    
    return bhrPerformance;
  } catch (error) {
    console.error("Error exporting BHR performance summary:", error);
    throw error;
  }
}

export async function exportBranchAssignments() {
  try {
    const { data, error } = await supabase
      .from("branch_assignments")
      .select(`
        *,
        branches:branch_id (
          id,
          name,
          location,
          branch_code,
          category
        ),
        users:user_id (
          id,
          full_name,
          e_code
        )
      `);
      
    if (error) throw error;
    
    return data.map(assignment => ({
      bhr_name: assignment.users?.full_name || 'Unknown',
      bhr_code: assignment.users?.e_code || 'Unknown',
      branch_name: assignment.branches?.name || 'Unknown',
      branch_location: assignment.branches?.location || 'Unknown',
      branch_code: assignment.branches?.branch_code || 'Unknown',
      category: assignment.branches?.category || 'Unknown',
      assigned_date: assignment.assigned_date,
    }));
  } catch (error) {
    console.error("Error exporting branch assignments:", error);
    throw error;
  }
}

export async function fetchCategoryStatsByMonth(year: number, month: number) {
  try {
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0).toISOString();
    const { data, error } = await supabase
      .from("branch_visits")
      .select(`branch_category, manning_percentage, attrition_percentage`)
      .gte('visit_date', startDate)
      .lte('visit_date', endDate)
      .in('status', ['submitted', 'approved']);
    if (error) throw error;

    // Get number of branches per category from branches table
    const { data: branches, error: branchesError } = await supabase
      .from("branches")
      .select("category");
    if (branchesError) throw branchesError;
    const branchCounts = branches.reduce((acc: Record<string, number>, branch: any) => {
      const cat = branch.category || 'Uncategorized';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

    // Aggregate by category
    type StatAgg = { visits: number; manningSum: number; attritionSum: number };
    const stats: Record<string, StatAgg> = {};
    data.forEach(row => {
      const cat = row.branch_category || 'Uncategorized';
      if (!stats[cat]) {
        stats[cat] = { visits: 0, manningSum: 0, attritionSum: 0 };
      }
      stats[cat].visits += 1;
      stats[cat].manningSum += row.manning_percentage || 0;
      stats[cat].attritionSum += row.attrition_percentage || 0;
    });
    return Object.entries(stats).map(([name, obj]) => ({
      name,
      visits: obj.visits,
      avgManning: obj.visits ? Math.round(obj.manningSum / obj.visits) : 0,
      avgAttrition: obj.visits ? Math.round(obj.attritionSum / obj.visits) : 0,
      branchCount: branchCounts[name] || 0
    }));
  } catch (error) {
    console.error("Error fetching category stats by month:", error);
    throw error;
  }
}
