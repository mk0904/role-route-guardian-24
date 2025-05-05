import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

// Types for analytics data
interface DashboardStats {
  totalBranches: number;
  visitedBranchesCount: number;
  currentCoverage: number;
  uniqueBhrIds: number;
  currentManningAvg: number;
  currentAttritionAvg: number;
  currentErAvg: number;
  nonVendorAvg: number;
  cwTotalCases: number;
}

interface MonthlyTrend {
  month: string;
  branchCoverage: number;
  participationRate: number;
  manningPercentage: number;
  attritionRate: number;
  erPercentage: number;
  nonVendorPercentage: number;
}

interface BHRStats {
  id: string;
  name: string;
  code: string;
  visitCount: number;
  ratings: {
    leaders_aligned: number[];
    employees_safe: number[];
    employees_motivated: number[];
    no_abusive_language: number[];
    comfort_escalation: number[];
    inclusive_culture: number[];
  };
}

interface BranchMetrics {
  name: string;
  location: string;
  category: string;
  manning: number[];
  attrition: number[];
  er: number[];
  nonVendor: number[];
  cwt: number[];
  leadersAligned: number[];
  employeesSafe: number[];
  employeesMotivated: number[];
  noAbusiveLanguage: number[];
  comfortEscalation: number[];
  inclusiveCulture: number[];
}

interface TopPerformer {
  name: string;
  code: string;
  visitCount: number;
  overallScore: number;
}

interface CategoryCount {
  name: string;
  value: number;
}

interface BranchMetricsResult {
  name: string;
  location: string;
  category: string;
  manning: number;
  attrition: number;
  er: number;
}

interface QualitativeAssessment {
  discipline: number;
  hygiene: number;
  culture: number;
  overall: number;
  count: number;
  leadersAligned: number;
  employeesSafe: number;
  employeesMotivated: number;
  noAbusiveLanguage: number;
  comfortEscalation: number;
  inclusiveCulture: number;
}

interface ZoneMetrics {
  name: string;
  location: string;
  category: string;
  manning: number;
  attrition: number;
  er: number;
}

interface TimePeriod {
  start: Date;
  end: Date;
  label: string;
}

// Supabase response types
interface Profile {
  full_name: string;
  e_code: string;
}

interface Branch {
  id: string;
  name: string;
  branch_code: string | null;
  created_at: string;
  updated_at: string;
  location: string;
  category: string;
}

interface BranchVisit {
  id: string;
  user_id: string;
  branch_id: string;
  visit_date: string;
  branch_category: string;
  status: string;
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
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  branches?: Branch;
}

