import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Check, Save, X, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
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
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { BranchVisitSummary } from "@/services/reportService";

const formSchema = z.object({
  branch_id: z.string({
    required_error: "Branch is required",
  }),
  visit_date: z.date({
    required_error: "Visit date is required",
  }),
  hr_connect_session: z.boolean().default(false),
  total_employees_invited: z.coerce.number().int().optional(),
  total_participants: z.coerce.number().int().optional(),
  manning_percentage: z.coerce.number().min(0).max(100).optional(),
  attrition_percentage: z.coerce.number().min(0).max(100).optional(),
  non_vendor_percentage: z.coerce.number().min(0).max(100).optional(),
  performance_level: z.string().optional(),
  er_percentage: z.coerce.number().min(0).max(100).optional(),
  cwt_cases: z.coerce.number().int().min(0).optional(),
  new_employees_total: z.coerce.number().int().min(0).optional(),
  new_employees_covered: z.coerce.number().int().min(0).optional(),
  star_employees_total: z.coerce.number().int().min(0).optional(),
  star_employees_covered: z.coerce.number().int().min(0).optional(),
  leaders_aligned_with_code: z.string().optional(),
  employees_feel_safe: z.string().optional(),
  employees_feel_motivated: z.string().optional(),
  leaders_abusive_language: z.string().optional(),
  employees_comfort_escalation: z.string().optional(),
  inclusive_culture: z.string().optional(),
  feedback: z.string().optional(),
});

type Branch = {
  id: string;
  name: string;
  location: string;
  branch_code: string;
  category: string;
};

interface VisitReportData {
  id: string;
  branch_id: string;
  branches?: {
    name: string;
    location: string;
    branch_code: string;
    category: string;
  };
  visit_date: string;
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
  status: string;
  [key: string]: any;
}

interface EditVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  visitData: BranchVisitSummary | null;
  onUpdateSuccess: () => void;
}

