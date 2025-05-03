
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
  // Start building the query
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
  
  // Add date range filter if provided
  if (dateRange?.from) {
    query = query.gte("visit_date", dateRange.from.toISOString());
    
    if (dateRange.to) {
      query = query.lte("visit_date", dateRange.to.toISOString());
    }
  }
  
  // Execute query
  const { data, error } = await query;
  
  if (error) {
    console.error("Error fetching qualitative data:", error);
    throw error;
  }
  
  // Filter by branch category if provided
  const filteredData = branchCategory
    ? data.filter(item => 
        item.branches && 
        (item.branches as any).category === branchCategory
      )
    : data;
  
  // Process the data for each qualitative metric
  const metrics: QualitativeMetric[] = [
    "leaders_aligned_with_code",
    "employees_feel_safe",
    "employees_feel_motivated",
    "leaders_abusive_language",
    "employees_comfort_escalation",
    "inclusive_culture"
  ];
  
  // Initialize the heatmap data
  const heatmapData: HeatmapData[] = metrics.map(metric => ({
    metric,
    very_poor: 0,
    poor: 0,
    neutral: 0,
    good: 0,
    excellent: 0,
    total: 0
  }));
  
  // Count occurrences for each metric and rating
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
