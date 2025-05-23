
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Calendar } from "@/components/ui/calendar";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
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
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { YesNoToggle } from "@/components/ui/yes-no-toggle";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, Save, Check, X, ThumbsUp, ThumbsDown } from "lucide-react";
import { format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { BranchVisitSummary } from "@/services/reportService";

// Define Branch interface
interface Branch {
  id: string;
  name: string;
  location: string;
  branch_code: string;
  category: string;
}

const formSchema = z.object({
  branch_id: z.string({
    required_error: "Please select a branch",
  }),
  visit_date: z.date({
    required_error: "Please select a date",
  }),
  hr_connect_session: z.boolean().default(false),
  total_employees_invited: z.coerce.number().int().min(0).optional(),
  total_participants: z.coerce.number().int().min(0).optional(),
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

type FormData = z.infer<typeof formSchema>;

interface EditVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  visitData: BranchVisitSummary | null;
  onUpdateSuccess: () => void;
}

const EditVisitModal = ({ isOpen, onClose, visitData, onUpdateSuccess }: EditVisitModalProps) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hr_connect_session: false,
    },
  });
  
  // Add state variables for YesNoToggle components
  const [leadersAlignedWithCode, setLeadersAlignedWithCode] = useState<boolean | null>(null);
  const [employeesFeelSafe, setEmployeesFeelSafe] = useState<boolean | null>(null);
  const [employeesFeelMotivated, setEmployeesFeelMotivated] = useState<boolean | null>(null);
  const [leadersAbusiveLanguage, setLeadersAbusiveLanguage] = useState<boolean | null>(null);
  const [employeesComfortEscalation, setEmployeesComfortEscalation] = useState<boolean | null>(null);
  const [inclusiveCulture, setInclusiveCulture] = useState<boolean | null>(null);
  
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const { data, error } = await supabase
          .from("branches")
          .select("*")
          .order("name");
          
        if (error) throw error;
        setBranches(data || []);
      } catch (error) {
        console.error("Error loading branches:", error);
        toast({
          variant: "destructive",
          title: "Failed to load branches",
          description: "Please try refreshing the page.",
        });
      }
    };

    fetchBranches();
  }, []);
  
  useEffect(() => {
    if (visitData) {
      // Set all the values from visitData to the form
      form.reset({
        branch_id: visitData.branch_id || "",
        visit_date: visitData.visit_date ? parseISO(visitData.visit_date) : new Date(),
        hr_connect_session: visitData.hr_connect_session || false,
        total_employees_invited: visitData.total_employees_invited || 0,
        total_participants: visitData.total_participants || 0,
        manning_percentage: visitData.manning_percentage || 0,
        attrition_percentage: visitData.attrition_percentage || 0,
        non_vendor_percentage: visitData.non_vendor_percentage || 0,
        performance_level: visitData.performance_level || "",
        er_percentage: visitData.er_percentage || 0,
        cwt_cases: visitData.cwt_cases || 0,
        new_employees_total: visitData.new_employees_total || 0,
        new_employees_covered: visitData.new_employees_covered || 0,
        star_employees_total: visitData.star_employees_total || 0,
        star_employees_covered: visitData.star_employees_covered || 0,
        leaders_aligned_with_code: visitData.leaders_aligned_with_code || "",
        employees_feel_safe: visitData.employees_feel_safe || "",
        employees_feel_motivated: visitData.employees_feel_motivated || "",
        leaders_abusive_language: visitData.leaders_abusive_language || "",
        employees_comfort_escalation: visitData.employees_comfort_escalation || "",
        inclusive_culture: visitData.inclusive_culture || "",
        feedback: visitData.feedback || "",
      });

      // Set YesNoToggle states
      setLeadersAlignedWithCode(visitData.leaders_aligned_with_code === "yes");
      setEmployeesFeelSafe(visitData.employees_feel_safe === "yes");
      setEmployeesFeelMotivated(visitData.employees_feel_motivated === "yes");
      setLeadersAbusiveLanguage(visitData.leaders_abusive_language === "yes");
      setEmployeesComfortEscalation(visitData.employees_comfort_escalation === "yes");
      setInclusiveCulture(visitData.inclusive_culture === "yes");
    }
  }, [visitData, form]);

  const onSubmit = async (data: FormData, status: "draft" | "submitted" = "draft") => {
    if (!user || !visitData?.id) return;
    
    setIsSubmitting(true);
    
    try {
      // Fix the date bug by preserving the date object as is
      // Instead of using toISOString() which can cause timezone issues, we use the form's exact date value
      const visitDate = data.visit_date;
      
      const { error } = await supabase
        .from("branch_visits")
        .update({
          ...data,
          leaders_aligned_with_code: leadersAlignedWithCode ? "yes" : "no",
          employees_feel_safe: employeesFeelSafe ? "yes" : "no",
          employees_feel_motivated: employeesFeelMotivated ? "yes" : "no",
          leaders_abusive_language: leadersAbusiveLanguage ? "yes" : "no",
          employees_comfort_escalation: employeesComfortEscalation ? "yes" : "no",
          inclusive_culture: inclusiveCulture ? "yes" : "no",
          status,
          visit_date: `${visitDate.getFullYear()}-${String(visitDate.getMonth() + 1).padStart(2, '0')}-${String(visitDate.getDate()).padStart(2, '0')}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", visitData.id);
        
      if (error) throw error;
      
      toast({
        title: status === "submitted" ? "Report submitted!" : "Draft saved!",
        description: status === "submitted" 
          ? "Your report has been submitted successfully."
          : "Your draft has been saved successfully.",
      });
      
      onUpdateSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error updating report:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "An error occurred while updating the report.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to handle focus on input field (clear 0 values)
  const handleNumberInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value === "0") {
      e.target.value = "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Edit Branch Visit Report</DialogTitle>
          <DialogDescription>
            Make changes to your visit report. Save as draft or submit when finished.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => onSubmit(data, "draft"))}>
            <div className="space-y-4">
              {/* General Info Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">General Information</h3>
                <FormField
                  control={form.control}
                  name="branch_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branch</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a branch" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {branches.map((branch) => (
                            <SelectItem key={branch.id} value={branch.id}>
                              {branch.name} - {branch.location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
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
                                "w-full pl-3 text-left font-normal",
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
                            disabled={(date) =>
                              date > new Date() || date < new Date("2023-01-01")
                            }
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="hr_connect_session"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">HR Connect Session Conducted</FormLabel>
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
              </div>
              
              {/* HR Connect Session Details - Only show if hr_connect_session is true */}
              {form.watch("hr_connect_session") && (
                <div className="border-t pt-4 mt-4 space-y-4">
                  <h3 className="text-lg font-medium">HR Connect Session Details</h3>
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
                              value={field.value === 0 ? "" : field.value}
                              onFocus={handleNumberInputFocus}
                              placeholder="0"
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
                              value={field.value === 0 ? "" : field.value}
                              onFocus={handleNumberInputFocus}
                              placeholder="0"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div>
                      <FormLabel>Coverage Percentage</FormLabel>
                      <div className="h-10 flex items-center justify-center rounded-md border bg-muted/50 px-3">
                        {form.watch("total_employees_invited") > 0 
                          ? Math.round((form.watch("total_participants") / form.watch("total_employees_invited")) * 100) 
                          : 0}%
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Metrics & Data Section */}
              <div className="border-t pt-4 mt-6 space-y-4">
                <h3 className="text-lg font-medium">Metrics & Data</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="manning_percentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Manning Percentage (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            value={field.value === 0 ? "" : field.value}
                            onFocus={handleNumberInputFocus}
                            placeholder="0"
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
                        <FormLabel>Attrition Percentage (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            value={field.value === 0 ? "" : field.value}
                            onFocus={handleNumberInputFocus}
                            placeholder="0"
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
                        <FormLabel>Non-Vendor Percentage (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            value={field.value === 0 ? "" : field.value}
                            onFocus={handleNumberInputFocus}
                            placeholder="0"
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <FormLabel>ER Percentage (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            value={field.value === 0 ? "" : field.value}
                            onFocus={handleNumberInputFocus}
                            placeholder="0"
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
                            value={field.value === 0 ? "" : field.value}
                            onFocus={handleNumberInputFocus}
                            placeholder="0"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-medium mb-3">New Employee Coverage</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="new_employees_total"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total New Employees</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              value={field.value === 0 ? "" : field.value}
                              onFocus={handleNumberInputFocus}
                              placeholder="0"
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
                          <FormLabel>New Employees Covered</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              value={field.value === 0 ? "" : field.value}
                              onFocus={handleNumberInputFocus}
                              placeholder="0"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-medium mb-3">Star Employee Coverage</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="star_employees_total"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Star Employees</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              value={field.value === 0 ? "" : field.value}
                              onFocus={handleNumberInputFocus}
                              placeholder="0"
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
                          <FormLabel>Star Employees Covered</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              value={field.value === 0 ? "" : field.value}
                              onFocus={handleNumberInputFocus}
                              placeholder="0"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
              
              {/* Qualitative Assessment Section */}
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

              {/* Additional Remarks Section */}
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
            </div>
            
            <DialogFooter className="mt-6 gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
              <Button 
                type="submit" 
                variant="secondary"
                disabled={isSubmitting}
              >
                <Save className="h-4 w-4 mr-1" /> {isSubmitting ? "Saving..." : "Save as Draft"}
              </Button>
              <Button 
                type="button" 
                disabled={isSubmitting}
                onClick={() => {
                  if (form.formState.isValid) {
                    const formData = form.getValues();
                    onSubmit(formData, "submitted");
                  } else {
                    form.trigger();
                  }
                }}
              >
                <Check className="h-4 w-4 mr-1" /> {isSubmitting ? "Submitting..." : "Submit Report"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditVisitModal;
