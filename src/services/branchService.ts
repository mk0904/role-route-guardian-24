import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { toast } from "@/components/ui/use-toast";

type Branch = Database['public']['Tables']['branches']['Row'];

interface BranchDetails {
  id?: string;
  name?: string;
  location?: string;
  category: string;
}

interface BranchVisit {
  id: string;
  visit_date: string;
  branch_id: string;
  user_id: string;
  status: string;
  branch_category: string;
  manning_percentage: number | null;
  attrition_percentage: number | null;
  er_percentage: number | null;
  non_vendor_percentage: number | null;
  cwt_cases: number | null;
  performance_level: string | null;
  total_employees_invited: number | null;
  total_participants: number | null;
  hr_connect_session: boolean | null;
  new_employees_total: number | null;
  new_employees_covered: number | null;
  star_employees_total: number | null;
  star_employees_covered: number | null;
  feedback: string | null;
  best_practices: string | null;
  leaders_aligned_with_code: string | null;
  employees_feel_safe: string | null;
  employees_feel_motivated: string | null;
  leaders_abusive_language: string | null;
  employees_comfort_escalation: string | null;
  inclusive_culture: string | null;
  branches?: {
    id: string;
    name: string;
    location: string;
    category: string;
    branch_code: string | null;
  };
  profiles?: {
    full_name: string;
    e_code: string;
  };
}

export interface BranchAssignment {
  id: string;
  user_id: string;
  branch_id: string;
  assigned_at: string;
  branches?: {
    id: string;
    name: string;
    location: string;
    category: string;
    branch_code: string | null;
  };
}

// Fetch all branches
export const getAllBranches = async (): Promise<Branch[]> => {
  try {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .order('name');
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error: any) {
    console.error("Error fetching branches:", error);
    toast({
      variant: "destructive",
      title: "Error fetching branches",
      description: error.message || "Unable to fetch branches"
    });
    return [];
  }
};

// Fetch branches by user ID (assigned branches)
export const getBranchesByUser = async (userId: string): Promise<BranchDetails[]> => {
  try {
    const { data, error } = await supabase
      .from('branch_assignments')
      .select(`
        branch_id,
        branches:branch_id (
          id,
          name,
          location,
          category
        )
      `)
      .eq('user_id', userId) as { data: BranchAssignment[] | null, error: any };
    
    if (error) {
      throw error;
    }

    const branchList = data?.filter(item => item.branches).map(item => item.branches!) || [];
    return branchList;
  } catch (error: any) {
    console.error("Error fetching assigned branches:", error);
    toast({
      variant: "destructive",
      title: "Error fetching assigned branches",
      description: error.message || "Unable to fetch your assigned branches"
    });
    return [];
  }
};

// Fetch branch details by ID
export const getBranchById = async (branchId: string): Promise<Branch | null> => {
  try {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('id', branchId)
      .single() as { data: Branch | null, error: any };
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error: any) {
    console.error("Error fetching branch details:", error);
    toast({
      variant: "destructive",
      title: "Error fetching branch details",
      description: error.message || "Unable to fetch branch details"
    });
    return null;
  }
};

// Fetch user branch visits (for My Visits page)
export const fetchUserBranchVisits = async (userId: string): Promise<BranchVisit[]> => {
  try {
    const { data, error } = await supabase
      .from('branch_visits')
      .select(`
        id,
        visit_date,
        branch_id,
        user_id,
        status,
        manning_percentage,
        attrition_percentage,
        er_percentage,
        non_vendor_percentage,
        cwt_cases,
        performance_level,
        total_employees_invited,
        total_participants,
        hr_connect_session,
        new_employees_total,
        new_employees_covered,
        star_employees_total,
        star_employees_covered,
        feedback,
        best_practices,
        leaders_aligned_with_code,
        employees_feel_safe,
        employees_feel_motivated,
        leaders_abusive_language,
        employees_comfort_escalation,
        inclusive_culture,
        branch_category,
        branches:branch_id (
          id,
          name,
          location,
          category,
          branch_code
        ),
        profiles:user_id (
          full_name,
          e_code
        )
      `)
      .eq('user_id', userId)
      .order('visit_date', { ascending: false }) as { data: BranchVisit[] | null, error: any };
      
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error: any) {
    console.error("Error fetching user branch visits:", error);
    toast({
      variant: "destructive",
      title: "Error fetching visits",
      description: error.message || "Unable to fetch your branch visits"
    });
    return [];
  }
};