export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  console.log('Fetching dashboard stats');
  console.info("Fetching dashboard stats...");
  
  try {
    // Get total branches
    const { data: branches, error: branchError } = await supabase
      .from('branches')
      .select('id');
    
    if (branchError) throw branchError;
    const totalBranches = branches?.length || 0;
    console.info(`Total branches: ${totalBranches}`);
    
    // Get unique BHRs who submitted reports
    const { data: bhrs, error: bhrsError } = await supabase
      .from('branch_visits')
      .select('user_id', { count: 'exact', head: true })
      .in('status', ['submitted', 'approved']);
    
    if (bhrsError) throw bhrsError;
    
    // Get visited branches (unique branch_id in approved visits for current month)
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    const { data: visits, error: visitsError } = await supabase
      .from('branch_visits')
      .select(`
        id,
        branch_id,
        user_id,
        status,
        manning_percentage,
        attrition_percentage,
        er_percentage,
        non_vendor_percentage,
        cwt_cases
      `)
      .in('status', ['submitted', 'approved']);
    
    if (visitsError) {
      console.error('Error fetching visits:', visitsError);
      throw visitsError;
    }
    
    if (!visits) {
      console.error('No visits data returned');
      return {
        totalBranches: 0,
        visitedBranchesCount: 0,
        currentCoverage: 0,
        uniqueBhrIds: 0,
        currentManningAvg: 0,
        currentAttritionAvg: 0,
        currentErAvg: 0,
        nonVendorAvg: 0,
        cwTotalCases: 0
      };
    }
    
    console.info("All visits:", visits);
    console.info("Raw visits data:", JSON.stringify(visits, null, 2));
    
    // Calculate visited branches count (unique branches)
    const uniqueBranchIds = new Set(visits.map(visit => visit.branch_id));
    const visitedBranchesCount = uniqueBranchIds.size;
    console.info("Unique branch IDs:", Array.from(uniqueBranchIds));
    console.info("Visited branches count:", visitedBranchesCount);
    
    // Calculate unique BHR IDs
    const uniqueBhrIds = new Set(visits.filter(visit => visit.status === 'approved').map(visit => visit.user_id)).size;
    
    // Calculate metrics
    const currentCoverage = totalBranches > 0 ? Math.round((visitedBranchesCount / totalBranches) * 100) : 0;
    
    // Calculate averages of manning_percentage, attrition_percentage, and er_percentage
    let manningSum = 0;
    let attritionSum = 0;
    let erSum = 0;
    let nonVendorSum = 0;
    let cwTotalCases = 0;
    let count = 0;
    
    visits.forEach(visit => {
      // Manning percentage
      if (visit.manning_percentage !== null) {
        manningSum += visit.manning_percentage;
        count++;
      }
      
      // Attrition percentage
      if (visit.attrition_percentage !== null) {
        attritionSum += visit.attrition_percentage;
      }
      
      // ER percentage
      if (visit.er_percentage !== null) {
        erSum += visit.er_percentage;
      }
      
      // Non-vendor percentage
      if (visit.non_vendor_percentage !== null) {
        nonVendorSum += visit.non_vendor_percentage;
      }
      
      // CWT cases
      if (visit.cwt_cases !== null) {
        cwTotalCases += visit.cwt_cases;
      }
    });
    
    const currentManningAvg = count > 0 ? Math.round(manningSum / count) : 0;
    const currentAttritionAvg = count > 0 ? Math.round(attritionSum / count) : 0;
    const currentErAvg = count > 0 ? Math.round(erSum / count) : 0;
    const nonVendorAvg = count > 0 ? Math.round(nonVendorSum / count) : 0;
    
    console.info("Stats calculation complete");
    
    const stats: DashboardStats = {
      totalBranches,
      visitedBranchesCount,
      currentCoverage,
      uniqueBhrIds,
      currentManningAvg,
      currentAttritionAvg,
      currentErAvg,
      nonVendorAvg,
      cwTotalCases
    };
    
    console.info(stats);
    
    return stats;
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    toast({
      title: "Error fetching dashboard statistics",
      description: "Could not load dashboard data. Please try again.",
      variant: "destructive"
    });
    // Return some default values if the fetch fails
    return {
      totalBranches: 0,
      visitedBranchesCount: 0,
      currentCoverage: 0,
      uniqueBhrIds: 0,
      currentManningAvg: 0,
      currentAttritionAvg: 0,
      currentErAvg: 0,
      nonVendorAvg: 0,
      cwTotalCases: 0
    };
  }
};

