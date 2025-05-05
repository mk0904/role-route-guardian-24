import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Search, Plus, X, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  fetchBranches, 
  fetchBHs, 
  assignBranchToBH, 
  unassignBranchFromBH, 
  fetchBranchAssignments 
} from "@/services/zhService";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Branch = {
  id: string;
  name: string;
  location: string;
  category: string;
  bh_count: number;
};

type BHUser = {
  id: string;
  full_name: string;
  e_code: string;
  location: string;
  branches_assigned: number;
};

type BranchAssignment = {
  id: string;
  user_id: string;
  bh_name: string;
};

const ZHBranchMapping = () => {
  const { user } = useAuth();
  
  // Data states
  const [branches, setBranches] = useState<Branch[]>([]);
  const [bhUsers, setBHUsers] = useState<BHUser[]>([]);
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([]);
  const [branchAssignments, setBranchAssignments] = useState<Record<string, BranchAssignment[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  // Action states
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [selectedBHUser, setSelectedBHUser] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"assign" | "unassign">("assign");
  const [selectedBranchForUnassign, setSelectedBranchForUnassign] = useState<{
    branchId: string;
    branchName: string;
    bhUserId: string;
    bhName: string;
  } | null>(null);
  
  // Fetch data on component mount
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // Fetch branches and BH users in parallel
        const [branchesData, bhUsersData, allAssignmentsData] = await Promise.all([
          fetchBranches(user.id),
          fetchBHs(user.id),
          fetchBranchAssignments()
        ]);
        
        setBranches(branchesData);
        setFilteredBranches(branchesData);
        setBHUsers(bhUsersData);
        
        // Group assignments by branch ID
        const assignmentsMap: Record<string, BranchAssignment[]> = {};
        
        allAssignmentsData.forEach(assignment => {
          const branchId = assignment.branch_id;
          
          if (!assignmentsMap[branchId]) {
            assignmentsMap[branchId] = [];
          }
          
          assignmentsMap[branchId].push({
            id: assignment.id,
            user_id: assignment.user_id,
            bh_name: assignment.bh_name
          });
        });
        
        setBranchAssignments(assignmentsMap);
      } catch (error) {
        console.error("Error loading branch mapping data:", error);
        toast({
          variant: "destructive",
          title: "Error loading data",
          description: "Failed to load branch and BH data. Please try again."
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [user]);
  
  // Filter branches when filters change
  useEffect(() => {
    let filtered = [...branches];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        branch => branch.name.toLowerCase().includes(query) || 
                 branch.location.toLowerCase().includes(query)
      );
    }
    
    if (categoryFilter && categoryFilter !== "all") {
      filtered = filtered.filter(branch => branch.category === categoryFilter);
    }
    
    setFilteredBranches(filtered);
  }, [branches, searchQuery, categoryFilter]);
  
  const handleOpenAssignDialog = (branch: Branch) => {
    setSelectedBranch(branch);
    setSelectedBHUser(null);
    setDialogType("assign");
    setDialogOpen(true);
  };
  
  const handleOpenUnassignDialog = (branchId: string, branchName: string, bhUserId: string, bhName: string) => {
    setSelectedBranchForUnassign({
      branchId,
      branchName,
      bhUserId,
      bhName
    });
    setDialogType("unassign");
    setDialogOpen(true);
  };
  
  const handleUnassignBH = async () => {
    if (!selectedBranchForUnassign) return;
    
    const { branchId, bhUserId, branchName, bhName } = selectedBranchForUnassign;
    
    try {
      // First perform the database operation
      const result = await unassignBranchFromBH(bhUserId, branchId);
      
      if (result) {
        // Update the assignments in state
        setBranchAssignments(prev => {
          const updated = { ...prev };
          if (updated[branchId]) {
            updated[branchId] = updated[branchId].filter(
              assignment => assignment.user_id !== bhUserId
            );
            // Remove the branch entry if no assignments left
            if (updated[branchId].length === 0) {
              delete updated[branchId];
            }
          }
          return updated;
        });
        
        // Update branch count in branches list
        setBranches(prev => 
          prev.map(branch => 
            branch.id === branchId 
              ? { ...branch, bh_count: Math.max(0, branch.bh_count - 1) }
              : branch
          )
        );
        
        // Update BH user's assigned branches count
        setBHUsers(prev => 
          prev.map(user => 
            user.id === bhUserId 
              ? { ...user, branches_assigned: Math.max(0, user.branches_assigned - 1) }
              : user
          )
        );
        
        // Update filtered branches to reflect the changes
        setFilteredBranches(prev => 
          prev.map(branch => 
            branch.id === branchId 
              ? { ...branch, bh_count: Math.max(0, branch.bh_count - 1) }
              : branch
          )
        );
        
        toast({
          title: "BH Unassigned",
          description: `${bhName} has been unassigned from ${branchName}.`,
        });
      }
    } catch (error) {
      console.error("Error unassigning BH from branch:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to unassign BH from branch.",
      });
    }
  };
  
  const handleConfirmDialog = async () => {
    try {
      if (dialogType === "assign" && selectedBranch && selectedBHUser) {
        const result = await assignBranchToBH(selectedBHUser, selectedBranch.id);
        
        if (result) {
          // Find the BH name from the result or from the BHUsers list
          const bhUser = bhUsers.find(user => user.id === selectedBHUser);
          const bhName = result.bh_name || bhUser?.full_name || 'Unknown';
          
          // Update the assignments in state
          setBranchAssignments(prev => {
            const updated = { ...prev };
            if (!updated[selectedBranch.id]) {
              updated[selectedBranch.id] = [];
            }
            
            // Only add if it doesn't already exist
            const exists = updated[selectedBranch.id].some(
              assignment => assignment.user_id === selectedBHUser
            );
            
            if (!exists) {
              updated[selectedBranch.id].push({
                id: result.id || 'temp-' + Date.now(),
                user_id: selectedBHUser,
                bh_name: bhName
              });
            }
            
            return updated;
          });
          
          // Update branch count in branches list
          setBranches(prev => 
            prev.map(branch => 
              branch.id === selectedBranch.id 
                ? { ...branch, bh_count: (branch.bh_count || 0) + 1 }
                : branch
            )
          );
          
          // Update BH user's assigned branches count
          setBHUsers(prev => 
            prev.map(user => 
              user.id === selectedBHUser 
                ? { ...user, branches_assigned: (user.branches_assigned || 0) + 1 }
                : user
            )
          );
        }
      } else if (dialogType === "unassign" && selectedBranchForUnassign) {
        await handleUnassignBH();
      }
    } catch (error) {
      console.error("Error during branch assignment operation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to complete the operation. Please try again.",
      });
    } finally {
      setDialogOpen(false);
    }
  };
  
  // Function to format branch category names
  const formatCategoryName = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };
  
  // Get category color class based on the category
  const getCategoryColorClass = (category: string) => {
    switch(category) {
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
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full p-8">
        <div className="flex flex-col items-center">
          <div className="h-8 w-8 rounded-full border-4 border-t-blue-600 border-b-blue-600 border-r-transparent border-l-transparent animate-spin"></div>
          <p className="mt-4 text-sm text-slate-600">Loading branch data...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent mb-1 md:mb-1">Branch Mapping</h1>
        <p className="text-slate-600-">Assign branches to Branch Head Representatives (BHRs)</p>
      </div>
      
      <Card className="mb-6 hover:shadow-md transition-shadow">
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 h-4 w-4" />
              <Input
                placeholder="Search branches by name or location..."
                className="pl-9 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="flex items-center border-slate-200 rounded-lg bg-slate-50 hover:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="platinum">Platinum</SelectItem>
                  <SelectItem value="diamond">Diamond</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="bronze">Bronze</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Branch Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Assigned BHs</TableHead>
                  <TableHead className="text-right w-[100px] sticky right-0 bg-white z-10">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBranches.length > 0 ? (
                  filteredBranches.map((branch) => (
                    <TableRow key={branch.id}>
                      <TableCell className="font-medium">{branch.name}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1">
                          <MapPin className="inline-block h-4 w-4 text-slate-400" />
                          {branch.location}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColorClass(branch.category)}`}>
                          {formatCategoryName(branch.category)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {branchAssignments[branch.id] && branchAssignments[branch.id].length > 0 ? (
                            branchAssignments[branch.id].map((assignment, idx) => (
                              <Badge key={idx} variant="secondary" className="flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200">
                                {assignment.bh_name}
                                <button 
                                  className="ml-1 rounded-full hover:bg-slate-300 p-0.5"
                                  onClick={() => handleOpenUnassignDialog(
                                    branch.id, 
                                    branch.name, 
                                    assignment.user_id,
                                    assignment.bh_name
                                  )}
                                  aria-label={`Remove ${assignment.bh_name} from ${branch.name}`}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))
                          ) : (
                            <span className="text-slate-500 text-sm">No BHs assigned</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right sticky right-0 bg-white z-10">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleOpenAssignDialog(branch)}
                          className="bg-slate-100 hover:bg-slate-200"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span className="hidden md:inline ml-1">Assign</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                      {searchQuery || categoryFilter !== "all" ? 
                        "No branches match your search criteria" : 
                        "No branches available in your zone"
                      }
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Dialogs for assigning/unassigning */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md rounded-lg p-4">
          <div className="flex flex-col space-y-4">
          {dialogType === "assign" ? (
            <>
                <DialogHeader>
                  <DialogTitle>Assign Branch to BH</DialogTitle>
                  <DialogDescription>
                  Select a BH to assign to {selectedBranch?.name}
                  </DialogDescription>
                </DialogHeader>
                <Select value={selectedBHUser || ""} onValueChange={setSelectedBHUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a BH" />
                  </SelectTrigger>
                  <SelectContent>
                    {bhUsers.map((bhUser) => (
                      <SelectItem key={bhUser.id} value={bhUser.id}>
                        {bhUser.full_name} ({bhUser.e_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button onClick={handleConfirmDialog} disabled={!selectedBHUser} className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
                  Assign
                  </Button>
                  <Button variant="outline" onClick={() => setDialogOpen(false)} className="w-full sm:w-auto">Cancel</Button>
                </DialogFooter>
            </>
          ) : (
            <>
                <DialogHeader>
                  <DialogTitle>Unassign Branch</DialogTitle>
                  <DialogDescription>
                  Are you sure you want to unassign <span className="font-medium">{selectedBranchForUnassign?.branchName}</span> from <span className="font-medium">{selectedBranchForUnassign?.bhName}</span>?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button onClick={handleConfirmDialog} className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto">
                  <X className="mr-2 h-4 w-4" />
                  Unassign
                  </Button>
                  <Button variant="outline" onClick={() => setDialogOpen(false)} className="w-full sm:w-auto">Cancel</Button>
                </DialogFooter>
            </>
          )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ZHBranchMapping;