// Fetch assigned branches with details (for New Visit page)
export const fetchAssignedBranchesWithDetails = async (userId: string): Promise<BranchAssignment[]> => {
  try {
    const { data: assignments, error: assignmentError } = await supabase
      .from('branch_assignments')
      .select(`
        branch_id,
        branches:branch_id (
          id,
          name,
          location,
          category,
          branch_code
        )
      `)
      .eq('user_id', userId)
      .order('branches(name)', { ascending: true }) as { data: BranchAssignment[] | null, error: any };

    if (assignmentError) {
      throw assignmentError;
    }

    if (!assignments || assignments.length === 0) {
      return [];
    }

    // Return just the branch assignments with branch details
    return assignments || [];
  } catch (error) {
    console.error("Error fetching assigned branches with details:", error);
    toast({
      title: "Error fetching branch details",
      description: error.message || "Unable to fetch branch visit details",
      variant: "destructive",
    });
    throw error;
  }
};

// Fetch branches by zone ID
export const getBranchesByZone = async (zoneId: string): Promise<Branch[]> => {
  try {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('zone_id', zoneId)
      .order('name');
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error: any) {
    console.error("Error fetching branches by zone:", error);
    toast({
      variant: "destructive",
      title: "Error fetching branches",
      description: error.message || "Unable to fetch branches for the selected zone"
    });
    return [];
  }
};

// Create a new branch visit
export const createBranchVisit = async (visitData: Partial<BranchVisit>): Promise<{ success: boolean, data: any, error: any }> => {
  try {
    // Ensure required fields are present
    if (!visitData.user_id || !visitData.branch_id || !visitData.visit_date || !visitData.branch_category) {
      throw new Error("Missing required fields for branch visit");
    }

    // Format the data to match the database schema
    const formattedData = {
      user_id: visitData.user_id,
      branch_id: visitData.branch_id,
      visit_date: visitData.visit_date,
      branch_category: visitData.branch_category,
      hr_connect_session: visitData.hr_connect_session || false,
      total_employees_invited: visitData.total_employees_invited || 0,
      total_participants: visitData.total_participants || 0,
      manning_percentage: visitData.manning_percentage || 0,
      attrition_percentage: visitData.attrition_percentage || 0,
      non_vendor_percentage: visitData.non_vendor_percentage || 0,
      er_percentage: visitData.er_percentage || 0,
      cwt_cases: visitData.cwt_cases || 0,
      performance_level: visitData.performance_level || null,
      new_employees_total: visitData.new_employees_total || 0,
      new_employees_covered: visitData.new_employees_covered || 0,
      star_employees_total: visitData.star_employees_total || 0,
      star_employees_covered: visitData.star_employees_covered || 0,
      feedback: visitData.feedback || null,
      status: visitData.status || 'submitted',
      best_practices: visitData.best_practices || null,
      leaders_aligned_with_code: visitData.leaders_aligned_with_code || null,
      employees_feel_safe: visitData.employees_feel_safe || null,
      employees_feel_motivated: visitData.employees_feel_motivated || null,
      leaders_abusive_language: visitData.leaders_abusive_language || null,
      employees_comfort_escalation: visitData.employees_comfort_escalation || null,
      inclusive_culture: visitData.inclusive_culture || null
    };

    const { data, error } = await supabase
      .from('branch_visits')
      .insert([formattedData])
      .select()
      .single();
    
    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }
    
    return {
      success: true,
      data,
      error: null
    };
  } catch (error: any) {
    console.error("Error creating branch visit:", error);
    toast({
      variant: "destructive",
      title: "Error creating visit",
      description: error.message || "Unable to create branch visit"
    });
    return {
      success: false,
      data: null,
      error
    };
  }
};

