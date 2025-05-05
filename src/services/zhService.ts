import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Database } from "@/integrations/supabase/types";

type Branch = Database['public']['Tables']['branches']['Row'];
type BranchWithAssignments = Branch & { bh_count: number };
type BHUser = Database['public']['Tables']['profiles']['Row'] & { 
  branches_assigned: number;
  visit_count?: number;
  coverage?: number;
};

type BranchVisit = Database['public']['Tables']['branch_visits']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

type BranchVisitWithDetails = {
  id: string;
  visit_date: string;
  status: string;
  branches: {
    name: string;
    location: string;
    category: string;
  };
  profiles: {
    full_name: string;
    e_code: string;
  };
};

export async function fetchBranches(userId: string): Promise<BranchWithAssignments[]> {
  try {
    // Get all branches with their assignments
    const { data: branches, error: branchError } = await supabase
      .from('branches')
      .select(`
        *,
        branch_assignments (
          user_id
        )
      `) as { data: (Branch & { branch_assignments: { user_id: string }[] })[] | null, error: any };

    if (branchError) {
      throw branchError;
    }

    if (!branches) {
      return [];
    }

    // Process the data to count BHs per branch
    const processedBranches = branches.map(branch => {
      // Count unique BHs for this branch
      const uniqueBhs = new Set();
      if (branch.branch_assignments) {
        branch.branch_assignments.forEach(assignment => {
          uniqueBhs.add(assignment.user_id);
        });
      }

      return {
        ...branch,
        bh_count: uniqueBhs.size
      };
    });

    return processedBranches;
  } catch (error: any) {
    console.error("Error fetching branches:", error);
    toast({
      variant: "destructive",
      title: "Error loading branches",
      description: error.message || "Unable to load branches"
    });
    return [];
  }
}

export async function fetchBHs(userId: string): Promise<BHUser[]> {
  try {
    // Get all BH users
    const { data: bhUsers, error: bhError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'BH') as { data: BHUser[] | null, error: any };

    if (bhError) {
      throw bhError;
    }

    if (!bhUsers || bhUsers.length === 0) {
      return [];
    }

    // Get branch assignments and visits for these users
    const bhUserIds = bhUsers.map(user => user.id);
    
    const { data: assignments, error: assignmentsError } = await supabase
      .from('branch_assignments')
      .select('user_id, branch_id')
      .in('user_id', bhUserIds);

    if (assignmentsError) {
      throw assignmentsError;
    }

    // Get current month's visits
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const { data: visits, error: visitsError } = await supabase
      .from('branch_visits')
      .select('user_id, branch_id')
      .in('user_id', bhUserIds)
      .in('status', ['submitted', 'approved'])
      .gte('visit_date', firstDayOfMonth.toISOString())
      .lte('visit_date', today.toISOString());

    if (visitsError) {
      throw visitsError;
    }

    // Group assignments and visits by user
    const assignmentsByUser: Record<string, Set<string>> = {};
    const visitsByUser: Record<string, Set<string>> = {};

    assignments?.forEach(assignment => {
      if (!assignmentsByUser[assignment.user_id]) {
        assignmentsByUser[assignment.user_id] = new Set();
      }
      assignmentsByUser[assignment.user_id].add(assignment.branch_id);
    });

    visits?.forEach(visit => {
      if (!visitsByUser[visit.user_id]) {
        visitsByUser[visit.user_id] = new Set();
      }
      visitsByUser[visit.user_id].add(visit.branch_id);
    });

    // Process the data to include branch counts and coverage
    const processedBHs = bhUsers.map(user => {
      const assignedBranches = assignmentsByUser[user.id] || new Set();
      const visitedBranches = visitsByUser[user.id] || new Set();
      
      return {
        ...user,
        branches_assigned: assignedBranches.size,
        visit_count: visitedBranches.size,
        coverage: assignedBranches.size > 0 ? 
          Math.round((visitedBranches.size / assignedBranches.size) * 100) : 0
      };
    });

    return processedBHs;
  } catch (error: any) {
    console.error("Error fetching BHs:", error);
    toast({
      variant: "destructive",
      title: "Error loading BHs",
      description: error.message || "Unable to load BHs"
    });
    return [];
  }
}

