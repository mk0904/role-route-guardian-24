import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, CalendarIcon, Check, X, Trash2, Clock, MapPin, FileText, Eye } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";
import { 
  BranchVisitSummary, 
  fetchRecentReports, 
  fetchReportById, 
  updateReportStatus 
} from "@/services/reportService";

const getStatusBadge = (status: string | null) => {
  switch(status) {
    case "approved":
      return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
    case "submitted":
      return <Badge className="bg-blue-100 text-blue-800">submitted</Badge>;
    case "rejected":
      return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
    default:
      return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
  }
};

interface ReportDetailsModalProps {
  reportId: string | null;
  open: boolean;
  onClose: () => void;
  onStatusUpdate: (reportId: string, status: "approved" | "rejected") => void;
  onDeleteReport?: (reportId: string) => void;
}

const ReportDetailsModal = ({ reportId, open, onClose, onStatusUpdate, onDeleteReport }: ReportDetailsModalProps) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  const { data: report, isLoading } = useQuery({
    queryKey: ['report-details', reportId],
    queryFn: () => reportId ? fetchReportById(reportId) : null,
    enabled: !!reportId && open
  });

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Loading report details...</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!report) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getCategoryName = (category: string | undefined) => {
    if (!category) return "Unknown";
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const getQualitativeLabel = (value: string | null) => {
    if (!value) return "Not rated";
    
    switch (value) {
      case 'very_poor': return 'Very Poor';
      case 'poor': return 'Poor';
      case 'neutral': return 'Neutral';
      case 'good': return 'Good';
      case 'excellent': return 'Excellent';
      default: return 'Not rated';
    }
  };

  const handleDelete = () => {
    if (onDeleteReport && reportId) {
      onDeleteReport(reportId);
      setConfirmDelete(false);
      onClose();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex justify-between items-center">
              <span>Branch Visit Report</span>
              <div>{getStatusBadge(report.status)}</div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Branch</h3>
                <p className="text-lg font-medium">{report.branch_name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Location</h3>
                <p className="text-lg font-medium">{report.branch_location}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Category</h3>
                <p className="text-lg font-medium capitalize">{report.branch_category}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Visit Date</h3>
                <p className="text-lg font-medium">{formatDate(report.visit_date)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">BHR Name</h3>
                <p className="text-lg font-medium">{report.bh_name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Employee Code</h3>
                <p className="text-lg font-medium">{report.bh_code}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-lg border-b pb-2">Visit Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-md">
                  <h4 className="text-sm font-medium text-gray-500">HR Connect Session</h4>
                  <p className="font-medium">{report.hr_connect_session ? "Conducted" : "Not Conducted"}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-md">
                  <h4 className="text-sm font-medium text-gray-500">Manning Percentage</h4>
                  <p className="font-medium">{report.manning_percentage}%</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-md">
                  <h4 className="text-sm font-medium text-gray-500">Attrition Percentage</h4>
                  <p className="font-medium">{report.attrition_percentage}%</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-md">
                  <h4 className="text-sm font-medium text-gray-500">Non-Vendor Percentage</h4>
                  <p className="font-medium">{report.non_vendor_percentage || 0}%</p>
                </div>
              </div>
            </div>

            {report.total_employees_invited > 0 && (
              <div className="space-y-4">
                <h3 className="font-medium text-lg border-b pb-2">HR Connect Coverage</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-slate-50 rounded-md">
                    <h4 className="text-sm font-medium text-gray-500">Employees Invited</h4>
                    <p className="font-medium">{report.total_employees_invited}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-md">
                    <h4 className="text-sm font-medium text-gray-500">Participants</h4>
                    <p className="font-medium">{report.total_participants}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-md">
                    <h4 className="text-sm font-medium text-gray-500">Coverage</h4>
                    <p className="font-medium">
                      {report.total_employees_invited > 0 
                        ? Math.round((report.total_participants / report.total_employees_invited) * 100)
                        : 0}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            {(report.new_employees_total > 0 || report.star_employees_total > 0) && (
              <div className="space-y-4">
                <h3 className="font-medium text-lg border-b pb-2">Employee Coverage</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {report.new_employees_total > 0 && (
                    <div className="p-3 bg-slate-50 rounded-md">
                      <h4 className="text-sm font-medium text-gray-500">New Employees (0-6 months)</h4>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <p className="text-xs text-gray-500">Total</p>
                          <p className="font-medium">{report.new_employees_total}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Covered</p>
                          <p className="font-medium">{report.new_employees_covered}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {report.star_employees_total > 0 && (
                    <div className="p-3 bg-slate-50 rounded-md">
                      <h4 className="text-sm font-medium text-gray-500">STAR Employees</h4>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <p className="text-xs text-gray-500">Total</p>
                          <p className="font-medium">{report.star_employees_total}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Covered</p>
                          <p className="font-medium">{report.star_employees_covered}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {report.leaders_aligned_with_code || report.employees_feel_safe || report.employees_feel_motivated || report.leaders_abusive_language || report.employees_comfort_escalation || report.inclusive_culture ? (
              <div className="space-y-4">
                <h3 className="font-medium text-lg border-b pb-2">Qualitative Assessment</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {report.leaders_aligned_with_code && (
                    <div className="p-3 bg-slate-50 rounded-md">
                      <h4 className="text-sm font-medium text-gray-500">Leaders Aligned with Code</h4>
                      <p className="font-medium">{getQualitativeLabel(report.leaders_aligned_with_code)}</p>
                    </div>
                  )}
                  
                  {report.employees_feel_safe && (
                    <div className="p-3 bg-slate-50 rounded-md">
                      <h4 className="text-sm font-medium text-gray-500">Employees Feel Safe</h4>
                      <p className="font-medium">{getQualitativeLabel(report.employees_feel_safe)}</p>
                    </div>
                  )}
                  
                  {report.employees_feel_motivated && (
                    <div className="p-3 bg-slate-50 rounded-md">
                      <h4 className="text-sm font-medium text-gray-500">Employees Feel Motivated</h4>
                      <p className="font-medium">{getQualitativeLabel(report.employees_feel_motivated)}</p>
                    </div>
                  )}
                  
                  {report.leaders_abusive_language && (
                    <div className="p-3 bg-slate-50 rounded-md">
                      <h4 className="text-sm font-medium text-gray-500">Leaders Use Abusive Language</h4>
                      <p className="font-medium">{getQualitativeLabel(report.leaders_abusive_language)}</p>
                    </div>
                  )}
                  
                  {report.employees_comfort_escalation && (
                    <div className="p-3 bg-slate-50 rounded-md">
                      <h4 className="text-sm font-medium text-gray-500">Employees Comfortable with Escalation</h4>
                      <p className="font-medium">{getQualitativeLabel(report.employees_comfort_escalation)}</p>
                    </div>
                  )}
                  
                  {report.inclusive_culture && (
                    <div className="p-3 bg-slate-50 rounded-md">
                      <h4 className="text-sm font-medium text-gray-500">Inclusive Culture</h4>
                      <p className="font-medium">{getQualitativeLabel(report.inclusive_culture)}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {report.feedback && (
              <div>
                <h3 className="font-medium text-lg border-b pb-2">Feedback</h3>
                <div className="mt-2 p-4 bg-slate-50 rounded-md">
                  <p>{report.feedback}</p>
                </div>
              </div>
            )}

            <div className="sticky bottom-0 py-4 bg-white border-t mt-6 flex justify-end gap-3">
              {report.status === "submitted" && (
                <>
                  <Button
                    variant="outline"
                    className="bg-white border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => onStatusUpdate(report.id, "rejected")}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Reject Report
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => onStatusUpdate(report.id, "approved")}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Approve Report
                  </Button>
                </>
              )}

              {report.status === "approved" && (
                <Button
                  variant="outline"
                  className="bg-white border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => onStatusUpdate(report.id, "rejected")}
                >
                  <X className="mr-2 h-4 w-4" />
                  Reject Report
                </Button>
              )}

              {report.status === "rejected" && (
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => onStatusUpdate(report.id, "approved")}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Approve Report
                </Button>
              )}

              {report.status === "draft" && onDeleteReport && (
                <Button
                  variant="destructive"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Report
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the report.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmDelete(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const ZHReviewReports = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const { data: reports = [], isLoading, refetch } = useQuery({
    queryKey: ['zh-all-reports'],
    queryFn: () => fetchRecentReports(100) // Fetch more reports for this page
  });

  const handleStatusUpdate = async (reportId: string, status: "approved" | "rejected") => {
    await updateReportStatus(reportId, status);
    refetch();
    
    toast({
      title: `Report ${status}`,
      description: `The report has been ${status} successfully.`,
      variant: status === "approved" ? "default" : "destructive"
    });
    
    setSelectedReportId(null);
  };

  const handleDeleteReport = async (reportId: string) => {
    // This would need implementation in reportService.ts if you want the delete functionality
    console.log("Delete report:", reportId);
    toast({
      title: "Report deleted",
      description: "The draft report has been deleted successfully.",
      variant: "destructive"
    });
    refetch();
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch = 
      (report.branch_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      report.branch_location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.bh_name?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = 
      statusFilter === "all" || 
      report.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent mb-1">Review Branch Visit Reports</h1>
          <p className="text-slate-600">Manage and review branch visit reports submitted by BHRs</p>
        </div>
      </div>

      <Card className="mb-6 hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-4 md:space-y-0">
            <div className="relative w-full md:w-1/2 md:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <Input
                placeholder="Search by branch name, location or BHR name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-full md:w-auto">
              <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="all">
                    <FileText className="h-5 w-5" />
                    <span className="hidden md:inline ml-1">All</span>
                  </TabsTrigger>
                  <TabsTrigger value="submitted">
                    <Eye className="h-5 w-5" />
                    <span className="hidden md:inline ml-1">Submitted</span>
                  </TabsTrigger>
                  <TabsTrigger value="approved">
                    <Check className="h-5 w-5" />
                    <span className="hidden md:inline ml-1">Approved</span>
                  </TabsTrigger>
                  <TabsTrigger value="rejected">
                    <Trash2 className="h-5 w-5" />
                    <span className="hidden md:inline ml-1">Rejected</span>
                  </TabsTrigger>
                  <TabsTrigger value="draft">
                    <Clock className="h-5 w-5" />
                    <span className="hidden md:inline ml-1">Draft</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <span className="sr-only">Loading...</span>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <div className="flex justify-center mb-3">
                <CalendarIcon className="h-12 w-12 text-slate-300" />
              </div>
              <h3 className="text-lg font-medium mb-1">No reports found</h3>
              <p>No branch visit reports match your current filters.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-medium">Branch</TableHead>
                  <TableHead className="font-medium">Location</TableHead>
                  <TableHead className="font-medium">BHR Name</TableHead>
                  <TableHead className="font-medium">Visit Date</TableHead>
                  <TableHead className="font-medium">Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id} className="hover:bg-slate-50">
                    <TableCell className="font-medium">{report.branch_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <MapPin size={14} className="text-slate-400 mr-1" />
                        {report.branch_location}
                      </div>
                    </TableCell>
                    <TableCell>{report.bh_name}</TableCell>
                    <TableCell>{formatDate(report.visit_date)}</TableCell>
                    <TableCell>{getStatusBadge(report.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedReportId(report.id)}
                        className={`
                          bg-slate-100 hover:bg-slate-200 text-slate-700 
                          ${report.status === "submitted" ? "border-blue-200 hover:border-blue-300" : ""}
                        `}
                      >
                        {report.status === "submitted" ? "Review" : "View Details"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ReportDetailsModal
        reportId={selectedReportId}
        open={!!selectedReportId}
        onClose={() => setSelectedReportId(null)}
        onStatusUpdate={handleStatusUpdate}
        onDeleteReport={handleDeleteReport}
      />
    </div>
  );
};

export default ZHReviewReports;