// Get branch visit stats for BH Dashboard
export const getBranchVisitStats = async (userId: string): Promise<{
  assignedBranches: number;
  branchesVisited: number;
  submittedVisits: number;
  approvedVisits: number;
  totalVisits: number;
  completionRate: number;
}> => {
  try {
    // First get user's role
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
      
    if (userError) {
      throw userError;
    }
    
    // Get assigned branches
    const { data: assignments, error: assignmentError } = await supabase
      .from('branch_assignments')
      .select('*, branches!branch_assignments_branch_id_fkey(*)')
      .eq('user_id', userId);
      
    if (assignmentError) {
      throw assignmentError;
    }
    
    const assignedBranches = assignments?.length || 0;
    
    if (assignedBranches === 0) {
      return {
        assignedBranches: 0,
        branchesVisited: 0,
        submittedVisits: 0,
        approvedVisits: 0,
        totalVisits: 0,
        completionRate: 0
      };
    }
    
    // Get branch visits for this month
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const { data: visits, error: visitsError } = await supabase
      .from('branch_visits')
      .select('branch_id, status')
      .eq('user_id', userId)
      .gte('visit_date', firstDayOfMonth.toISOString())
      .lte('visit_date', today.toISOString());
      
    if (visitsError) {
      throw visitsError;
    }
    
    // Calculate metrics
    const allVisits = visits || [];
    const submittedVisits = allVisits.filter(v => v.status === 'submitted').length;
    const approvedVisits = allVisits.filter(v => v.status === 'approved').length;
    const totalVisits = submittedVisits + approvedVisits;
    const branchesVisited = new Set(allVisits.filter(v => v.status === 'submitted' || v.status === 'approved').map(v => v.branch_id)).size;
    const completionRate = assignedBranches > 0 ? Math.round((branchesVisited / assignedBranches) * 100) : 0;
    
    return {
      assignedBranches,
      branchesVisited,
      submittedVisits,
      approvedVisits,
      totalVisits,
      completionRate
    };
  } catch (error: any) {
    console.error("Error getting branch visit stats:", error);
    toast({
      variant: "destructive",
      title: "Error loading stats",
      description: error.message || "Unable to load branch visit statistics"
    });
    return {
      assignedBranches: 0,
      branchesVisited: 0,
      submittedVisits: 0,
      approvedVisits: 0,
      totalVisits: 0,
      completionRate: 0
    };
  }
};

