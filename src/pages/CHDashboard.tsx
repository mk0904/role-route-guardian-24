import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { BarList } from "@/components/ui/bar-list";
import { fetchDashboardStats, fetchTopPerformers, fetchCategoryBreakdown, fetchQualitativeAssessments } from "@/services/analyticsService";
import { getCoverageParticipationTrends } from "@/services/branchService";
import { CircleCheck, Users, PieChart as PieChartIcon, Star, Briefcase, CheckCircle2, TrendingUp, Clock, BarChart2 } from "lucide-react";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

// Define category color codes used throughout the app
const CATEGORY_COLORS: Record<string, string> = {
  platinum: '#9333ea', // purple
  diamond: '#2563eb',  // blue
  gold: '#eab308',     // gold
  silver: '#94a3b8',   // silver
  bronze: '#f97316',   // orange/bronze
  unknown: '#cbd5e1',  // gray
};

// Define darker category gradients for the pie chart
const CATEGORY_GRADIENTS = [
  { id: 'platinum-gradient', from: '#a78bfa', to: '#6d28d9' }, // mid to deep purple
  { id: 'diamond-gradient', from: '#60a5fa', to: '#1e3a8a' },  // mid to deep blue
  { id: 'gold-gradient', from: '#facc15', to: '#b45309' },     // mid to deep gold
  { id: 'silver-gradient', from: '#cbd5e1', to: '#334155' },   // mid to deep slate
  { id: 'bronze-gradient', from: '#fdba74', to: '#b45309' },   // mid to deep bronze
  { id: 'unknown-gradient', from: '#cbd5e1', to: '#64748b' },  // mid to deep gray
];
const CATEGORY_GRADIENT_MAP: Record<string, string> = {
  platinum: 'platinum-gradient',
  diamond: 'diamond-gradient',
  gold: 'gold-gradient',
  silver: 'silver-gradient',
  bronze: 'bronze-gradient',
  unknown: 'unknown-gradient',
};