export async function fetchDashboardStats(userId: string) {
  try {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get total branches and BHs
    const { count: totalBranches } = await supabase
      .from('branches')
      .select('*', { count: 'exact', head: true });

    const { count: totalBHs } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'BH');
    
    // Get all BHs under this ZH
    const { data: bhs } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'BH');

    const bhUserIds = bhs?.map(bh => bh.id) || [];

    // Get all visits from BHs
    const { data: visits, error: visitsError } = await supabase
      .from('branch_visits')
      .select('user_id, branch_id, status, visit_date')
      .in('user_id', bhUserIds)
      .in('status', ['submitted', 'approved']);

    if (visitsError) {
      throw visitsError;
    }

    // Get submitted visits (no date filter)
    const { data: submittedVisits, error: submittedError } = await supabase
      .from('branch_visits')
      .select('id')
      .eq('status', 'submitted')
      .in('user_id', bhUserIds);

    if (submittedError) {
      throw submittedError;
    }

    // Calculate active BHs (BHs who have submitted visits this month)
    const activeUserIds = new Set(
      visits?.filter(v => {
        const visitDate = new Date(v.visit_date);
        return visitDate >= firstDayOfMonth && visitDate <= today;
      }).map(v => v.user_id) || []
    );
    const activeBHs = bhs?.filter(bh => activeUserIds.has(bh.id)) || [];

    // Calculate visited branches and other stats for this month
    const monthlyVisits = visits?.filter(v => {
      const visitDate = new Date(v.visit_date);
      return visitDate >= firstDayOfMonth && visitDate <= today;
    }) || [];
    const visitedBranches = new Set(monthlyVisits.map(v => v.branch_id));
    const totalsubmittedVisits = submittedVisits?.length || 0;

    return {
      totalBranches: totalBranches || 0,
      totalBHs: totalBHs || 0,
      activeBHs: activeBHs?.length || 0,
      visitedBranches: visitedBranches.size,
      coverage: totalBranches ? Math.round((visitedBranches.size / totalBranches) * 100) : 0,
      totalVisits: visits?.length || 0,
      submittedApproval: totalsubmittedVisits,
    };
  } catch (error: any) {
    console.error("Error fetching dashboard stats:", error);
    toast({
      variant: "destructive",
      title: "Error loading stats",
      description: error.message || "Unable to load dashboard statistics"
    });
    return {
      totalBranches: 0,
      totalBHs: 0,
      activeBHs: 0,
      visitedBranches: 0,
      coverage: 0,
      totalVisits: 0,
      submittedApproval: 0
    };
  }
}

export async function assignBranchToBH(bhUserId: string, branchId: string) {
  try {
    // Check if assignment already exists
    const { data: existingAssignment, error: checkError } = await supabase
      .from('branch_assignments')
      .select('id')
      .eq('user_id', bhUserId)
      .eq('branch_id', branchId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingAssignment) {
      toast({
        variant: "destructive",
        title: "Assignment already exists",
        description: "This branch is already assigned to this BH."
      });
      return null;
    }

    // Create new assignment
    const { data, error } = await supabase
      .from('branch_assignments')
      .insert({
        user_id: bhUserId,
        branch_id: branchId
      })
      .select();

    if (error) {
      throw error;
    }

    // Get BH name
    const { data: bhData, error: bhError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', bhUserId)
      .single();

    if (bhError) {
      throw bhError;
    }

    toast({
      title: "Branch assigned successfully",
      description: "The branch has been assigned to the BH."
    });

    return {
      ...data[0],
      bh_name: bhData?.full_name || 'Unknown',
      user_id: bhUserId
    };
  } catch (error: any) {
    console.error("Error assigning branch to BH:", error);
    
    let errorMessage = "An unexpected error occurred.";
    if (error.code === '23505') {
      errorMessage = "This branch is already assigned to this BH.";
    } else if (error.message) {
      errorMessage = error.message;
    }

    toast({
      variant: "destructive",
      title: "Failed to assign branch",
      description: errorMessage
    });
    throw error;
  }
}

export async function unassignBranchFromBH(bhUserId: string, branchId: string) {
  try {
    // First, verify the assignment exists and get its ID
    const { data: assignment, error: checkError } = await supabase
      .from('branch_assignments')
      .select('id')
      .eq('user_id', bhUserId)
      .eq('branch_id', branchId)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        // No assignment found
        toast({
          variant: "destructive",
          title: "Assignment not found",
          description: "This branch assignment does not exist."
        });
        return null;
      }
      throw checkError;
    }

    if (!assignment) {
      toast({
        variant: "destructive",
        title: "Assignment not found",
        description: "This branch assignment does not exist."
      });
      return null;
    }

    // Delete the assignment using the ID
    const { error: deleteError } = await supabase
      .from('branch_assignments')
      .delete()
      .eq('id', assignment.id);

    if (deleteError) {
      if (deleteError.code === '23503') {
        // Foreign key violation
        toast({
          variant: "destructive",
          title: "Cannot remove assignment",
          description: "This assignment cannot be removed due to existing dependencies."
        });
        return null;
      }
      throw deleteError;
    }

    toast({
      title: "Assignment removed",
      description: "The branch assignment has been removed."
    });

    return { user_id: bhUserId, branch_id: branchId };
  } catch (error: any) {
    console.error("Error removing branch assignment:", error);
    toast({
      variant: "destructive",
      title: "Failed to remove assignment",
      description: error.message || "An unexpected error occurred."
    });
    throw error;
  }
}

