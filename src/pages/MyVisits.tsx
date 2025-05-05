import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { Check, Clock, Edit, Eye, FileText, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BranchVisitDetailsModal from "@/components/branch/BranchVisitDetailsModal";
import EditVisitModal from "@/components/branch/EditVisitModal";
import { BranchVisitSummary } from "@/services/reportService";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const MyVisits = () => {
  const { user } = useAuth();
  const [visits, setVisits] = useState<BranchVisitSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState<BranchVisitSummary | null>(null);
  const [visitDetailsOpen, setVisitDetailsOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEditVisit, setSelectedEditVisit] = useState<BranchVisitSummary | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [visitToDelete, setVisitToDelete] = useState<BranchVisitSummary | null>(null);

  const fetchVisits = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("branch_visits")
        .select(`
          *,
          branches:branch_id (
            id,
            name,
            location,
            branch_code,
            category
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      
      setVisits(data || []);
    } catch (error) {
      console.error("Error fetching visit reports:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch your visit reports.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, [user]);

  const handleViewDetails = (visit: BranchVisitSummary) => {
    setSelectedVisit(visit);
    setVisitDetailsOpen(true);
  };
  
  const handleEditVisit = (visit: BranchVisitSummary) => {
    setSelectedEditVisit(visit);
    setEditModalOpen(true);
  };

  const handleDeleteVisit = (visit: BranchVisitSummary) => {
    setVisitToDelete(visit);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteVisit = async () => {
    if (!visitToDelete) return;
    
    try {
      const { error } = await supabase
        .from("branch_visits")
        .delete()
        .eq("id", visitToDelete.id);
        
      if (error) throw error;
      
      setVisits(visits.filter(visit => visit.id !== visitToDelete.id));
      toast({
        title: "Visit report deleted",
        description: "The visit report has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting visit report:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete the visit report.",
      });
    } finally {
      setVisitToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline" className="bg-slate-100 flex items-center gap-1 font-normal">
          <Clock className="h-3 w-3" />
          Draft
        </Badge>;
      case "submitted":
        return <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1 font-normal">
          <Eye className="h-3 w-3" />
          Submitted
        </Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800 flex items-center gap-1 font-normal">
          <Check className="h-3 w-3" />
          Approved
        </Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 flex items-center gap-1 font-normal">
          <Check className="h-3 w-3" />
          Rejected
        </Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "MMM d, yyyy");
    } catch (error) {
      return dateString;
    }
  };

  const getMonthFromDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "MMM yyyy");
    } catch (error) {
      return "";
    }
  };

  // Calculate coverage percentage
  const calculateCoverage = (visit: BranchVisitSummary) => {
    const invited = visit.total_employees_invited || 0;
    const participants = visit.total_participants || 0;
    if (invited === 0) return "0%";
    return `${Math.round((participants / invited) * 100)}%`;
  };

  // Filter visits based on search, status, month and category
  const filteredVisits = visits.filter(visit => {
    // Search filter - check branch name or location
    const searchMatch = 
      searchQuery === "" || 
      visit.branches?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      visit.branches?.location?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    const statusMatch = statusFilter === "all" || visit.status === statusFilter;
    
    // Month filter
    const monthMatch = monthFilter === "all" || 
      (visit.visit_date && getMonthFromDate(visit.visit_date) === monthFilter);
    
    // Category filter
    const categoryMatch = categoryFilter === "all" || 
      visit.branches?.category?.toLowerCase() === categoryFilter.toLowerCase();
    
    return searchMatch && statusMatch && monthMatch && categoryMatch;
  });

  // Get unique months from visits
  const uniqueMonths = Array.from(new Set(
    visits
      .map(visit => visit.visit_date ? getMonthFromDate(visit.visit_date) : null)
      .filter(Boolean) as string[]
  )).sort();

  // Get unique branch categories from visits
  const uniqueCategories = Array.from(new Set(
    visits
      .map(visit => visit.branches?.category || null)
      .filter(Boolean) as string[]
  )).sort();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Branch Visits</h1>
          <p className="text-slate-600 mt-1">View and manage your branch visit records</p>
        </div>
        <Button 
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-full px-6"
          onClick={() => window.location.href = "/bh/new-visit"}
        >
          <Plus className="h-4 w-4" />
          New Visit
        </Button>
      </div>

      <Card className="mb-8">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4">
            {/* Responsive Filters Row */}
            <div className="flex flex-col md:flex-row md:items-center md:gap-4 md:space-y-0 space-y-4">
              {/* Search (full width on mobile, auto on desktop) */}
              <div className="relative w-full md:w-1/3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <Input
                placeholder="Search by branch name, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
              {/* Dropdowns (side by side on mobile/desktop) */}
              <div className="flex flex-row gap-4 w-full md:w-2/3">
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {uniqueMonths.map(month => (
                    <SelectItem key={month} value={month}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {uniqueCategories.map(category => (
                    <SelectItem key={category} value={category}>{category.charAt(0).toUpperCase() + category.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              </div>
            </div>
            {/* Tabs Row (always in its own row, spaced between) */}
            <div className="flex flex-row w-full justify-between">
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

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filteredVisits.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border">
          <div className="inline-flex justify-center items-center rounded-full bg-blue-50 p-3 mb-4">
            <FileText className="h-10 w-10 text-blue-500" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No visit reports found</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            No branch visit reports match your current filters or you haven't created any yet.
          </p>
          <Button onClick={() => window.location.href = "/bh/new-visit"}>
            <Plus className="mr-2 h-4 w-4" />
            Create New Visit Report
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredVisits.map((visit) => (
            <Card key={visit.id} className={`hover:shadow-md transition-shadow border-l-4 ${
              visit.status === 'approved' ? 'border-l-green-500' : 
              visit.status === 'submitted' ? 'border-l-blue-500' : 
              visit.status === 'rejected' ? 'border-l-red-500' :
              'border-l-slate-300'
            }`}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold">
                    {visit.branches?.name || "Unknown Branch"}
                  </h3>
                  <div>{getStatusBadge(visit.status)}</div>
                </div>
                <p className="text-slate-600 mb-4">{visit.branches?.location}</p>
                
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-5">
                  <div>
                    <div className="text-sm text-slate-500">Visit Date</div>
                    <div className="font-medium">{formatDate(visit.visit_date)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">Category</div>
                    <div className="font-medium capitalize">{visit.branches?.category}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">HR Connect</div>
                    <div className="font-medium">{visit.hr_connect_session ? "Yes" : "No"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">Coverage</div>
                    <div className="font-medium">{calculateCoverage(visit)}</div>
                  </div>
                </div>
                
                <div className="flex gap-3 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleViewDetails(visit)}
                  >
                    <Eye className="h-4 w-4 mr-2" /> 
                    View Details
                  </Button>
                  
                  {visit.status === "draft" && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEditVisit(visit)}
                      >
                        <Edit className="h-4 w-4 mr-2" /> 
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteVisit(visit)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Details Modal */}
      <BranchVisitDetailsModal
        visit={selectedVisit}
        isOpen={visitDetailsOpen}
        onClose={() => {
          setVisitDetailsOpen(false);
          setSelectedVisit(null);
        }}
      />
      
      {/* Edit Visit Modal */}
      <EditVisitModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedEditVisit(null);
        }}
        visitData={selectedEditVisit}
        onUpdateSuccess={fetchVisits}
      />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Visit Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this visit report? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteVisit} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyVisits;
