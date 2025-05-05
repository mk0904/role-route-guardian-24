import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  BarChart as ReBarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { getVisitMetrics, getPerformanceTrends, getCoverageParticipationTrends } from "@/services/branchService";
import QualitativeHeatmap from "@/components/ch/QualitativeHeatmap";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { ChevronDown, ChevronUp, Calendar, Check, Star, TrendingUp, BarChart } from "lucide-react";
import { fetchQualitativeAssessments, fetchCategoryBreakdown } from "@/services/analyticsService";

// Define date range type
type DateRange = { from: Date; to: Date } | null;

const PERIOD_OPTIONS = [
  { label: "Last 7 Days", value: "lastWeek" },
  { label: "Last Month", value: "lastMonth" },
  { label: "Last 3 Months", value: "lastQuarter" },
  { label: "Last 6 Months", value: "lastSixMonths" },
  { label: "Last Year", value: "lastYear" }
];

// Add dark gradients for pie chart categories (same as CHDashboard)
const CATEGORY_GRADIENTS = [
  { id: 'platinum-gradient', from: '#a78bfa', to: '#6d28d9' },
  { id: 'diamond-gradient', from: '#60a5fa', to: '#1e3a8a' },
  { id: 'gold-gradient', from: '#facc15', to: '#b45309' },
  { id: 'silver-gradient', from: '#cbd5e1', to: '#334155' },
  { id: 'bronze-gradient', from: '#fdba74', to: '#b45309' },
  { id: 'unknown-gradient', from: '#cbd5e1', to: '#64748b' },
];
const CATEGORY_GRADIENT_MAP: Record<string, string> = {
  platinum: 'platinum-gradient',
  diamond: 'diamond-gradient',
  gold: 'gold-gradient',
  silver: 'silver-gradient',
  bronze: 'bronze-gradient',
  unknown: 'unknown-gradient',
};

// Define darker gradients for bar chart metrics
const BAR_GRADIENTS = [
  { id: 'manning-bar', from: '#60a5fa', to: '#1e3a8a' },      // blue: mid to deep
  { id: 'attrition-bar', from: '#f87171', to: '#b91c1c' },   // red: mid to deep
  { id: 'er-bar', from: '#34d399', to: '#065f46' },          // green: mid to deep
  { id: 'nonvendor-bar', from: '#a78bfa', to: '#6d28d9' },   // purple: mid to deep
  { id: 'cwt-bar', from: '#facc15', to: '#b45309' },         // gold: mid to deep
];