const CHDashboard = () => {
  const [stats, setStats] = useState({
    totalBranches: 0,
    visitedBranchesCount: 0,
    currentCoverage: 0,
    uniqueBhrIds: 0,
    currentManningAvg: 0,
    currentAttritionAvg: 0,
    currentErAvg: 0,
    nonVendorAvg: 0,
    cwTotalCases: 0
  });
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [qualitativeData, setQualitativeData] = useState({
    discipline: 0,
    hygiene: 0,
    culture: 0,
    overall: 0,
    count: 0,
    leadersAligned: 0,
    employeesSafe: 0,
    employeesMotivated: 0,
    noAbusiveLanguage: 0,
    comfortEscalation: 0,
    inclusiveCulture: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isTrendsLoading, setIsTrendsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      console.info("Fetching dashboard stats...");
      setIsLoading(true);
      
      try {
        // Fetch dashboard summary stats
        const dashboardStats = await fetchDashboardStats();
        setStats(dashboardStats);
        
        // Fetch category breakdown (real data from database)
        console.info("Fetching category breakdown...");
        const breakdown = await fetchCategoryBreakdown();
        setCategoryBreakdown(breakdown);
        
        // Fetch top performers
        console.info("Fetching top performers...");
        const performers = await fetchTopPerformers();
        setTopPerformers(performers);
        
        // Fetch qualitative assessment data
        console.info("Fetching qualitative assessments...");
        const qualitativeStats = await fetchQualitativeAssessments();
        setQualitativeData(qualitativeStats);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const loadTrendsData = async () => {
      setIsTrendsLoading(true);
      try {
        console.info("Fetching monthly trends from database...");
        const trendsData = await getCoverageParticipationTrends('lastSixMonths');
        setMonthlyTrends(trendsData);
      } catch (error) {
        console.error("Error loading trends data:", error);
      } finally {
        setIsTrendsLoading(false);
      }
    };

    loadDashboardData();
    loadTrendsData();
  }, []);

  // Format rating text for display
  const formatRatingText = (rating) => {
    const ratingMap = {
      'very_poor': 'Very Poor',
      'poor': 'Poor',
      'neutral': 'Neutral',
      'good': 'Good',
      'excellent': 'Excellent'
    };
    return ratingMap[rating] || rating;
  };

  // Map ratings to numbers for the radar chart
  const mapRatingToNumber = (rating) => {
    const ratingValues = {
      'very_poor': 1,
      'poor': 2,
      'neutral': 3,
      'good': 4,
      'excellent': 5
    };
    return ratingValues[rating] || 3;
  };

  // Prepare qualitative data for radar visualization (same as CHAnalytics)
  const prepareQualitativeData = () => {
    return [
      { subject: 'Leaders Code Aligned', value: (qualitativeData.leadersAligned / 5) * 100, type: 'percentage' },
      { subject: 'Employee Safety', value: (qualitativeData.employeesSafe / 5) * 100, type: 'percentage' },
      { subject: 'Employee Motivation', value: (qualitativeData.employeesMotivated / 5) * 100, type: 'percentage' },
      { subject: 'No Abusive Language', value: (qualitativeData.noAbusiveLanguage / 5) * 100, type: 'percentage' },
      { subject: 'Comfort Escalation', value: (qualitativeData.comfortEscalation / 5) * 100, type: 'percentage' },
      { subject: 'Inclusive Culture', value: (qualitativeData.inclusiveCulture / 5) * 100, type: 'percentage' }
    ];
  };

  // Fixed tooltip formatter function to handle different value types
  const formatTooltipValue = (value) => {
    if (typeof value === 'number') {
      return value.toFixed(1);
    }
    return value;
  };

  // Map topPerformers to include coverage (as percentage) and reports fields for BarList
  const mappedPerformers = topPerformers.map(p => ({
    ...p,
    coverage: Math.round((p.overallScore || 0) * 20), // Convert 0-5 to 0-100%
    reports: p.visitCount
  }));

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Channel Head Dashboard</h1>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 text-blue-900">
          <CardContent className="p-6 flex items-center gap-4">
            <BarChart2 className="h-10 w-10 text-blue-500" />
            <div className="flex flex-col gap-1 flex-1">
              <p className="text-sm font-medium opacity-80">Branch Coverage</p>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold">{stats.currentCoverage}%</p>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium ml-2">this month</span>
              </div>
              <p className="text-sm text-blue-700 mt-1">{stats.visitedBranchesCount} of {stats.totalBranches}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 text-green-900">
          <CardContent className="p-6 flex items-center gap-4">
            <Users className="h-10 w-10 text-green-500" />
            <div className="flex flex-col gap-1 flex-1">
              <p className="text-sm font-medium opacity-80">Active BHRs</p>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold">{stats.uniqueBhrIds}</p>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium ml-2">this month</span>
              </div>
              <p className="text-sm text-green-700 mt-1">Submitting reports</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 text-amber-900">
          <CardContent className="p-6 flex items-center gap-4">
            <TrendingUp className="h-10 w-10 text-amber-500" />
            <div className="flex flex-col gap-1 flex-1">
              <p className="text-sm font-medium opacity-80">Avg Manning</p>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold">{stats.currentManningAvg}%</p>
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium ml-2">this month</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 text-red-900">
          <CardContent className="p-6 flex items-center gap-4">
            <Briefcase className="h-10 w-10 text-red-500" />
            <div className="flex flex-col gap-1 flex-1">
              <p className="text-sm font-medium opacity-80">Avg Attrition</p>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold">{stats.currentAttritionAvg}%</p>
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium ml-2">this month</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 text-purple-900">
          <CardContent className="p-6 flex items-center gap-4">
            <CheckCircle2 className="h-10 w-10 text-purple-500" />
            <div className="flex flex-col gap-1 flex-1">
              <p className="text-sm font-medium opacity-80">Non-Vendor %</p>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold">{stats.nonVendorAvg}%</p>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium ml-2">this month</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200 text-pink-900">
          <CardContent className="p-6 flex items-center gap-4">
            <PieChartIcon className="h-10 w-10 text-pink-500" />
            <div className="flex flex-col gap-1 flex-1">
              <p className="text-sm font-medium opacity-80">CWT Cases</p>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold">{stats.cwTotalCases}</p>
                <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full font-medium ml-2">this month</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200 text-teal-900">
          <CardContent className="p-6 flex items-center gap-4">
            <Users className="h-10 w-10 text-teal-500" />
            <div className="flex flex-col gap-1 flex-1">
              <p className="text-sm font-medium opacity-80">Avg ER</p>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold">{stats.currentErAvg}%</p>
                <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium ml-2">this month</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 text-indigo-900">
          <CardContent className="p-6 flex items-center gap-4">
            <Star className="h-10 w-10 text-indigo-500" />
            <div className="flex flex-col gap-1 flex-1">
              <p className="text-sm font-medium opacity-80">Branch Quality</p>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold">{qualitativeData.overall.toFixed(1)}</p>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium ml-2">this month</span>
              </div>
              <p className="text-sm text-indigo-700 mt-1">/5 rating</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend chart - takes full width */}
        <Card className="col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle>Coverage & Participation Trends</CardTitle>
            <CardDescription>
              Branch coverage and employee participation rate over the past 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isTrendsLoading ? (
              <div className="flex justify-center items-center h-80">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : monthlyTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart
                  data={monthlyTrends}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 20,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="branchCoverage"
                    name="Branch Coverage %"
                    stroke="#3b82f6"
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="participationRate"
                    name="Participation Rate %"
                    stroke="#10b981"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col justify-center items-center h-80">
                <TrendingUp className="h-16 w-16 text-slate-300 mb-2" />
                <p className="text-slate-500 text-lg">No trend data available</p>
                <p className="text-slate-400 text-sm mt-1">Data will appear as branch visits are recorded</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Branch Category Distribution</CardTitle>
            <CardDescription>
              Distribution of branches by category from visit data
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : categoryBreakdown && categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <defs>
                    {CATEGORY_GRADIENTS.map(grad => (
                      <linearGradient key={grad.id} id={grad.id} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={grad.from} />
                        <stop offset="100%" stopColor={grad.to} />
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryBreakdown.map((entry, index) => {
                      const cat = entry.name?.toLowerCase() || 'unknown';
                      const gradId = CATEGORY_GRADIENT_MAP[cat] || CATEGORY_GRADIENT_MAP.unknown;
                      return (
                        <Cell key={`cell-${index}`} fill={`url(#${gradId})`} />
                      );
                    })}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} branches`, name]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                <PieChartIcon className="h-12 w-12 mb-2 opacity-30" />
                <p>No category data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Qualitative Assessment */}
        <Card>
          <CardHeader>
            <CardTitle>Qualitative Assessment</CardTitle>
            <CardDescription>
              Branch quality metrics from {qualitativeData.count} branch visits
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : qualitativeData.count > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart outerRadius={90} data={prepareQualitativeData()}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Radar
                    name="Quality Rating"
                    dataKey="value"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                  <Tooltip formatter={(value, name, props) => {
                    const entry = props.payload;
                    if (entry && entry.type === 'rating') {
                      return [`${typeof value === 'number' ? value.toFixed(1) : value}/5`, 'Rating'];
                    }
                    return [`${typeof value === 'number' ? value.toFixed(1) : value}%`, 'Yes Responses'];
                  }} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                <Star className="h-12 w-12 mb-2 opacity-30" />
                <p>No qualitative assessment data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top performers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing BHRs</CardTitle>
            <CardDescription>
              BHRs with the highest report submissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : mappedPerformers && mappedPerformers.length > 0 ? (
              <ul className="space-y-2 pt-4">
                {mappedPerformers
                        .sort((a, b) => b.reports - a.reports)
                        .slice(0, 5)
                  .map(item => (
                    <li key={item.name} className="flex justify-between items-center py-1 px-2 rounded hover:bg-slate-50">
                      <span className="font-medium text-slate-800">{item.name}</span>
                      <span className="text-slate-500 text-sm">{item.reports} reports</span>
                    </li>
                  ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                <Users className="h-12 w-12 mb-2 opacity-30" />
                <p>No performer data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CHDashboard;