const EditVisitModal = ({
  isOpen,
  onClose,
  visitData,
  onUpdateSuccess,
}: EditVisitModalProps) => {
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const { user } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hr_connect_session: false,
      manning_percentage: 0,
      attrition_percentage: 0,
      non_vendor_percentage: 0,
      er_percentage: 0,
    },
  });

  // Fetch assigned branches
  useEffect(() => {
    const fetchAssignedBranches = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from("branch_assignments")
          .select(`
            branch_id,
            branches:branch_id (
              id,
              name,
              location,
              branch_code,
              category
            )
          `)
          .eq("user_id", user.id);
          
        if (error) throw error;
        
        const branchData = data
          .map(item => item.branches as Branch)
          .filter(Boolean);
          
        setBranches(branchData);
      } catch (error) {
        console.error("Error fetching assigned branches:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load assigned branches.",
        });
      }
    };
    
    fetchAssignedBranches();
  }, [user]);

  // Populate form when visitData changes
  useEffect(() => {
    if (visitData) {
      form.reset({
        branch_id: visitData.branch_id,
        visit_date: new Date(visitData.visit_date),
        hr_connect_session: visitData.hr_connect_session,
        total_employees_invited: visitData.total_employees_invited,
        total_participants: visitData.total_participants,
        manning_percentage: visitData.manning_percentage,
        attrition_percentage: visitData.attrition_percentage,
        non_vendor_percentage: visitData.non_vendor_percentage,
        performance_level: visitData.performance_level,
        er_percentage: visitData.er_percentage,
        cwt_cases: visitData.cwt_cases,
        new_employees_total: visitData.new_employees_total,
        new_employees_covered: visitData.new_employees_covered,
        star_employees_total: visitData.star_employees_total,
        star_employees_covered: visitData.star_employees_covered,
        leaders_aligned_with_code: visitData.leaders_aligned_with_code,
        employees_feel_safe: visitData.employees_feel_safe,
        employees_feel_motivated: visitData.employees_feel_motivated,
        leaders_abusive_language: visitData.leaders_abusive_language,
        employees_comfort_escalation: visitData.employees_comfort_escalation,
        inclusive_culture: visitData.inclusive_culture,
        feedback: visitData.feedback,
      });
    }
  }, [visitData, form]);

  const updateVisit = async (status: "draft" | "submitted", data: z.infer<typeof formSchema>) => {
    if (!visitData || !user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("branch_visits")
        .update({
          ...data,
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", visitData.id);

      if (error) throw error;

      toast({
        title: status === "draft" ? "Draft saved" : "Report submitted",
        description: status === "draft" 
          ? "Your report has been saved as draft." 
          : "Your report has been submitted successfully.",
      });

      onUpdateSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating visit:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${status === "draft" ? "save" : "submit"} report.`,
      });
    } finally {
      setLoading(false);
    }
  };

  const onSaveAsDraft = (data: z.infer<typeof formSchema>) => {
    updateVisit("draft", data);
  };

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    updateVisit("submitted", data);
  };

  const getBranchName = (branchId: string) => {
    const branch = branches.find(b => b.id === branchId);
    return branch ? `${branch.name} (${branch.branch_code})` : "Unknown Branch";
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => !loading && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Edit Branch Visit Report</DialogTitle>
          <DialogDescription>
            Make changes to your visit report. Save as draft or submit when finished.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Branch Selection */}
              <FormField
                control={form.control}
                name="branch_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name} ({branch.branch_code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Visit Date */}
              <FormField
                control={form.control}
                name="visit_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Visit Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
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
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* HR Connect Session */}
            <FormField
              control={form.control}
              name="hr_connect_session"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">HR Connect Session</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Was an HR connect session conducted during the visit?
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Conditional HR Connect Fields */}
            {form.watch("hr_connect_session") && (
              <div className="space-y-6 rounded-lg border p-4">
                <h3 className="text-lg font-medium">HR Connect Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="total_employees_invited"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Employees Invited</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="total_participants"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Participants</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Branch Metrics */}
            <div className="space-y-6 rounded-lg border p-4">
              <h3 className="text-lg font-medium">Branch Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="manning_percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manning %</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="attrition_percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Attrition %</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="non_vendor_percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Non-Vendor %</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="performance_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Performance Level</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select performance level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="er_percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ER %</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cwt_cases"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CWT Cases</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Employee Coverage */}
            <div className="space-y-6 rounded-lg border p-4">
              <h3 className="text-lg font-medium">Employee Coverage</h3>
              
              <div className="space-y-4">
                <h4 className="font-medium">New Employees (0-6 months)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="new_employees_total"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="new_employees_covered"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Covered</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="space-y-4 mt-6">
                <h4 className="font-medium">STAR Employees</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="star_employees_total"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="star_employees_covered"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Covered</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
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
            <div className="space-y-6 rounded-lg border p-4">
              <h3 className="text-lg font-medium">Qualitative Assessment</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="leaders_aligned_with_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Leaders Aligned with Code</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select rating" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="very_poor">Very Poor</SelectItem>
                          <SelectItem value="poor">Poor</SelectItem>
                          <SelectItem value="neutral">Neutral</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="excellent">Excellent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="employees_feel_safe"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employees Feel Safe</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select rating" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="very_poor">Very Poor</SelectItem>
                          <SelectItem value="poor">Poor</SelectItem>
                          <SelectItem value="neutral">Neutral</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="excellent">Excellent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="employees_feel_motivated"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employees Feel Motivated</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select rating" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="very_poor">Very Poor</SelectItem>
                          <SelectItem value="poor">Poor</SelectItem>
                          <SelectItem value="neutral">Neutral</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="excellent">Excellent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="leaders_abusive_language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Leaders Use Abusive Language</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select rating" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="very_poor">Very Poor</SelectItem>
                          <SelectItem value="poor">Poor</SelectItem>
                          <SelectItem value="neutral">Neutral</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="excellent">Excellent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="employees_comfort_escalation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employees Comfortable with Escalation</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select rating" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="very_poor">Very Poor</SelectItem>
                          <SelectItem value="poor">Poor</SelectItem>
                          <SelectItem value="neutral">Neutral</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="excellent">Excellent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="inclusive_culture"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inclusive Culture</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select rating" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="very_poor">Very Poor</SelectItem>
                          <SelectItem value="poor">Poor</SelectItem>
                          <SelectItem value="neutral">Neutral</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="excellent">Excellent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Feedback */}
            <FormField
              control={form.control}
              name="feedback"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Feedback & Observations</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter any additional feedback or observations..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <DialogFooter className="flex justify-between gap-2 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={form.handleSubmit(onSaveAsDraft)}
              disabled={loading}
            >
              <Save className="mr-2 h-4 w-4" />
              Save as Draft
            </Button>
            
            <Button
              onClick={form.handleSubmit(onSubmit)}
              disabled={loading}
            >
              <UploadCloud className="mr-2 h-4 w-4" />
              Submit
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditVisitModal;