export const fetchMonthlyTrends = async (timeRange = 'lastSixMonths'): Promise<MonthlyTrend[]> => {
  console.info("Fetching monthly trends...");
  
  try {
    // Determine the date range based on the timeRange parameter
    let startDate;
    const endDate = new Date();
    
    switch(timeRange) {
      case 'lastSevenDays':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'lastMonth':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'lastThreeMonths':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'lastSixMonths':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case 'lastYear':
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'lastThreeYears':
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 3);
        break;
      default:
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 6);
    }
    
    // Get all visits with their dates
    const { data: visits, error: visitsError } = await supabase
      .from('branch_visits')
      .select('branch_id, visit_date, total_employees_invited, total_participants, manning_percentage, attrition_percentage, er_percentage, non_vendor_percentage')
      .gte('visit_date', startDate.toISOString())
      .lte('visit_date', endDate.toISOString());
    
    if (visitsError) throw visitsError;
    console.info("Found", visits.length, "visits for monthly trends");
    
    // Get total branch count for percentage calculation
    const { data: branches, error: branchesError } = await supabase
      .from('branches')
      .select('id');
    
    if (branchesError) throw branchesError;
    const totalBranches = branches?.length || 0;
    console.info("Total branches for monthly trends:", totalBranches);
    
    // Get the appropriate time periods based on timeRange
    const timePeriods = getTimePeriods(timeRange, startDate, endDate);
    
    // Process data by time period
    const trendsData = timePeriods.map(period => {
      // Filter visits for this time period
      const periodVisits = visits.filter(visit => {
        const visitDate = new Date(visit.visit_date);
        return visitDate >= period.start && visitDate <= period.end;
      });
      
      // Get unique branches visited this period
      const branchesVisitedThisPeriod = new Set(periodVisits.map(visit => visit.branch_id));
      const branchCoverage = totalBranches > 0 ? 
        Math.round((branchesVisitedThisPeriod.size / totalBranches) * 100) : 0;
      
      // Calculate employee participation rate
      let totalEmployeesInvited = 0;
      let totalParticipants = 0;
      
      // Calculate metric averages
      let manningSum = 0;
      let attritionSum = 0;
      let erSum = 0;
      let nonVendorSum = 0;
      let count = periodVisits.length || 1;
      
      periodVisits.forEach(visit => {
        // Participation metrics
        if (visit.total_employees_invited) totalEmployeesInvited += visit.total_employees_invited;
        if (visit.total_participants) totalParticipants += visit.total_participants;
        
        // HR metrics
        if (visit.manning_percentage) manningSum += visit.manning_percentage;
        if (visit.attrition_percentage) attritionSum += visit.attrition_percentage;
        if (visit.er_percentage) erSum += visit.er_percentage;
        if (visit.non_vendor_percentage) nonVendorSum += visit.non_vendor_percentage;
      });
      
      const participationRate = totalEmployeesInvited > 0 ? 
        Math.round((totalParticipants / totalEmployeesInvited) * 100) : 0;
      
      return {
        month: period.label,
        branchCoverage,
        participationRate,
        manningPercentage: Math.round(manningSum / count),
        attritionRate: Math.round(attritionSum / count),
        erPercentage: Math.round(erSum / count),
        nonVendorPercentage: Math.round(nonVendorSum / count)
      };
    });
    
    console.info("Monthly data processed:", trendsData);
    return trendsData;
  } catch (error) {
    console.error("Error fetching monthly trends:", error);
    toast({
      title: "Error fetching trend data",
      description: "Could not load trend data. Please try again.",
      variant: "destructive"
    });
    
    // Return empty data as fallback
    return [];
  }
};