// Get visit metrics for a specific BH user
export const getBHVisitMetrics = async (userId: string): Promise<{
  hrConnectSessions: { completed: number, total: number };
  avgParticipation: number;
  employeeCoverage: number;
  newEmployeeCoverage: number;
}> => {
  try {
    // Get visits for this month
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const { data: visits, error: visitsError } = await supabase
      .from('branch_visits')
      .select(`
        id,
        hr_connect_session,
        total_employees_invited,
        total_participants,
        new_employees_covered,
        new_employees_total,
        branches!branch_visits_branch_id_fkey(*)
      `)
      .eq('user_id', userId)
      .in('status', ['submitted', 'approved'])
      .gte('visit_date', firstDayOfMonth.toISOString())
      .lte('visit_date', today.toISOString()) as { data: BranchVisit[] | null, error: any };
      
    if (visitsError) {
      throw visitsError;
    }
    
    if (!visits || visits.length === 0) {
      return {
        hrConnectSessions: { completed: 0, total: 0 },
        avgParticipation: 0,
        employeeCoverage: 0,
        newEmployeeCoverage: 0
      };
    }
    
    // Calculate metrics
    const hrConnectSessions = {
      completed: visits.filter(v => v.hr_connect_session).length,
      total: visits.length
    };
    
    // Calculate participation rate and coverage
    const validVisits = visits.filter(visit => 
      visit.total_participants && 
      visit.total_participants > 0 && 
      visit.total_employees_invited && 
      visit.total_employees_invited > 0
    );

    const participationRate = validVisits.reduce((total, visit) => {
      return total + ((visit.total_participants || 0) / (visit.total_employees_invited || 1)) * 100;
    }, 0);

    // Calculate new employee coverage
    const validNewEmployeeVisits = visits.filter(visit => 
      visit.new_employees_covered && 
      visit.new_employees_covered > 0 && 
      visit.new_employees_total && 
      visit.new_employees_total > 0
    );

    const newEmployeeCoverage = validNewEmployeeVisits.reduce((total, visit) => {
      return total + ((visit.new_employees_covered || 0) / (visit.new_employees_total || 1)) * 100;
    }, 0);

    return {
      hrConnectSessions,
      avgParticipation: validVisits.length > 0 ? Math.round(participationRate / validVisits.length) : 0,
      employeeCoverage: validVisits.length > 0 ? Math.round(participationRate / validVisits.length) : 0,
      newEmployeeCoverage: validNewEmployeeVisits.length > 0 ? Math.round(newEmployeeCoverage / validNewEmployeeVisits.length) : 0
    };
  } catch (error: any) {
    console.error("Error getting BH visit metrics:", error);
    toast({
      variant: "destructive",
      title: "Error loading metrics",
      description: error.message || "Unable to load visit metrics"
    });
    return {
      hrConnectSessions: { completed: 0, total: 0 },
      avgParticipation: 0,
      employeeCoverage: 0,
      newEmployeeCoverage: 0
    };
  }
};

// Get coverage by branch category for BH Dashboard
export const getBranchCategoryCoverage = async (userId: string): Promise<{ category: string, completion: number, color: string }[]> => {
  try {
    // Get all visits for this month
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const { data: visits, error: visitsError } = await supabase
      .from('branch_visits')
      .select('branch_id, branches!branch_visits_branch_id_fkey(category)')
      .eq('user_id', userId)
      .in('status', ['submitted', 'approved'])
      .gte('visit_date', firstDayOfMonth.toISOString())
      .lte('visit_date', today.toISOString());
      
    if (visitsError) {
      throw visitsError;
    }
    
    if (!visits || visits.length === 0) {
      return [];
    }
    
    // Count visits by category
    const categoryCounts: Record<string, number> = {};
    let totalVisits = 0;
    
    visits.forEach(visit => {
      let category = 'unknown';
      const branches: any = visit.branches;
      if (branches) {
        if (Array.isArray(branches)) {
          category = branches[0]?.category?.toLowerCase() || 'unknown';
        } else {
          category = branches.category?.toLowerCase() || 'unknown';
        }
      }
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      totalVisits++;
    });
    
    // Calculate percentage for each category
    const coverage = Object.entries(categoryCounts).map(([category, count]) => {
      const percentage = Math.round((count / totalVisits) * 100);
      
      return {
        category: category.charAt(0).toUpperCase() + category.slice(1),
        completion: percentage,
        color: getCategoryColor(category)
      };
    });
    
    return coverage.sort((a, b) => b.completion - a.completion);
  } catch (error: any) {
    console.error("Error getting category coverage:", error);
    toast({
      variant: "destructive",
      title: "Error loading coverage data",
      description: error.message || "Unable to load category coverage data"
    });
    return [];
  }
};