export async function fetchBranchAssignments() {
  try {
    const { data, error } = await supabase
      .from('branch_assignments')
      .select(`
        id,
        branch_id,
        user_id,
        profiles:user_id (
          full_name,
          e_code
        )
      `) as { data: { id: string; branch_id: string; user_id: string; profiles: Profile }[] | null, error: any };

    if (error) {
      throw error;
    }

    if (!data) {
      return [];
    }

    // Transform the data to include the BH name directly
    return data.map(assignment => ({
      id: assignment.id,
      branch_id: assignment.branch_id,
      user_id: assignment.user_id,
      bh_name: assignment.profiles?.full_name || 'Unknown',
      e_code: assignment.profiles?.e_code
    }));
  } catch (error: any) {
    console.error("Error fetching branch assignments:", error);
    toast({
      variant: "destructive",
      title: "Error loading assignments",
      description: error.message || "Unable to load branch assignments"
    });
    return [];
  }
}

export async function fetchRecentVisits(limit: number = 5) {
  try {
    // First get the visits
    const { data: rawVisits, error } = await supabase
      .from('branch_visits')
      .select(`
        id,
        branch_id,
        user_id,
        visit_date,
        status,
        branches:branch_id (
          name,
          location,
          category
        ),
        profiles:user_id (
          full_name,
          e_code
        )
      `)
      .order('visit_date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    if (!rawVisits?.length) return [];

    if (error) throw error;
    if (!rawVisits?.length) return [];
    
    return rawVisits.map(visit => ({
      id: visit.id,
      visit_date: visit.visit_date,
      status: visit.status,
      branch_name: visit.branches?.name || 'Unknown',
      branch_location: visit.branches?.location || 'Unknown',
      branch_category: visit.branches?.category || 'Unknown',
      bh_name: visit.profiles?.full_name || 'Unknown',
      bh_code: visit.profiles?.e_code || 'Unknown'
    }));
  } catch (error: any) {
    console.error("Error fetching recent visits:", error);
    toast({
      variant: "destructive",
      title: "Error loading visits",
      description: error.message || "Unable to load recent visits"
    });
    return [];
  }
}

export async function fetchVisitById(visitId: string) {
  try {
    // Get the visit first
    const { data: visit, error } = await supabase
      .from('branch_visits')
      .select('*')
      .eq('id', visitId)
      .single();

    if (error || !visit) {
      throw error || new Error("Visit not found");
    }

    // Get branch details
    const { data: branch } = await supabase
      .from('branches')
      .select('*')
      .eq('id', visit.branch_id)
      .single();

    // Get BH details
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, e_code')
      .eq('id', visit.user_id)
      .single();

    return {
      ...visit,
      branch_name: branch?.name || 'Unknown',
      branch_location: branch?.location || 'Unknown',
      branch_category: branch?.category || 'Unknown',
      bh_name: profile?.full_name || 'Unknown',
      bh_code: profile?.e_code || 'Unknown'
    };
  } catch (error: any) {
    console.error("Error fetching visit details:", error);
    toast({
      variant: "destructive",
      title: "Error loading visit",
      description: error.message || "Unable to load visit details"
    });
    return null;
  }
}
