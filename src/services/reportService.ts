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
  very_poor: number;
  poor: number;
  neutral: number;
  good: number;
  excellent: number;
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
    very_poor: 0,
    poor: 0,
    neutral: 0,
    good: 0,
    excellent: 0,
    total: 0
  }));
  
  filteredData.forEach(item => {
    metrics.forEach(metric => {
      const value = item[metric];
      if (value) {
        const metricData = heatmapData.find(d => d.metric === metric);
        if (metricData) {
          metricData[value as keyof HeatmapData] = 
            (metricData[value as keyof HeatmapData] as number) + 1;
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
          employee_code
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (error) throw error;
    
    const formattedData = data.map(report => ({
      ...report,
      bh_name: report.users ? report.users.full_name : 'Unknown',
      bh_code: report.users ? report.users.employee_code : 'Unknown',
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
          employee_code
        )
      `)
      .eq('id', reportId)
      .single();
      
    if (error) throw error;
    
    if (!data) return null;
    
    const formattedData = {
      ...data,
      bh_name: data.users ? data.users.full_name : 'Unknown',
      bh_code: data.users ? data.users.employee_code : 'Unknown',
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
        )
      `)
      .gte('visit_date', startDate)
      .lte('visit_date', endDate);
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error("Error fetching monthly summary report:", error);
    throw error;
  }
}

export async function fetchCategoryBreakdown() {
  try {
    const { data, error } = await supabase
      .from("branches")
      .select(`
        category,
        count
      `)
      .select();
    
    if (error) throw error;
    
    const categoryBreakdown = data.reduce((acc: Record<string, number>, branch: any) => {
      const category = branch.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(categoryBreakdown).map(([category, count]) => ({
      category,
      count: count as number
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
          employee_code
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
        bhr_code: bhr.employee_code,
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
          employee_code
        )
      `);
      
    if (error) throw error;
    
    return data.map(assignment => ({
      bhr_name: assignment.users?.full_name || 'Unknown',
      bhr_code: assignment.users?.employee_code || 'Unknown',
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