// Get coverage and participation data for Coverage & Participation Trends chart
export const getCoverageParticipationTrends = async (timeRange = 'lastSixMonths'): Promise<{
  month: string;
  branchCoverage: number;
  participationRate: number;
}[]> => {
  console.info("Fetching coverage and participation trends...");
  
  try {
    // Get date range based on timeRange
    let endDate = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case 'lastMonth':
        startDate = new Date(endDate);
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'lastQuarter':
        startDate = new Date(endDate);
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'lastSixMonths':
      default:
        startDate = new Date(endDate);
        startDate.setMonth(startDate.getMonth() - 6);
    }
    
    // Get time periods for the chart
    const periods = getTimePeriods(timeRange, startDate, endDate);
    
    // Get all visits within the date range
    const { data: visits, error: visitsError } = await supabase
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
      
    if (visitsError) {
      throw visitsError;
    }
    
    // Get total number of branches for coverage calculation
    const { count: totalBranches, error: branchError } = await supabase
      .from('branches')
      .select('*', { count: 'exact' });
      
    if (branchError) {
      throw branchError;
    }
    
    // Calculate metrics for each period
    const trends = periods.map(period => {
      // Filter visits for this period
      const periodVisits = visits?.filter(visit => {
        const visitDate = new Date(visit.visit_date);
        return visitDate >= period.start && visitDate <= period.end;
      }) || [];
      
      // Calculate branch coverage
      const visitedBranches = new Set(periodVisits.map(v => v.branch_id));
      const branchCoverage = totalBranches ? Math.round((visitedBranches.size / totalBranches) * 100) : 0;
      
      // Calculate participation rate
      let totalParticipation = 0;
      let validVisits = 0;
      
      periodVisits.forEach(visit => {
        if (visit.total_participants && visit.total_employees_invited) {
          totalParticipation += (visit.total_participants / visit.total_employees_invited) * 100;
          validVisits++;
        }
      });
      
      const participationRate = validVisits ? Math.round(totalParticipation / validVisits) : 0;
      
      return {
        month: period.label,
        branchCoverage,
        participationRate
      };
    });
    
    return trends;
  } catch (error: any) {
    console.error("Error getting coverage and participation trends:", error);
    toast({
      variant: "destructive",
      title: "Error loading trends",
      description: error.message || "Unable to load coverage and participation trends"
    });
    return [];
  }
};