const CHAnalytics = () => {
  // State for date range filter
  const [dateRange, setDateRange] = useState<DateRange>(null);
  const [selectedChart, setSelectedChart] = useState("monthly");
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [categoryMetrics, setCategoryMetrics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPerformanceLoading, setIsPerformanceLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("lastSixMonths");
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
  const [isQualitativeLoading, setIsQualitativeLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("performance");
  
  // Toggle states for performance metrics
  const [showManning, setShowManning] = useState(true);
  const [showAttrition, setShowAttrition] = useState(true);
  const [showEr, setShowEr] = useState(true);
  const [showNonVendor, setShowNonVendor] = useState(true);
  
  // Toggle states for category metrics
  const [showManningCategory, setShowManningCategory] = useState(true);
  const [showAttritionCategory, setShowAttritionCategory] = useState(true);
  const [showErCategory, setShowErCategory] = useState(true);
  const [showCwtCategory, setShowCwtCategory] = useState(true);
  const [showNonVendorCategory, setShowNonVendorCategory] = useState(true);
  
  // State for category breakdown
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [isCategoryLoading, setIsCategoryLoading] = useState(true);

  // Add a state variable to track which line was just toggled on
  const [toggledLine, setToggledLine] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Fetch category-wise metrics
        const metricsData = await getVisitMetrics(dateRange);
        setCategoryMetrics(metricsData);
      } catch (error) {
        console.error("Error loading analytics data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [dateRange]);

  useEffect(() => {
    const loadQualitativeData = async () => {
      setIsQualitativeLoading(true);
      try {
        // Fetch qualitative assessment data with dateRange
        const qualitativeStats = await fetchQualitativeAssessments(dateRange);
        setQualitativeData(qualitativeStats);
      } catch (error) {
        console.error("Error loading qualitative data:", error);
      } finally {
        setIsQualitativeLoading(false);
      }
    };
    
    loadQualitativeData();
  }, [dateRange]);

  useEffect(() => {
    const loadPerformanceTrends = async () => {
      setIsPerformanceLoading(true);
      try {
        // Fetch performance trends with the selected time range
        const trendsData = await getPerformanceTrends(selectedPeriod);
        setPerformanceData(trendsData);
      } catch (error) {
        console.error("Error loading performance trends:", error);
      } finally {
        setIsPerformanceLoading(false);
      }
    };
    
    loadPerformanceTrends();
  }, [selectedPeriod]);
  
  useEffect(() => {
    const loadCategoryBreakdown = async () => {
      setIsCategoryLoading(true);
      try {
        const breakdown = await fetchCategoryBreakdown();
        setCategoryBreakdown(breakdown);
      } catch (error) {
        console.error("Error loading category breakdown:", error);
      } finally {
        setIsCategoryLoading(false);
      }
    };
    
    loadCategoryBreakdown();
  }, [dateRange]);

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
  };
  
  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
  };

  // Format x-axis labels to prevent overlapping
  const formatXAxis = (tickItem: string) => {
    if (!tickItem) return '';
    
    // For monthly data, show abbreviated month names
    if (selectedPeriod === 'lastSixMonths' || selectedPeriod === 'lastYear') {
      return tickItem.substring(0, 3);
    }
    
    // For weekly data, show date in a more compact format
    if (selectedPeriod === 'lastWeek' || selectedPeriod === 'lastMonth') {
      return tickItem;
    }
    
    // For quarterly data
    if (selectedPeriod === 'lastQuarter') {
      return tickItem;
    }
    
    return tickItem;
  };

  // Prepare qualitative data for radar visualization
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
  
  // Colors for category breakdown pie chart
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

  // Add custom toggle handlers for each metric
  const handleManningToggle = (checked: boolean) => {
    setShowManning(checked);
    setToggledLine(checked ? 'manning' : null);
  };
  const handleAttritionToggle = (checked: boolean) => {
    setShowAttrition(checked);
    setToggledLine(checked ? 'attrition' : null);
  };
  const handleErToggle = (checked: boolean) => {
    setShowEr(checked);
    setToggledLine(checked ? 'er' : null);
  };
  const handleNonVendorToggle = (checked: boolean) => {
    setShowNonVendor(checked);
    setToggledLine(checked ? 'nonVendor' : null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Branch Analytics</h1>
        <p className="text-lg text-slate-600">Branch performance and HR metrics analysis</p>
      </div>
      
      <Card className="mb-8">
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 w-full md:w-auto mb-6">
              <TabsTrigger value="performance">
                <TrendingUp className="h-5 w-5" />
                <span className="hidden md:inline ml-1">Performance Trends</span>
              </TabsTrigger>
              <TabsTrigger value="categories">
                <BarChart className="h-5 w-5" />
                <span className="hidden md:inline ml-1">Category Analysis</span>
              </TabsTrigger>
              <TabsTrigger value="quality">
                <Star className="h-5 w-5" />
                <span className="hidden md:inline ml-1">Quality Assessment</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="performance">
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
                    <h3 className="text-xl font-medium mb-2 md:mb-0">Performance Trends</h3>
                    <ToggleGroup 
                      type="single" 
                      value={selectedPeriod}
                      onValueChange={(value) => value && handlePeriodChange(value)}
                      className="justify-start"
                    >
                      {PERIOD_OPTIONS.map((option) => (
                        <ToggleGroupItem 
                          key={option.value} 
                          value={option.value}
                          aria-label={option.label}
                          className="text-xs sm:text-sm"
                        >
                          {option.label}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </div>
                  {/* Toggler Switches */}
                  <div className="flex flex-wrap gap-2 md:gap-4 items-center md:justify-end">
                    <div className="flex items-center gap-1 md:gap-2">
                      <Switch id="manning-toggle" checked={showManning} onCheckedChange={handleManningToggle} className="scale-90 md:scale-100" />
                      <Label htmlFor="manning-toggle" className="text-xs md:text-sm cursor-pointer">
                      <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-1"></span>
                      Manning %
                    </Label>
                  </div>
                    <div className="flex items-center gap-1 md:gap-2">
                      <Switch id="attrition-toggle" checked={showAttrition} onCheckedChange={handleAttritionToggle} className="scale-90 md:scale-100" />
                      <Label htmlFor="attrition-toggle" className="text-xs md:text-sm cursor-pointer">
                      <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-1"></span>
                      Attrition %
                    </Label>
                  </div>
                    <div className="flex items-center gap-1 md:gap-2">
                      <Switch id="er-toggle" checked={showEr} onCheckedChange={handleErToggle} className="scale-90 md:scale-100" />
                      <Label htmlFor="er-toggle" className="text-xs md:text-sm cursor-pointer">
                      <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-1"></span>
                      ER %
                    </Label>
                  </div>
                    <div className="flex items-center gap-1 md:gap-2">
                      <Switch id="non-vendor-toggle" checked={showNonVendor} onCheckedChange={handleNonVendorToggle} className="scale-90 md:scale-100" />
                      <Label htmlFor="non-vendor-toggle" className="text-xs md:text-sm cursor-pointer">
                      <span className="inline-block w-3 h-3 rounded-full bg-purple-500 mr-1"></span>
                      Non-Vendor %
                    </Label>
                    </div>
                  </div>
                </div>
                
                {isPerformanceLoading ? (
                  <div className="flex justify-center items-center h-80">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </div>
                ) : performanceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart 
                      data={performanceData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="month" 
                        angle={-45} 
                        textAnchor="end"
                        height={70}
                        tickFormatter={formatXAxis} 
                        interval={0}
                      />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      {showManning && (
                        <Line
                          key="manning"
                          isAnimationActive={toggledLine === 'manning'}
                          type="monotone"
                          dataKey="manning"
                          name="Manning %"
                          stroke="#3b82f6"
                          strokeWidth={2}
                        />
                      )}
                      {showAttrition && (
                        <Line
                          key="attrition"
                          isAnimationActive={toggledLine === 'attrition'}
                          type="monotone"
                          dataKey="attrition"
                          name="Attrition %"
                          stroke="#ef4444"
                          strokeWidth={2}
                        />
                      )}
                      {showEr && (
                        <Line
                          key="er"
                          isAnimationActive={toggledLine === 'er'}
                          type="monotone"
                          dataKey="er"
                          name="ER %"
                          stroke="#10b981"
                          strokeWidth={2}
                        />
                      )}
                      {showNonVendor && (
                        <Line
                          key="nonVendor"
                          isAnimationActive={toggledLine === 'nonVendor'}
                          type="monotone"
                          dataKey="nonVendor"
                          name="Non-Vendor %"
                          stroke="#8b5cf6"
                          strokeWidth={2}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-80">
                    <div className="h-16 w-16 text-slate-300 mb-2">📊</div>
                    <p className="text-slate-500">No performance trend data available</p>
                    <p className="text-sm text-slate-400">Data will appear as branch visits are recorded</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="categories">
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-medium">Category-wise Metrics</h3>
                  <DateRangePicker 
                    value={dateRange ? dateRange : { from: undefined, to: undefined }} 
                    onChange={handleDateRangeChange} 
                  />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <div className="mb-4 flex flex-wrap gap-4">
                      <div className="flex items-center gap-2">
                        <Switch id="manning-category-toggle" checked={showManningCategory} onCheckedChange={setShowManningCategory} />
                        <Label htmlFor="manning-category-toggle" className="text-sm cursor-pointer">
                          <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-1"></span>
                          Manning
                        </Label>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Switch id="attrition-category-toggle" checked={showAttritionCategory} onCheckedChange={setShowAttritionCategory} />
                        <Label htmlFor="attrition-category-toggle" className="text-sm cursor-pointer">
                          <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-1"></span>
                          Attrition
                        </Label>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Switch id="er-category-toggle" checked={showErCategory} onCheckedChange={setShowErCategory} />
                        <Label htmlFor="er-category-toggle" className="text-sm cursor-pointer">
                          <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-1"></span>
                          ER
                        </Label>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch id="non-vendor-category-toggle" checked={showNonVendorCategory} onCheckedChange={setShowNonVendorCategory} />
                        <Label htmlFor="non-vendor-category-toggle" className="text-sm cursor-pointer">
                          <span className="inline-block w-3 h-3 rounded-full bg-purple-500 mr-1"></span>
                          Non-Vendor
                        </Label>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch id="cwt-category-toggle" checked={showCwtCategory} onCheckedChange={setShowCwtCategory} />
                        <Label htmlFor="cwt-category-toggle" className="text-sm cursor-pointer">
                          <span className="inline-block w-3 h-3 rounded-full bg-yellow-500 mr-1"></span>
                          CWT Cases
                        </Label>
                      </div>
                    </div>
                    
                    {isLoading ? (
                      <div className="flex justify-center items-center h-64">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                      </div>
                    ) : categoryMetrics.length > 0 ? (
                      <ChartContainer 
                        config={{
                          platinum: { color: '#9333ea' },
                          diamond: { color: '#2563eb' },
                          gold: { color: '#eab308' },
                          silver: { color: '#94a3b8' },
                          bronze: { color: '#f97316' },
                          unknown: { color: '#cbd5e1' }
                        }}
                      >
                        <ResponsiveContainer width="100%" height={350}>
                          <ReBarChart 
                            data={categoryMetrics}
                            margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="name" 
                              angle={-45} 
                              textAnchor="end" 
                              height={70}
                              interval={0}
                            />
                            <YAxis />
                            <Tooltip
                              formatter={(value, name) => {
                                const metricLabels: Record<string, string> = {
                                  manning: "Manning",
                                  attrition: "Attrition",
                                  er: "ER",
                                  nonVendor: "Non-Vendor",
                                  cwt: "CWT Cases"
                                };
                                return [`${typeof value === 'number' ? value.toFixed(1) : value}%`, metricLabels[name] || name];
                              }}
                            />
                            <Legend />
                            <defs>
                              {BAR_GRADIENTS.map(grad => (
                                <linearGradient key={grad.id} id={grad.id} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor={grad.from} />
                                  <stop offset="100%" stopColor={grad.to} />
                                </linearGradient>
                              ))}
                            </defs>
                            {showManningCategory && (
                              <Bar dataKey="manning" name="Manning" fill="url(#manning-bar)" />
                            )}
                            {showAttritionCategory && (
                              <Bar dataKey="attrition" name="Attrition" fill="url(#attrition-bar)" />
                            )}
                            {showErCategory && (
                              <Bar dataKey="er" name="ER" fill="url(#er-bar)" />
                            )}
                            {showNonVendorCategory && (
                              <Bar dataKey="nonVendor" name="Non-Vendor" fill="url(#nonvendor-bar)" />
                            )}
                            {showCwtCategory && (
                              <Bar dataKey="cwt" name="CWT Cases" fill="url(#cwt-bar)" />
                            )}
                          </ReBarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-64">
                        <div className="h-16 w-16 text-slate-300 mb-2">📊</div>
                        <p className="text-slate-500">No category metrics available</p>
                        <p className="text-sm text-slate-400">Select a date range to view data</p>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Branch Category Distribution</h3>
                    {isCategoryLoading ? (
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
                        <div className="h-16 w-16 text-slate-300 mb-2">📊</div>
                        <p>No category breakdown available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="quality">
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-medium">Qualitative Assessment</h3>
                  <DateRangePicker 
                    value={dateRange ? dateRange : { from: undefined, to: undefined }} 
                    onChange={handleDateRangeChange} 
                  />
                </div>
                <p className="text-sm text-slate-600 mb-6">
                  Branch quality metrics from {qualitativeData.count} branch visits
                </p>
                
                {isQualitativeLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  </div>
                ) : qualitativeData.count > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
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
                    </div>
                    <div>
                      <div className="space-y-6">


                        <div>
                          <h3 className="text-sm font-medium mb-2">Leaders Code Alignment</h3>
                          <div className="flex items-center">
                            <div className="w-full bg-slate-200 h-2 rounded-full mr-2">
                              <div 
                                className="bg-purple-500 h-2 rounded-full"
                                style={{ width: `${(qualitativeData.leadersAligned / 5) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{((qualitativeData.leadersAligned / 5) * 100).toFixed(1)}%</span>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium mb-2">Employee Safety</h3>
                          <div className="flex items-center">
                            <div className="w-full bg-slate-200 h-2 rounded-full mr-2">
                              <div 
                                className="bg-yellow-500 h-2 rounded-full"
                                style={{ width: `${(qualitativeData.employeesSafe / 5) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{((qualitativeData.employeesSafe / 5) * 100).toFixed(1)}%</span>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium mb-2">Employee Motivation</h3>
                          <div className="flex items-center">
                            <div className="w-full bg-slate-200 h-2 rounded-full mr-2">
                              <div 
                                className="bg-orange-500 h-2 rounded-full"
                                style={{ width: `${(qualitativeData.employeesMotivated / 5) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{((qualitativeData.employeesMotivated / 5) * 100).toFixed(1)}%</span>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium mb-2">No Abusive Language</h3>
                          <div className="flex items-center">
                            <div className="w-full bg-slate-200 h-2 rounded-full mr-2">
                              <div 
                                className="bg-red-500 h-2 rounded-full"
                                style={{ width: `${(qualitativeData.noAbusiveLanguage / 5) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{((qualitativeData.noAbusiveLanguage / 5) * 100).toFixed(1)}%</span>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium mb-2">Comfort with Escalation</h3>
                          <div className="flex items-center">
                            <div className="w-full bg-slate-200 h-2 rounded-full mr-2">
                              <div 
                                className="bg-indigo-500 h-2 rounded-full"
                                style={{ width: `${(qualitativeData.comfortEscalation / 5) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{((qualitativeData.comfortEscalation / 5) * 100).toFixed(1)}%</span>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium mb-2">Inclusive Culture</h3>
                          <div className="flex items-center">
                            <div className="w-full bg-slate-200 h-2 rounded-full mr-2">
                              <div 
                                className="bg-pink-500 h-2 rounded-full"
                                style={{ width: `${(qualitativeData.inclusiveCulture / 5) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{((qualitativeData.inclusiveCulture / 5) * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                    <Star className="h-12 w-12 mb-2 opacity-30" />
                    <p>No qualitative assessment data available</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default CHAnalytics;
