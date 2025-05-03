
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { Check, Clock, Edit, Eye } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import BranchVisitDetailsModal from "@/components/branch/BranchVisitDetailsModal";
import EditVisitModal from "@/components/branch/EditVisitModal";
import { BranchVisitSummary } from "@/services/reportService";

const MyVisits = () => {
  const { user } = useAuth();
  const [visits, setVisits] = useState<BranchVisitSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState<BranchVisitSummary | null>(null);
  const [visitDetailsOpen, setVisitDetailsOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEditVisit, setSelectedEditVisit] = useState<BranchVisitSummary | null>(null);

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

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline" className="bg-slate-100">
          <Clock className="h-3 w-3 mr-1" />
          Draft
        </Badge>;
      case "submitted":
        return <Badge className="bg-blue-100 text-blue-800">
          <Eye className="h-3 w-3 mr-1" />
          Submitted
        </Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800">
          <Check className="h-3 w-3 mr-1" />
          Approved
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

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">My Visit Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : visits.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No visit reports found.</p>
              <Button className="mt-4" variant="outline" onClick={() => window.location.href = "/bh/new-visit"}>
                Create New Visit Report
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Branch</TableHead>
                    <TableHead>Visit Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visits.map((visit) => (
                    <TableRow key={visit.id}>
                      <TableCell className="font-medium">
                        {visit.branches?.name || "Unknown Branch"}
                      </TableCell>
                      <TableCell>{formatDate(visit.visit_date)}</TableCell>
                      <TableCell>{getStatusBadge(visit.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(visit)}
                          >
                            <Eye className="h-4 w-4 mr-1" /> View
                          </Button>
                          
                          {visit.status === "draft" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditVisit(visit)}
                            >
                              <Edit className="h-4 w-4 mr-1" /> Edit
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

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
    </div>
  );
};

export default MyVisits;