// Get visit metrics across branches for analytics
export const getVisitMetrics = async (dateRange?: { from: Date; to: Date } | undefined): Promise<{
  name: string;
  manning: number;
  attrition: number;
  er: number;
  nonVendor: number;
  cwt: number;
}[]> => {
  try {
    let query = supabase.from('branch_visits')
      .select(`
        id,
        branch_id,
        manning_percentage,
        attrition_percentage,
        er_percentage,
        non_vendor_percentage,
        cwt_cases,
        branches:branch_id (
          category
        )
      `);
    
    // Apply date filter if provided
    if (dateRange?.from && dateRange?.to) {
      query = query
        .gte('visit_date', dateRange.from.toISOString().split('T')[0])
        .lte('visit_date', dateRange.to.toISOString().split('T')[0]);
    }
    
    // Only include submitted or approved visits
    query = query.in('status', ['submitted', 'approved']);
    
    const { data, error } = await query as { data: BranchVisit[] | null, error: any };
    console.log('Raw visit metrics data:', data);
    
    if (error) {
      throw error;
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Group data by branch category
    const categoryData: Record<string, {
      count: number;
      manningSum: number;
      attritionSum: number;
      erSum: number;
      nonVendorSum: number;
      cwtSum: number;
    }> = {};
    
    data.forEach(visit => {
      const category = visit.branches?.category || 'unknown';
      
      if (!categoryData[category]) {
        categoryData[category] = {
          count: 0,
          manningSum: 0,
          attritionSum: 0,
          erSum: 0,
          nonVendorSum: 0,
          cwtSum: 0
        };
      }
      
      categoryData[category].count++;
      
      if (visit.manning_percentage !== null) {
        categoryData[category].manningSum += visit.manning_percentage;
      }
      
      if (visit.attrition_percentage !== null) {
        categoryData[category].attritionSum += visit.attrition_percentage;
      }
      
      if (visit.er_percentage !== null) {
        categoryData[category].erSum += visit.er_percentage;
      }
      
      if (visit.non_vendor_percentage !== null) {
        categoryData[category].nonVendorSum += visit.non_vendor_percentage;
      }
      
      if (visit.cwt_cases !== null) {
        categoryData[category].cwtSum += visit.cwt_cases;
      }
    });
    
    // Format the data for the charts
    const metrics = Object.entries(categoryData).map(([name, data]) => {
      return {
        name: name.charAt(0).toUpperCase() + name.slice(1),
        manning: Math.round(data.manningSum / data.count),
        attrition: Math.round(data.attritionSum / data.count),
        er: Math.round(data.erSum / data.count),
        nonVendor: Math.round(data.nonVendorSum / data.count),
        cwt: Math.round(data.cwtSum / data.count)
      };
    });
    
    console.info("Category metrics:", metrics);
    return metrics;
  } catch (error) {
    console.error("Error getting visit metrics:", error);
    return [];
  }
};

// Get performance trend data for Performance Trend chart
export const getPerformanceTrends = async (timeRange = 'lastSixMonths'): Promise<{
  month: string;
  manning: number;
  attrition: number;
  er: number;
  nonVendor: number;
}[]> => {
  console.log("Fetching performance trends for", timeRange);
  try {
    // Get date range based on timeRange
    let endDate = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case 'lastWeek':
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 6);
        break;
      case 'lastYear':
        startDate = new Date(endDate);
        startDate.setMonth(startDate.getMonth() - 11, 1); // First day of the month 11 months ago
        endDate = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0); // Last day of current month
        break;
      case 'lastMonth':
        startDate = new Date(endDate);
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'lastQuarter':
        startDate = new Date(endDate);
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'lastSixMonths':
      default:
        startDate = new Date(endDate);
        startDate.setMonth(startDate.getMonth() - 6);
    }
    
    // Use the helper function to get periods
    const periods = getTimePeriods(timeRange, startDate, endDate);
    
    // Get all visits within the date range
    const { data: visits, error: visitsError } = await supabase
      .from('branch_visits')
      .select(`
        visit_date,
        manning_percentage,
        attrition_percentage,
        er_percentage,
        non_vendor_percentage,
        cwt_cases
      `)
      .in('status', ['submitted', 'approved'])
      .gte('visit_date', startDate.toISOString())
      .lte('visit_date', endDate.toISOString()) as { data: BranchVisit[] | null, error: any };
      
    if (visitsError) {
      console.error('Error fetching performance trend visits:', visitsError);
      throw visitsError;
    }
    
    console.info('Raw performance trend visits:', JSON.stringify(visits, null, 2));
    
    if (!visits || visits.length === 0) {
      console.warn('No visits found for performance trends');
      return periods.map(period => ({
        month: period.label,
        manning: 0,
        attrition: 0,
        er: 0,
        nonVendor: 0
      }));
    }
    
    // Calculate metrics for each period
    const trends = periods.map(period => {
      const periodVisits = visits.filter(visit => {
        const visitDate = new Date(visit.visit_date);
        return visitDate >= period.start && visitDate <= period.end;
      });
      
      let manningSum = 0;
      let manningCount = 0;
      let attritionSum = 0;
      let attritionCount = 0;
      let erSum = 0;
      let erCount = 0;
      let nonVendorSum = 0;
      let nonVendorCount = 0;
      let cwtSum = 0;
      let cwtCount = 0;
      
      periodVisits.forEach(visit => {
        if (visit.manning_percentage !== null) {
          manningSum += visit.manning_percentage;
          manningCount++;
        }
        if (visit.attrition_percentage !== null) {
          attritionSum += visit.attrition_percentage;
          attritionCount++;
        }
        if (visit.er_percentage !== null) {
          erSum += visit.er_percentage;
          erCount++;
        }
        if (visit.non_vendor_percentage !== null) {
          nonVendorSum += visit.non_vendor_percentage;
          nonVendorCount++;
        }
        if (visit.cwt_cases !== null) {
          cwtSum += visit.cwt_cases;
          cwtCount++;
        }
      });
      return {
        month: period.label,
        manning: manningCount ? Math.round(manningSum / manningCount) : 0,
        attrition: attritionCount ? Math.round(attritionSum / attritionCount) : 0,
        er: erCount ? Math.round(erSum / erCount) : 0,
        nonVendor: nonVendorCount ? Math.round(nonVendorSum / nonVendorCount) : 0
      };
    });
    
    return trends;
  } catch (error: any) {
    console.error("Error getting performance trends:", error);
    toast({
      variant: "destructive",
      title: "Error loading trends",
      description: error.message || "Unable to load performance trends"
    });
    return [];
  }
};

