import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "next/router";
import { toast } from "@/components/ui/use-toast";
import { format, parseISO } from "date-fns";
import { CheckSquare, MapPin, UserPlus, Users, AlertTriangle } from "lucide-react";

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
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "@radix-ui/react-icons"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { YesNoToggle } from "@/components/ui/yes-no-toggle";

const NewVisit = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [visitDate, setVisitDate] = useState<Date | undefined>(new Date());
  const [hrConnectSession, setHrConnectSession] = useState<boolean | null>(null);
  const [totalEmployeesInvited, setTotalEmployeesInvited] = useState("");
  const [totalParticipants, setTotalParticipants] = useState("");
  const [manningPercentage, setManningPercentage] = useState("");
  const [attritionPercentage, setAttritionPercentage] = useState("");
  const [nonVendorPercentage, setNonVendorPercentage] = useState("");
  const [performanceLevel, setPerformanceLevel] = useState("");
  const [erPercentage, setErPercentage] = useState("");
  const [cwtCases, setCwtCases] = useState("");
  const [newEmployeesTotal, setNewEmployeesTotal] = useState("");
  const [newEmployeesCovered, setNewEmployeesCovered] = useState("");
  const [starEmployeesTotal, setStarEmployeesTotal] = useState("");
  const [starEmployeesCovered, setStarEmployeesCovered] = useState("");
  const [leadersAlignedWithCode, setLeadersAlignedWithCode] = useState<boolean | null>(null);
  const [employeesFeelSafe, setEmployeesFeelSafe] = useState<boolean | null>(null);
  const [employeesFeelMotivated, setEmployeesFeelMotivated] = useState<boolean | null>(null);
  const [leadersAbusiveLanguage, setLeadersAbusiveLanguage] = useState<boolean | null>(null);
  const [employeesComfortEscalation, setEmployeesComfortEscalation] = useState<boolean | null>(null);
  const [inclusiveCulture, setInclusiveCulture] = useState<boolean | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const { data, error } = await supabase.from("branches").select("*");
        if (error) throw error;
        setBranches(data);
      } catch (error) {
        console.error("Error fetching branches:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load branches.",
        });
      }
    };

    fetchBranches();
  }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("branch_visits").insert({
        user_id: user.id,
        branch_id: selectedBranch,
        visit_date: visitDate ? format(visitDate, "yyyy-MM-dd") : null,
        status: "draft",
        hr_connect_session: hrConnectSession,
        total_employees_invited: totalEmployeesInvited ? parseInt(totalEmployeesInvited) : null,
        total_participants: totalParticipants ? parseInt(totalParticipants) : null,
        manning_percentage: manningPercentage ? parseInt(manningPercentage) : null,
        attrition_percentage: attritionPercentage ? parseInt(attritionPercentage) : null,
        non_vendor_percentage: nonVendorPercentage ? parseInt(nonVendorPercentage) : null,
        performance_level: performanceLevel,
        er_percentage: erPercentage ? parseInt(erPercentage) : null,
        cwt_cases: cwtCases ? parseInt(cwtCases) : null,
        new_employees_total: newEmployeesTotal ? parseInt(newEmployeesTotal) : null,
        new_employees_covered: newEmployeesCovered ? parseInt(newEmployeesCovered) : null,
        star_employees_total: starEmployeesTotal ? parseInt(starEmployeesTotal) : null,
        star_employees_covered: starEmployeesCovered ? parseInt(starEmployeesCovered) : null,
        leaders_aligned_with_code: leadersAlignedWithCode === null ? null : leadersAlignedWithCode ? 'yes' : 'no',
        employees_feel_safe: employeesFeelSafe === null ? null : employeesFeelSafe ? 'yes' : 'no',
        employees_feel_motivated: employeesFeelMotivated === null ? null : employeesFeelMotivated ? 'yes' : 'no',
        leaders_abusive_language: leadersAbusiveLanguage === null ? null : leadersAbusiveLanguage ? 'yes' : 'no',
        employees_comfort_escalation: employeesComfortEscalation === null ? null : employeesComfortEscalation ? 'yes' : 'no',
        inclusive_culture: inclusiveCulture === null ? null : inclusiveCulture ? 'yes' : 'no',
        feedback: feedback,
      });

      if (error) throw error;

      toast({
        title: "Visit report created",
        description: "Your visit report has been created successfully.",
      });
      router.push("/MyVisits");
    } catch (error) {
      console.error("Error creating visit report:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create visit report.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">New Branch Visit Report</h1>
        <p className="text-slate-600 mt-1">
          Create a new report for a branch visit
        </p>
      </div>

      <Card className="mb-8">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="branch">Branch</Label>
              <Select
                value={selectedBranch}
                onValueChange={setSelectedBranch}
                required
              >
                <SelectTrigger id="branch">
                  <SelectValue placeholder="Select a branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch: any) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name} - {branch.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Visit Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !visitDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {visitDate ? format(visitDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={visitDate}
                    onSelect={setVisitDate}
                    disabled={(date) =>
                      date > new Date()
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>HR Connect Session Conducted?</Label>
              <YesNoToggle
                name="hrConnectSession"
                value={hrConnectSession}
                onChange={(value) => setHrConnectSession(value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="totalEmployeesInvited">Total Employees Invited</Label>
                <Input
                  type="number"
                  id="totalEmployeesInvited"
                  value={totalEmployeesInvited}
                  onChange={(e) => setTotalEmployeesInvited(e.target.value)}
                  placeholder="Enter total employees invited"
                />
              </div>

              <div>
                <Label htmlFor="totalParticipants">Total Participants</Label>
                <Input
                  type="number"
                  id="totalParticipants"
                  value={totalParticipants}
                  onChange={(e) => setTotalParticipants(e.target.value)}
                  placeholder="Enter total participants"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="manningPercentage">Manning Percentage</Label>
                <Input
                  type="number"
                  id="manningPercentage"
                  value={manningPercentage}
                  onChange={(e) => setManningPercentage(e.target.value)}
                  placeholder="Enter manning percentage"
                />
              </div>

              <div>
                <Label htmlFor="attritionPercentage">Attrition Percentage</Label>
                <Input
                  type="number"
                  id="attritionPercentage"
                  value={attritionPercentage}
                  onChange={(e) => setAttritionPercentage(e.target.value)}
                  placeholder="Enter attrition percentage"
                />
              </div>

              <div>
                <Label htmlFor="nonVendorPercentage">Non-Vendor Percentage</Label>
                <Input
                  type="number"
                  id="nonVendorPercentage"
                  value={nonVendorPercentage}
                  onChange={(e) => setNonVendorPercentage(e.target.value)}
                  placeholder="Enter non-vendor percentage"
                />
              </div>

              <div>
                <Label htmlFor="erPercentage">ER Percentage</Label>
                <Input
                  type="number"
                  id="erPercentage"
                  value={erPercentage}
                  onChange={(e) => setErPercentage(e.target.value)}
                  placeholder="Enter ER percentage"
                />
              </div>

              <div>
                <Label htmlFor="cwtCases">CWT Cases</Label>
                <Input
                  type="number"
                  id="cwtCases"
                  value={cwtCases}
                  onChange={(e) => setCwtCases(e.target.value)}
                  placeholder="Enter CWT cases"
                />
              </div>

              <div>
                <Label htmlFor="performanceLevel">Performance Level</Label>
                <Input
                  type="text"
                  id="performanceLevel"
                  value={performanceLevel}
                  onChange={(e) => setPerformanceLevel(e.target.value)}
                  placeholder="Enter performance level"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="newEmployeesTotal">New Employees (0-6 months) - Total</Label>
                <Input
                  type="number"
                  id="newEmployeesTotal"
                  value={newEmployeesTotal}
                  onChange={(e) => setNewEmployeesTotal(e.target.value)}
                  placeholder="Enter total new employees"
                />
              </div>

              <div>
                <Label htmlFor="newEmployeesCovered">New Employees (0-6 months) - Covered</Label>
                <Input
                  type="number"
                  id="newEmployeesCovered"
                  value={newEmployeesCovered}
                  onChange={(e) => setNewEmployeesCovered(e.target.value)}
                  placeholder="Enter new employees covered"
                />
              </div>

              <div>
                <Label htmlFor="starEmployeesTotal">STAR Employees - Total</Label>
                <Input
                  type="number"
                  id="starEmployeesTotal"
                  value={starEmployeesTotal}
                  onChange={(e) => setStarEmployeesTotal(e.target.value)}
                  placeholder="Enter total STAR employees"
                />
              </div>

              <div>
                <Label htmlFor="starEmployeesCovered">STAR Employees - Covered</Label>
                <Input
                  type="number"
                  id="starEmployeesCovered"
                  value={starEmployeesCovered}
                  onChange={(e) => setStarEmployeesCovered(e.target.value)}
                  placeholder="Enter STAR employees covered"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Leaders Aligned with Code</Label>
                <YesNoToggle
                  name="leadersAlignedWithCode"
                  value={leadersAlignedWithCode}
                  onChange={(value) => setLeadersAlignedWithCode(value)}
                />
              </div>

              <div>
                <Label>Employees Feel Safe</Label>
                <YesNoToggle
                  name="employeesFeelSafe"
                  value={employeesFeelSafe}
                  onChange={(value) => setEmployeesFeelSafe(value)}
                />
              </div>

              <div>
                <Label>Employees Feel Motivated</Label>
                <YesNoToggle
                  name="employeesFeelMotivated"
                  value={employeesFeelMotivated}
                  onChange={(value) => setEmployeesFeelMotivated(value)}
                />
              </div>

              <div>
                <Label>Leaders Use Abusive Language</Label>
                <YesNoToggle
                  name="leadersAbusiveLanguage"
                  value={leadersAbusiveLanguage}
                  onChange={(value) => setLeadersAbusiveLanguage(value)}
                  inverseColors={true}
                />
              </div>

              <div>
                <Label>Employees Comfortable with Escalation</Label>
                <YesNoToggle
                  name="employeesComfortEscalation"
                  value={employeesComfortEscalation}
                  onChange={(value) => setEmployeesComfortEscalation(value)}
                />
              </div>

              <div>
                <Label>Inclusive Culture</Label>
                <YesNoToggle
                  name="inclusiveCulture"
                  value={inclusiveCulture}
                  onChange={(value) => setInclusiveCulture(value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="feedback">Overall Feedback</Label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Enter overall feedback"
              />
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="rounded-full px-6 py-2 bg-primary hover:bg-primary/90 text-white"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⟳</span> 
                  Submitting...
                </>
              ) : (
                <>
                  <CheckSquare className="mr-2 h-4 w-4" />
                  Submit Visit Report
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewVisit;
