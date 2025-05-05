import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { format, parseISO } from "date-fns";
import { 
  CheckSquare, 
  MapPin, 
  UserPlus, 
  Users, 
  AlertTriangle, 
  ThumbsDown, 
  Frown, 
  Meh, 
  Smile, 
  Star,
  Calendar as CalendarIcon,
  Save,
  Send
} from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage,
  FormDescription 
} from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { YesNoToggle } from "@/components/ui/yes-no-toggle";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { fetchAssignedBranchesWithDetails, createBranchVisit } from "@/services/branchService";
import { Database } from "@/integrations/supabase/types";

type BranchCategory = "platinum" | "diamond" | "gold" | "silver" | "bronze";

type BranchAssignment = {
  branch_id: string;
  branches?: {
    id: string;
    name: string;
    location: string;
    category: string;
    branch_code: string | null;
  };
};

interface Branch {
  id: string;
  name: string;
  location: string;
  category: BranchCategory;
  created_at: string;
  updated_at: string;
  branch_code: string;
  branches?: {
    id: string;
    name: string;
    location: string;
    category: string;
    branch_code: string | null;
  };
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

const formSchema = z.object({
  branchId: z.string(),
  branchCode: z.string(),
  visitDate: z.date(),
  branchCategory: z.enum(["", "platinum", "diamond", "gold", "silver", "bronze"]),
  hrConnectSession: z.boolean(),
  totalEmployeesInvited: z.number().min(0),
  totalParticipants: z.number().min(0),
  manningPercentage: z.number().min(0).max(100),
  attritionPercentage: z.number().min(0).max(100),
  leaders_aligned_with_code: z.enum(["yes", "no"]),
  employees_feel_safe: z.enum(["yes", "no"]),
  employees_feel_motivated: z.enum(["yes", "no"]),
  leaders_abusive_language: z.enum(["yes", "no"]),
  employees_comfort_escalation: z.enum(["yes", "no"]),
  inclusive_culture: z.enum(["yes", "no"]),
  feedback: z.string().max(200, { message: "Additional remarks must not be longer than 200 words" }).optional(),
  nonVendorPercentage: z.number().min(0).max(100).optional(),
  erPercentage: z.number().min(0).max(100).optional(),
  cwtCases: z.number().min(0).optional(),
  performanceLevel: z.string().optional(),
  newEmployeesTotal: z.number().min(0).optional(),
  newEmployeesCovered: z.number().min(0).optional(),
  starEmployeesTotal: z.number().min(0).optional(),
  starEmployeesCovered: z.number().min(0).optional(),
});

const NewVisit = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [branches, setBranches] = useState<BranchAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Add state variables for YesNoToggle components
  const [leadersAlignedWithCode, setLeadersAlignedWithCode] = useState<boolean | null>(null);
  const [employeesFeelSafe, setEmployeesFeelSafe] = useState<boolean | null>(null);
  const [employeesFeelMotivated, setEmployeesFeelMotivated] = useState<boolean | null>(null);
  const [leadersAbusiveLanguage, setLeadersAbusiveLanguage] = useState<boolean | null>(null);
  const [employeesComfortEscalation, setEmployeesComfortEscalation] = useState<boolean | null>(null);
  const [inclusiveCulture, setInclusiveCulture] = useState<boolean | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      branchId: "",
      branchCode: "",
      visitDate: new Date(),
      branchCategory: "" as BranchCategory,
      hrConnectSession: false,
      totalEmployeesInvited: 0,
      totalParticipants: 0,
      manningPercentage: 0,
      attritionPercentage: 0,
      leaders_aligned_with_code: 'yes',
      employees_feel_safe: 'yes',
      employees_feel_motivated: 'yes',
      leaders_abusive_language: 'no',
      employees_comfort_escalation: 'yes',
      inclusive_culture: 'yes',
      feedback: "",
    },
  });

  const mapBranchCategory = (category: string): BranchCategory => {
    return category as BranchCategory;
  };

  const toCamelCase = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'platinum':
        return 'bg-violet-100 text-violet-700 border-violet-200';
      case 'diamond':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'gold':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'silver':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'bronze':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  useEffect(() => {
    const fetchBranches = async () => {
      if (!user) {
        console.log("No user found, skipping branch fetch");
        return;
      }

      try {
        const assignedBranches = await fetchAssignedBranchesWithDetails(user.id);
        console.log('Assigned branches:', assignedBranches);
        setBranches(assignedBranches);

        // Set default branch category based on first branch if available
        if (assignedBranches.length > 0 && form.getValues('branchId')) {
          const selectedBranch = assignedBranches.find(branch => branch.branch_id === form.getValues('branchId'));
          if (selectedBranch?.branches) {
            form.setValue('branchCategory', toCamelCase(selectedBranch.branches.category) as BranchCategory);
            form.setValue('branchCode', selectedBranch.branches.branch_code || '');
          }
        }
      } catch (error) {
        console.error("Error loading branches:", error);
        // Only show error toast if there's an actual error
        if (error instanceof Error) {
        toast({
          variant: "destructive",
          title: "Error",
            description: error.message || "Failed to load assigned branches.",
        });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, [user, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to submit a visit form.",
      });
      return;
    }

    setLoading(true);
    setSaveStatus("saving");

    try {
      const visitData = {
        user_id: user.id,
        branch_id: values.branchId,
        visit_date: values.visitDate.toISOString().split('T')[0],
        branch_category: values.branchCategory,
        hr_connect_session: values.hrConnectSession,
        total_employees_invited: values.totalEmployeesInvited,
        total_participants: values.totalParticipants,
        manning_percentage: values.manningPercentage,
        attrition_percentage: values.attritionPercentage,
        non_vendor_percentage: values.nonVendorPercentage || 0,
        er_percentage: values.erPercentage || 0,
        cwt_cases: values.cwtCases || 0,
        performance_level: values.performanceLevel || null,
        new_employees_total: values.newEmployeesTotal || 0,
        new_employees_covered: values.newEmployeesCovered || 0,
        star_employees_total: values.starEmployeesTotal || 0,
        star_employees_covered: values.starEmployeesCovered || 0,
        feedback: values.feedback || null,
        leaders_aligned_with_code: values.leaders_aligned_with_code,
        employees_feel_safe: values.employees_feel_safe,
        employees_feel_motivated: values.employees_feel_motivated,
        leaders_abusive_language: values.leaders_abusive_language,
        employees_comfort_escalation: values.employees_comfort_escalation,
        inclusive_culture: values.inclusive_culture,
        status: "submitted"
      };

      const result = await createBranchVisit(visitData);

      if (result.success) {
        setSaveStatus("saved");
        toast({
          title: "Success",
          description: "Branch visit has been submitted successfully.",
        });

        // Navigate back to visits page after a short delay
        setTimeout(() => {
          navigate('/visits');
        }, 1500);
      } else {
        throw new Error(result.error?.message || "Failed to submit branch visit");
      }
    } catch (error: any) {
      console.error("Error submitting visit:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to submit branch visit.",
      });
      setSaveStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const saveDraft = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to save a draft visit.",
      });
      return;
    }

    try {
      setSaveStatus("saving");
      setLoading(true);

      const values = form.getValues();

      if (!values.branchId) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please select a branch before saving.",
        });
        setSaveStatus("idle");
        setLoading(false);
        return;
      }

      const draftData = {
        user_id: user.id,
        branch_id: values.branchId,
        visit_date: values.visitDate.toISOString(),
        branch_category: values.branchCategory,
        hr_connect_session: values.hrConnectSession,
        total_employees_invited: values.totalEmployeesInvited,
        total_participants: values.totalParticipants,
        manning_percentage: values.manningPercentage,
        attrition_percentage: values.attritionPercentage,
        leaders_aligned_with_code: values.leaders_aligned_with_code,
        employees_feel_safe: values.employees_feel_safe,
        employees_feel_motivated: values.employees_feel_motivated,
        leaders_abusive_language: values.leaders_abusive_language,
        employees_comfort_escalation: values.employees_comfort_escalation,
        inclusive_culture: values.inclusive_culture,
        feedback: values.feedback,
        status: "draft" as const
      };

      const result = await createBranchVisit(draftData);

      if (result) {
        setSaveStatus("saved");
        toast({
          title: "Success",
          description: "Draft has been saved successfully.",
      });

        // Navigate back to visits page after a short delay
        setTimeout(() => {
          navigate('/bh/my-visits');
        }, 1500);
      }
    } catch (error: any) {
      console.error("Error saving draft:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create visit report.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle branch selection and update category
  const handleBranchChange = (branchId: string) => {
    const selectedBranch = branches.find(branch => branch.branch_id === branchId);
    if (selectedBranch?.branches) {
      form.setValue('branchCategory', selectedBranch.branches.category.toLowerCase() as BranchCategory);
      form.setValue('branchCode', selectedBranch.branches.branch_code || '');
    }
  };

  const calculateCoverage = () => {
    const invited = form.getValues("totalEmployeesInvited");
    const participants = form.getValues("totalParticipants");
    if (invited > 0) {
      return Math.round((participants / invited) * 100);
    }
    return 0;
  };

  // Configuration for the qualitative assessment buttons
  const qualitativeOptions = [
    { value: 'very_poor', label: 'Very Poor', color: 'border-red-300 data-[state=checked]:bg-red-100 data-[state=checked]:text-red-700', icon: ThumbsDown },
    { value: 'poor', label: 'Poor', color: 'border-orange-300 data-[state=checked]:bg-orange-100 data-[state=checked]:text-orange-700', icon: Frown },
    { value: 'neutral', label: 'Neutral', color: 'border-blue-300 data-[state=checked]:bg-blue-50 data-[state=checked]:text-blue-700', icon: Meh },
    { value: 'good', label: 'Good', color: 'border-green-300 data-[state=checked]:bg-green-50 data-[state=checked]:text-green-700', icon: Smile },
    { value: 'excellent', label: 'Excellent', color: 'border-emerald-300 data-[state=checked]:bg-emerald-50 data-[state=checked]:text-emerald-700', icon: Star },
  ];

  return (
    <div className="container max-w-5xl py-6">
      <h1 className="text-2xl font-bold mb-6">New Branch Visit Form</h1>

      <Card>
        <CardHeader>
          <CardTitle>Branch Visit Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Basic Information</h2>

                <FormField
                  control={form.control}
                  name="branchId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branch</FormLabel>
              <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleBranchChange(value);
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                  <SelectValue placeholder="Select a branch" />
                </SelectTrigger>
                        </FormControl>
                <SelectContent>
                          {branches.length === 0 ? (
                            <SelectItem value="no-branches" disabled>No branches assigned</SelectItem>
                          ) : (
                            branches.map(branch => (
                              <SelectItem
                                key={branch.branch_id}
                                value={branch.branch_id}
                                onClick={() => {
                                  const selectedBranch = branches.find(b => b.branch_id === branch.branch_id);
                                  console.log('Selected branch:', selectedBranch);
                                  if (selectedBranch?.branches) {
                                    form.setValue('branchCategory', selectedBranch.branches.category.toLowerCase() as BranchCategory);
                                    form.setValue('branchCode', selectedBranch.branches.branch_code || '');
                                  }
                                }}
                              >
                                {branch.branches?.name} ({branch.branches?.location})
                    </SelectItem>
                            ))
                          )}
                </SelectContent>
              </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="visitDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Visit Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                            <FormControl>
                  <Button
                    variant={"outline"}
                    className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                    )}
                  >
                                {field.value ? (
                                  format(field.value, "PP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                            </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                    initialFocus
                              className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="branchCategory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Branch Category</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled
                              placeholder="Select a branch to set category"
                              className={cn(
                                "font-medium",
                                getCategoryColor(field.value)
                              )}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="branchCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Branch Code</FormLabel>
                          <FormControl>
                <Input
                              {...field}
                              disabled
                              placeholder="Select a branch to set code"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                  </div>
                </div>
              </div>

              {/* HR Connect Session */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">HR Connect Session</h2>

                <FormField
                  control={form.control}
                  name="hrConnectSession"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>HR Connect Session Conducted</FormLabel>
                        <FormDescription>
                          Check if an HR connect session was conducted during the visit
                        </FormDescription>
              </div>
                    </FormItem>
                  )}
                />

                {form.watch('hrConnectSession') && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="totalEmployeesInvited"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Employees Invited</FormLabel>
                          <FormControl>
                <Input
                  type="number"
                              min="0"
                              placeholder="0"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => {
                                const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="totalParticipants"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Participants</FormLabel>
                          <FormControl>
                <Input
                  type="number"
                              min="0"
                              placeholder="0"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => {
                                const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div>
                      <FormLabel>Coverage Percentage</FormLabel>
                      <div className="h-10 flex items-center justify-center rounded-md border bg-muted/50 px-3">
                        {calculateCoverage()}%
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Branch Metrics */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Branch Metrics</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="manningPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Manning %</FormLabel>
                        <FormControl>
                          <div className="relative">
                <Input
                  type="number"
                              min="0"
                              max="100"
                              placeholder="0"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => {
                                const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                                field.onChange(value);
                              }}
                            />
                            <span className="absolute right-3 top-2.5">%</span>
              </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="attritionPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Attrition %</FormLabel>
                        <FormControl>
                          <div className="relative">
                <Input
                  type="number"
                              min="0"
                              max="100"
                              placeholder="0"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => {
                                const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                                field.onChange(value);
                              }}
                            />
                            <span className="absolute right-3 top-2.5">%</span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                />
              </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="nonVendorPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Non-Vendor %</FormLabel>
                        <FormControl>
                          <div className="relative">
                <Input
                  type="number"
                              min="0"
                              max="100"
                              placeholder="0"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => {
                                const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                                field.onChange(value);
                              }}
                            />
                            <span className="absolute right-3 top-2.5">%</span>
              </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="erPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ER %</FormLabel>
                        <FormControl>
                          <div className="relative">
                <Input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="0"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => {
                                const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                                field.onChange(value);
                              }}
                            />
                            <span className="absolute right-3 top-2.5">%</span>
              </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cwtCases"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>No. of CWT Cases</FormLabel>
                        <FormControl>
                <Input
                  type="number"
                            min="0"
                            placeholder="0"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                />
              </div>

                <FormField
                  control={form.control}
                  name="performanceLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Performance</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select performance level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="excellent">Excellent</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="average">Average</SelectItem>
                          <SelectItem value="below_average">Below Average</SelectItem>
                          <SelectItem value="poor">Poor</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Employee Coverage */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Employee Coverage</h2>

              <div>
                  <h3 className="text-base font-medium mb-3">New Employees (0-6 months)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="newEmployeesTotal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="0"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => {
                                const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="newEmployeesCovered"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Covered</FormLabel>
                          <FormControl>
                <Input
                  type="number"
                              min="0"
                              placeholder="0"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => {
                                const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
              </div>

              <div>
                  <h3 className="text-base font-medium mb-3">STAR Employees</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="starEmployeesTotal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="0"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => {
                                const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="starEmployeesCovered"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Covered</FormLabel>
                          <FormControl>
                <Input
                  type="number"
                              min="0"
                              placeholder="0"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => {
                                const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                />
              </div>
            </div>
              </div>

              {/* Qualitative Assessment */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Qualitative Assessment</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <Label className="flex-1">Do leaders conduct business/work that is aligned with company's code of conduct?</Label>
                <YesNoToggle
                  name="leadersAlignedWithCode"
                  value={leadersAlignedWithCode}
                  onChange={(value) => setLeadersAlignedWithCode(value)}
                />
              </div>

                  <div className="flex items-center justify-between gap-4">
                    <Label className="flex-1">Do employees feel safe & secure at their workplace?</Label>
                <YesNoToggle
                  name="employeesFeelSafe"
                  value={employeesFeelSafe}
                  onChange={(value) => setEmployeesFeelSafe(value)}
                />
              </div>

                  <div className="flex items-center justify-between gap-4">
                    <Label className="flex-1">Do employees feel motivated at workplace?</Label>
                <YesNoToggle
                  name="employeesFeelMotivated"
                  value={employeesFeelMotivated}
                  onChange={(value) => setEmployeesFeelMotivated(value)}
                />
              </div>

                  <div className="flex items-center justify-between gap-4">
                    <Label className="flex-1">Do leaders use abusive and rude language in meetings or on the floor or in person?</Label>
                <YesNoToggle
                  name="leadersAbusiveLanguage"
                  value={leadersAbusiveLanguage}
                  onChange={(value) => setLeadersAbusiveLanguage(value)}
                  inverseColors={true}
                />
              </div>

                  <div className="flex items-center justify-between gap-4">
                    <Label className="flex-1">Do employees feel comfortable to escalate or raise malpractice or ethically wrong things?</Label>
                <YesNoToggle
                  name="employeesComfortEscalation"
                  value={employeesComfortEscalation}
                  onChange={(value) => setEmployeesComfortEscalation(value)}
                />
              </div>

                  <div className="flex items-center justify-between gap-4">
                    <Label className="flex-1">Do employees feel workplace culture is inclusive with respect to caste, gender & religion?</Label>
                <YesNoToggle
                  name="inclusiveCulture"
                  value={inclusiveCulture}
                  onChange={(value) => setInclusiveCulture(value)}
                />
                  </div>
              </div>
            </div>

              {/* Additional Remarks */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Additional Remarks</h2>
                <FormField
                  control={form.control}
                  name="feedback"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
              <Textarea
                          placeholder="Enter any additional remarks (optional)"
                          className="resize-none min-h-[120px]"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum 200 words
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
              />
            </div>

              <div className="flex items-center justify-between gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={saveDraft}
                  disabled={loading}
                >
                  {saveStatus === "saving" ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save as Draft
                    </>
                  )}
                </Button>

            <Button 
              type="submit" 
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
            >
                  {saveStatus === "saving" ? (
                <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                      <Send className="mr-2 h-4 w-4" />
                      Submit Visit
                </>
              )}
            </Button>
              </div>
          </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewVisit;