// Helper function to generate time periods based on selected range
const getTimePeriods = (timeRange: string, startDate: Date, endDate: Date): { start: Date; end: Date; label: string }[] => {
  const periods: { start: Date; end: Date; label: string }[] = [];
  
  switch (timeRange) {
    case 'lastWeek': {
      for (let i = 6; i >= 0; i--) {
        let currentDate = new Date(endDate);
        currentDate.setDate(currentDate.getDate() - i);
        const dayStart = new Date(currentDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(currentDate);
        dayEnd.setHours(23, 59, 59, 999);
        periods.push({
          start: dayStart,
          end: dayEnd,
          label: dayStart.toLocaleDateString('en-US', { weekday: 'short' })
        });
      }
      break;
    }
    case 'lastYear': {
      // Generate 12 monthly periods from the same month last year up to this month
      let currentDate = new Date(endDate);
      currentDate.setMonth(currentDate.getMonth() - 11, 1); // Go back 11 months, set to 1st
      for (let i = 0; i < 12; i++) {
        const monthStart = new Date(currentDate);
        const monthEnd = new Date(currentDate);
        monthEnd.setMonth(currentDate.getMonth() + 1, 0); // Last day of current month
        const monthStr = monthStart.toLocaleDateString('en-US', { month: 'short' });
        periods.push({
          start: monthStart,
          end: monthEnd,
          label: monthStr
        });
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      break;
    }
    case 'lastMonth': {
      let currentDate = new Date(startDate);
      let weekNum = 1;
      while (currentDate < endDate) {
        const weekStart = new Date(currentDate);
        const weekEnd = new Date(currentDate);
        weekEnd.setDate(currentDate.getDate() + 6);
        if (weekEnd > endDate) {
          weekEnd.setTime(endDate.getTime());
        }
        periods.push({
          start: weekStart,
          end: weekEnd,
          label: `Week ${weekNum}`
        });
        currentDate.setDate(currentDate.getDate() + 7);
        weekNum++;
      }
      break;
    }
    case 'lastQuarter':
    case 'lastSixMonths':
    default: {
      let currentDate = new Date(startDate);
      currentDate.setDate(1); // Start from the 1st of the month
      while (currentDate < endDate) {
        const monthStart = new Date(currentDate);
        const monthEnd = new Date(currentDate);
        monthEnd.setMonth(currentDate.getMonth() + 1, 0); // Last day of current month
        const monthStr = monthStart.toLocaleDateString('en-US', { month: 'short' });
        periods.push({
          start: monthStart,
          end: monthEnd,
          label: monthStr
        });
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      break;
  }
  }
  return periods;
};

// Helper function to get category colors
const getCategoryColor = (category: string) => {
  const colors = {
    platinum: "bg-violet-100 text-violet-700 border-violet-300",
    diamond: "bg-blue-100 text-blue-700 border-blue-300",
    gold: "bg-amber-100 text-amber-700 border-amber-300",
    silver: "bg-slate-100 text-slate-700 border-slate-300",
    bronze: "bg-orange-100 text-orange-700 border-orange-300"
  };
  return colors[category.toLowerCase()] || "bg-slate-100 text-slate-700 border-slate-300";
};
