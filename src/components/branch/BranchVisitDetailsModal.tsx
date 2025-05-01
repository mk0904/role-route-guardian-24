
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Clock, Eye, CheckCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Database } from "@/integrations/supabase/types";

type BranchVisitWithBranch = Database["public"]["Tables"]["branch_visits"]["Row"] & {
  branches: {
    name: string;
    location: string;
    category: string;
  }
};

interface BranchVisitDetailsModalProps {
  visit: BranchVisitWithBranch | null;
  isOpen: boolean;
  onClose: () => void;
}

const BranchVisitDetailsModal = ({
  visit,
  isOpen,
  onClose
}: BranchVisitDetailsModalProps) => {
  if (!visit) return null;

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  // Get status badge properties
  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'draft':
        return { 
          label: 'Draft', 
          className: 'bg-slate-200 text-slate-800 hover:bg-slate-200',
          icon: <Clock className="h-3 w-3 mr-1" />
        };
      case 'submitted':
        return { 
          label: 'Submitted', 
          className: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
          icon: <Eye className="h-3 w-3 mr-1" />
        };
      case 'approved':
        return { 
          label: 'Approved', 
          className: 'bg-green-100 text-green-800 hover:bg-green-100',
          icon: <CheckCircle className="h-3 w-3 mr-1" />
        };
      default:
        return { 
          label: 'Unknown', 
          className: 'bg-gray-200 text-gray-800 hover:bg-gray-200',
          icon: null
        };
    }
  };

  const getCategoryName = (category: string | undefined) => {
    // Add null check to prevent calling charAt on undefined
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

  const statusBadge = getStatusBadge(visit.status);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center justify-between">
            <span>Branch Visit Details</span>
            <Badge className={statusBadge.className}>
              <span className="flex items-center">
                {statusBadge.icon}
                {statusBadge.label}
              </span>
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-2">
          <div className="flex flex-col md:flex-row gap-4 mb-6 items-start">
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{visit.branches?.name || 'Unknown Branch'}</h3>
              <p className="text-sm text-slate-500">{visit.branches?.location || 'Unknown Location'}</p>
            </div>
            <div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                visit.branches?.category === 'platinum' ? 'bg-violet-100 text-violet-700' : 
                visit.branches?.category === 'diamond' ? 'bg-blue-100 text-blue-700' :
                visit.branches?.category === 'gold' ? 'bg-amber-100 text-amber-700' :
                visit.branches?.category === 'silver' ? 'bg-slate-100 text-slate-700' :
                'bg-orange-100 text-orange-700'
              }`}>
                {getCategoryName(visit.branches?.category)}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-medium text-slate-500 mb-2">Visit Information</h3>
              <div className="bg-slate-50 rounded-md p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Visit Date</p>
                    <p className="text-sm font-medium">{formatDate(visit.visit_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">HR Connect Session</p>
                    <p className="text-sm font-medium">{visit.hr_connect_session ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-slate-500 mb-2">HR Connect Coverage</h3>
              <div className="bg-slate-50 rounded-md p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Total Employees Invited</p>
                    <p className="text-sm font-medium">{visit.total_employees_invited || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Total Participants</p>
                    <p className="text-sm font-medium">{visit.total_participants || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Coverage</p>
                    <p className="text-sm font-medium">
                      {visit.total_employees_invited && visit.total_participants ? 
                        Math.round((visit.total_participants / visit.total_employees_invited) * 100) + '%' : 
                        '0%'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-sm font-medium text-slate-500 mb-2">Branch Metrics</h3>
            <div className="bg-slate-50 rounded-md p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Manning %</p>
                  <p className="text-sm font-medium">{visit.manning_percentage || 0}%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Attrition %</p>
                  <p className="text-sm font-medium">{visit.attrition_percentage || 0}%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Non-Vendor %</p>
                  <p className="text-sm font-medium">{visit.non_vendor_percentage || 0}%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">ER %</p>
                  <p className="text-sm font-medium">{visit.er_percentage || 0}%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">CWT Cases</p>
                  <p className="text-sm font-medium">{visit.cwt_cases || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Performance Level</p>
                  <p className="text-sm font-medium">{visit.performance_level || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-sm font-medium text-slate-500 mb-2">Employee Coverage</h3>
            <div className="bg-slate-50 rounded-md p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                <div>
                  <h4 className="text-xs font-semibold mb-2">New Employees (0-6 months)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500">Total</p>
                      <p className="text-sm font-medium">{visit.new_employees_total || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Covered</p>
                      <p className="text-sm font-medium">{visit.new_employees_covered || 0}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-xs font-semibold mb-2">STAR Employees</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500">Total</p>
                      <p className="text-sm font-medium">{visit.star_employees_total || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Covered</p>
                      <p className="text-sm font-medium">{visit.star_employees_covered || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-base font-medium mb-2">Qualitative Assessment</h3>
            <div className="bg-slate-50 rounded-md p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-slate-500">Branch Culture</p>
                  <p className="text-sm font-medium">{getQualitativeLabel(visit.culture_branch)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Line Manager Behavior</p>
                  <p className="text-sm font-medium">{getQualitativeLabel(visit.line_manager_behavior)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Branch Hygiene</p>
                  <p className="text-sm font-medium">{getQualitativeLabel(visit.branch_hygiene)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Overall Discipline</p>
                  <p className="text-sm font-medium">{getQualitativeLabel(visit.overall_discipline)}</p>
                </div>
              </div>
            </div>
          </div>
          
          {visit.feedback && (
            <div className="mb-6">
              <h3 className="text-base font-medium mb-2">Overall Feedback</h3>
              <div className="bg-slate-50 rounded-md p-4">
                <p className="text-sm">{visit.feedback}</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end">
          <DialogClose asChild>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BranchVisitDetailsModal;