function getTimePeriods(timeRange: string, startDate: Date, endDate: Date): TimePeriod[] {
  const periods: TimePeriod[] = [];
  let currentDate;
  
  switch(timeRange) {
    case 'lastSevenDays':
      // Create daily periods
      for (let i = 6; i >= 0; i--) {
        currentDate = new Date(endDate);
        currentDate.setDate(currentDate.getDate() - i);
        const dayStart = new Date(currentDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(currentDate);
        dayEnd.setHours(23, 59, 59, 999);
        
        periods.push({
          start: dayStart,
          end: dayEnd,
          label: currentDate.toLocaleDateString('en-US', { weekday: 'short' })
        });
      }
      break;
      
    case 'lastMonth':
      // Split into weeks
      currentDate = new Date(startDate);
      while (currentDate < endDate) {
        const weekStart = new Date(currentDate);
        const weekEnd = new Date(currentDate);
        weekEnd.setDate(weekEnd.getDate() + 6);
        if (weekEnd > endDate) weekEnd.setTime(endDate.getTime());
        
        periods.push({
          start: weekStart,
          end: weekEnd,
          label: `Week ${periods.length + 1}`
        });
        
        currentDate.setDate(currentDate.getDate() + 7);
      }
      break;
      
    case 'lastThreeMonths':
    case 'lastSixMonths':
    case 'lastYear':
      // Monthly periods
      currentDate = new Date(startDate);
      currentDate.setDate(1);
      
      while (currentDate < endDate) {
        const monthStart = new Date(currentDate);
        const monthEnd = new Date(currentDate);
        monthEnd.setMonth(monthEnd.getMonth() + 1, 0); // Last day of current month
        
        periods.push({
          start: monthStart,
          end: monthEnd,
          label: monthStart.toLocaleDateString('en-US', { month: 'short' })
        });
        
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      break;
      
    case 'lastThreeYears':
      // Quarterly periods
      currentDate = new Date(startDate);
      const quarterMonth = Math.floor(currentDate.getMonth() / 3) * 3;
      currentDate.setMonth(quarterMonth, 1);
      
      while (currentDate < endDate) {
        const quarterStart = new Date(currentDate);
        const quarterEnd = new Date(currentDate);
        quarterEnd.setMonth(quarterStart.getMonth() + 3, 0);
        
        const year = quarterStart.getFullYear();
        const quarter = Math.floor(quarterStart.getMonth() / 3) + 1;
        
        periods.push({
          start: quarterStart,
          end: quarterEnd,
          label: `Q${quarter} ${year}`
        });
        
        currentDate.setMonth(currentDate.getMonth() + 3);
      }
      break;
      
    default:
      // Default to monthly for last six months
      currentDate = new Date(startDate);
      currentDate.setDate(1);
      
      while (currentDate < endDate) {
        const monthStart = new Date(currentDate);
        const monthEnd = new Date(currentDate);
        monthEnd.setMonth(monthEnd.getMonth() + 1, 0); // Last day of current month
        
        periods.push({
          start: monthStart,
          end: monthEnd,
          label: monthStart.toLocaleDateString('en-US', { month: 'long' })
        });
        
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
  }
  
  return periods;
}

export const fetchTopPerformers = async (): Promise<TopPerformer[]> => {
  try {
    // Get BHRs with their visit counts and ratings
    const { data: visits, error: visitsError } = await supabase
      .from('branch_visits')
      .select(`
        id,
        user_id,
        status,
        leaders_aligned_with_code,
        employees_feel_safe,
        employees_feel_motivated,
        leaders_abusive_language,
        employees_comfort_escalation,
        inclusive_culture,
        profiles:user_id (
          full_name,
          e_code
        )
      `)
      .in('status', ['submitted', 'approved']) as { data: BranchVisit[] | null, error: any };
    
    if (visitsError) throw visitsError;
    if (!visits || visits.length === 0) return [];
    
    // Group visits by BHR
    const bhrStats: Record<string, BHRStats> = {};
    
    visits.forEach(visit => {
      const bhrId = visit.user_id;
      if (!bhrStats[bhrId]) {
        bhrStats[bhrId] = {
          id: bhrId,
          name: visit.profiles?.full_name || 'N/A',
          code: visit.profiles?.e_code || 'N/A',
          visitCount: 0,
          ratings: {
            leaders_aligned: [],
            employees_safe: [],
            employees_motivated: [],
            no_abusive_language: [],
            comfort_escalation: [],
            inclusive_culture: [],
          }
        };
      }
      
      bhrStats[bhrId].visitCount++;
      
      // Add ratings if they exist
      if (visit.leaders_aligned_with_code) {
        bhrStats[bhrId].ratings.leaders_aligned.push(getRatingValue(visit.leaders_aligned_with_code));
      }
      if (visit.employees_feel_safe) {
        bhrStats[bhrId].ratings.employees_safe.push(getRatingValue(visit.employees_feel_safe));
      }
      if (visit.employees_feel_motivated) {
        bhrStats[bhrId].ratings.employees_motivated.push(getRatingValue(visit.employees_feel_motivated));
      }
      if (visit.leaders_abusive_language) {
        bhrStats[bhrId].ratings.no_abusive_language.push(getRatingValue(visit.leaders_abusive_language));
      }
      if (visit.employees_comfort_escalation) {
        bhrStats[bhrId].ratings.comfort_escalation.push(getRatingValue(visit.employees_comfort_escalation));
      }
      if (visit.inclusive_culture) {
        bhrStats[bhrId].ratings.inclusive_culture.push(getRatingValue(visit.inclusive_culture));
      }
    });
    
    // Calculate average ratings and overall score for each BHR
    const performers = Object.values(bhrStats).map(bhr => {
      const getAverage = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
      
      const avgLeadersAligned = getAverage(bhr.ratings.leaders_aligned);
      const avgEmployeesSafe = getAverage(bhr.ratings.employees_safe);
      const avgEmployeesMotivated = getAverage(bhr.ratings.employees_motivated);
      const avgNoAbusiveLanguage = getAverage(bhr.ratings.no_abusive_language);
      const avgComfortEscalation = getAverage(bhr.ratings.comfort_escalation);
      const avgInclusiveCulture = getAverage(bhr.ratings.inclusive_culture);
      
      // Calculate overall score (average of all ratings)
      const overallScore = (
        avgLeadersAligned +
        avgEmployeesSafe +
        avgEmployeesMotivated +
        avgNoAbusiveLanguage +
        avgComfortEscalation +
        avgInclusiveCulture
      ) / 6;
      
      return {
        name: bhr.name,
        code: bhr.code,
        visitCount: bhr.visitCount,
        overallScore: Math.round(overallScore * 100) / 100
      };
    });
    
    // Sort by overall score (descending) and return top performers
    return performers.sort((a, b) => b.overallScore - a.overallScore);
  } catch (error) {
    console.error("Error fetching top performers:", error);
    toast({
      title: "Error fetching performers data",
      description: "Could not load top performers. Please try again.",
      variant: "destructive"
    });
    return [];
  }
};

export const fetchCategoryBreakdown = async (): Promise<CategoryCount[]> => {
  try {
    // Get all branch visits with branch information
    const { data: visits, error: visitsError } = await supabase
      .from('branch_visits')
      .select('branch_id, branches:branch_id (category)')
      .in('status', ['submitted', 'approved']);

    if (visitsError) throw visitsError;
    if (!visits || visits.length === 0) return [];

    // Count unique branch_ids per sanitized category
    const categoryBranchSet: Record<string, Set<string>> = {};
    visits.forEach(visit => {
      const raw = visit.branches?.category ? visit.branches.category.trim().toLowerCase() : 'unknown';
      const displayCategory = raw.charAt(0).toUpperCase() + raw.slice(1);
      if (!categoryBranchSet[displayCategory]) categoryBranchSet[displayCategory] = new Set();
      categoryBranchSet[displayCategory].add(visit.branch_id);
    });

    // Format the results
    return Object.entries(categoryBranchSet).map(([name, set]) => ({
      name,
      value: set.size
    }));
  } catch (error) {
    console.error("Error fetching category breakdown:", error);
    toast({
      title: "Error loading category data",
      description: "Could not load branch categories. Please try again.",
      variant: "destructive"
    });
    return [];
  }
};

export const fetchZoneMetrics = async (): Promise<BranchMetricsResult[]> => {
  try {
    // Get all branch visits with branch information
    const { data: visits, error: visitsError } = await supabase
      .from('branch_visits')
      .select(`
        id,
        branch_id,
        status,
        manning_percentage,
        attrition_percentage,
        er_percentage,
        non_vendor_percentage,
        cwt_cases,
        leaders_aligned_with_code,
        employees_feel_safe,
        employees_feel_motivated,
        leaders_abusive_language,
        employees_comfort_escalation,
        inclusive_culture,
        branches:branch_id (
          name,
          location,
          category
        )
      `)
      .in('status', ['submitted', 'approved']) as { data: BranchVisit[] | null, error: any };
    
    if (visitsError) throw visitsError;
    if (!visits || visits.length === 0) return [];
    
    // Group visits by branch
    const branchMetrics: Record<string, BranchMetrics> = {};
    
    visits.forEach(visit => {
      const branchId = visit.branch_id;
      if (!branchMetrics[branchId]) {
        branchMetrics[branchId] = {
          name: visit.branches?.name || 'N/A',
          location: visit.branches?.location || 'N/A',
          category: visit.branches?.category || 'bronze',
          manning: [],
          attrition: [],
          er: [],
          nonVendor: [],
          cwt: [],
          leadersAligned: [],
          employeesSafe: [],
          employeesMotivated: [],
          noAbusiveLanguage: [],
          comfortEscalation: [],
          inclusiveCulture: []
        };
      }
      
      // Add metrics if they exist
      if (visit.manning_percentage !== null) branchMetrics[branchId].manning.push(visit.manning_percentage);
      if (visit.attrition_percentage !== null) branchMetrics[branchId].attrition.push(visit.attrition_percentage);
      if (visit.er_percentage !== null) branchMetrics[branchId].er.push(visit.er_percentage);
      if (visit.non_vendor_percentage !== null) branchMetrics[branchId].nonVendor.push(visit.non_vendor_percentage);
      if (visit.cwt_cases !== null) branchMetrics[branchId].cwt.push(visit.cwt_cases);
      if (visit.leaders_aligned_with_code) branchMetrics[branchId].leadersAligned.push(getRatingValue(visit.leaders_aligned_with_code));
      if (visit.employees_feel_safe) branchMetrics[branchId].employeesSafe.push(getRatingValue(visit.employees_feel_safe));
      if (visit.employees_feel_motivated) branchMetrics[branchId].employeesMotivated.push(getRatingValue(visit.employees_feel_motivated));
      if (visit.leaders_abusive_language) branchMetrics[branchId].noAbusiveLanguage.push(getRatingValue(visit.leaders_abusive_language));
      if (visit.employees_comfort_escalation) branchMetrics[branchId].comfortEscalation.push(getRatingValue(visit.employees_comfort_escalation));
      if (visit.inclusive_culture) branchMetrics[branchId].inclusiveCulture.push(getRatingValue(visit.inclusive_culture));
    });
    
    // Calculate average metrics for each branch
    const metrics = Object.values(branchMetrics).map(branch => {
      const getAverage = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
      
      return {
        name: branch.name,
        location: branch.location,
        category: branch.category,
        manning: getAverage(branch.manning),
        attrition: getAverage(branch.attrition),
        er: getAverage(branch.er),
        nonVendor: getAverage(branch.nonVendor),
        cwt: getAverage(branch.cwt),
        leadersAligned: getAverage(branch.leadersAligned),
        employeesSafe: getAverage(branch.employeesSafe),
        employeesMotivated: getAverage(branch.employeesMotivated),
        noAbusiveLanguage: getAverage(branch.noAbusiveLanguage),
        comfortEscalation: getAverage(branch.comfortEscalation),
        inclusiveCulture: getAverage(branch.inclusiveCulture)
      };
    });
    
    return metrics;
  } catch (error) {
    console.error("Error fetching zone metrics:", error);
    toast({
      title: "Error loading metrics",
      description: "Could not load zone metrics. Please try again.",
      variant: "destructive"
    });
    return [];
  }
};

export const fetchQualitativeAssessments = async (dateRange?: { from: Date; to: Date } | undefined): Promise<QualitativeAssessment> => {
  console.log('Fetching qualitative assessments with date range:', dateRange);
  try {
    // Get qualitative assessments from branch visits
    let query = supabase
      .from('branch_visits')
      .select(`
        leaders_aligned_with_code,
        employees_feel_safe,
        employees_feel_motivated,
        leaders_abusive_language,
        employees_comfort_escalation,
        inclusive_culture
      `)
      .in('status', ['submitted', 'approved'])
      .not('leaders_aligned_with_code', 'is', null) as any;
      
    // Apply date filter if provided
    if (dateRange && dateRange.from && dateRange.to) {
      query = query.gte('visit_date', dateRange.from.toISOString())
                   .lte('visit_date', dateRange.to.toISOString());
    }
    
    const { data: items, error } = await query as { data: BranchVisit[] | null, error: any };
    console.log('Raw qualitative data:', items);
      
    if (error) throw error;
    
    if (!items || items.length === 0) {
      return {
        leadersAligned: 0,
        employeesSafe: 0,
        employeesMotivated: 0,
        noAbusiveLanguage: 0,
        comfortEscalation: 0,
        inclusiveCulture: 0,
        overall: 0,
        count: 0,
        discipline: 0,
        hygiene: 0,
        culture: 0
      };
    }
    
    // Calculate the count of valid records
    const count = items.length;
    
    // Calculate averages based on the rating values
    let leadersAlignedSum = 0;
    let employeesSafeSum = 0;
    let employeesMotivatedSum = 0;
    let noAbusiveLanguageSum = 0;
    let comfortEscalationSum = 0;
    let inclusiveCultureSum = 0;
    
    items.forEach(item => {
      // Boolean fields (yes/no)
      leadersAlignedSum += getRatingValue(item.leaders_aligned_with_code, true);
      employeesSafeSum += getRatingValue(item.employees_feel_safe, true);
      employeesMotivatedSum += getRatingValue(item.employees_feel_motivated, true);
      noAbusiveLanguageSum += getRatingValue(item.leaders_abusive_language, true);
      comfortEscalationSum += getRatingValue(item.employees_comfort_escalation, true);
      inclusiveCultureSum += getRatingValue(item.inclusive_culture, true);
    });
    
    // Calculate average ratings
    const leadersAligned = count > 0 ? leadersAlignedSum / count : 0;
    const employeesSafe = count > 0 ? employeesSafeSum / count : 0;
    const employeesMotivated = count > 0 ? employeesMotivatedSum / count : 0;
    const noAbusiveLanguage = count > 0 ? noAbusiveLanguageSum / count : 0;
    const comfortEscalation = count > 0 ? comfortEscalationSum / count : 0;
    const inclusiveCulture = count > 0 ? inclusiveCultureSum / count : 0;
    
    // Overall average of all ratings
    const overall = (
      leadersAligned + 
      employeesSafe + 
      employeesMotivated + 
      noAbusiveLanguage + 
      comfortEscalation + 
      inclusiveCulture
    ) / 6;
    
    return {
      leadersAligned,
      employeesSafe,
      employeesMotivated,
      noAbusiveLanguage,
      comfortEscalation,
      inclusiveCulture,
      overall,
      count,
      discipline: 0,
      hygiene: 0,
      culture: 0
    };
  } catch (error) {
    console.error("Error fetching qualitative assessments:", error);
    return {
      leadersAligned: 0,
      employeesSafe: 0,
      employeesMotivated: 0,
      noAbusiveLanguage: 0,
      comfortEscalation: 0,
      inclusiveCulture: 0,
      overall: 0,
      count: 0,
      discipline: 0,
      hygiene: 0,
      culture: 0
    };
  }
};

const getRatingValue = (rating: string | null, isBoolean: boolean = false): number => {
  if (!rating) return 0;
  
  if (isBoolean) {
    return rating.toLowerCase() === 'yes' ? 5 : 0;
  }
  
  switch (rating.toLowerCase()) {
    case 'excellent':
      return 5;
    case 'good':
      return 4;
    case 'neutral':
      return 3;
    case 'poor':
      return 2;
    case 'very_poor':
      return 1;
    default:
      return 0;
  }
}
