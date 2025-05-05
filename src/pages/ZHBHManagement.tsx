import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchBHs } from "@/services/zhService";
import { fetchBHReportStats } from "@/services/reportService";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Eye, MapPin, User, FileText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BHDetailsModal from "@/components/zh/BHDetailsModal";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface BHUser {
  id: string;
  full_name: string;
  e_code: string;
  location: string;
  branches_assigned: number;
}

const ZHBHManagement = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBHId, setSelectedBHId] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState("all");
  const [locations, setLocations] = useState<string[]>([]);
  
  // Fetch BHs data
  const { data: bhUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['zh-bhs'],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const bhs = await fetchBHs(user.id);
      
      // Extract unique locations for filter dropdown
      const uniqueLocations = [...new Set(bhs.map(bh => bh.location).filter(Boolean))];
      setLocations(uniqueLocations as string[]);
      
      return bhs;
    },
    enabled: !!user?.id
  });

  // Filter BHs based on search query and location
  const filteredBHs = bhUsers.filter((bh) => {
    const matchesSearch = 
      !searchQuery || 
      bh.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      bh.e_code?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLocation = 
      locationFilter === "all" || 
      bh.location === locationFilter;
    
    return matchesSearch && matchesLocation;
  });

  // Get statistics for each BH
  const getBHStats = async (bhId: string) => {
    try {
      return await fetchBHReportStats(bhId);
    } catch (error) {
      console.error("Error fetching BH stats:", error);
      return { total: 0, approved: 0, submitted: 0, rejected: 0 };
    }
  };

  return (
    <div className="px-6 py-8 md:px-8 lg:px-10 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent mb-1">BH Management</h1>
        <p className="text-slate-600">
          View and manage Branch Head Representatives in your zone
        </p>
      </div>
      
      <Card className="mb-8 border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white rounded-xl overflow-hidden">
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" size={18} />
              <Input
                placeholder="Search by name or employee code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 transition-colors rounded-lg bg-slate-50 focus:bg-white"
              />
            </div>
            <div className="w-full md:w-60">
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="flex items-center border-slate-200 rounded-lg bg-slate-50 hover:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all">
                  <Filter className="h-4 w-4 mr-2 text-blue-500" />
                  <SelectValue placeholder="Filter by location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {usersLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-blue-500">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mb-4"></div>
          <span className="text-slate-600 font-medium">Loading representatives...</span>
        </div>
      ) : filteredBHs.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-center mb-4">
            <User className="h-16 w-16 text-slate-300" />
          </div>
          <h3 className="text-xl font-medium mb-2 text-slate-700">No BHs found</h3>
          <p className="text-slate-500 max-w-md mx-auto">No Branch Head Representatives match your current filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBHs.map((bh) => (
            <BHCard
              key={bh.id}
              bh={bh}
              onViewDetails={() => setSelectedBHId(bh.id)}
            />
          ))}
        </div>
      )}
      
      {/* BH Details Modal */}
      <BHDetailsModal
        bhId={selectedBHId}
        open={!!selectedBHId}
        onClose={() => setSelectedBHId(null)}
      />
    </div>
  );
};

// BH Card Component
interface BHCardProps {
  bh: BHUser;
  onViewDetails: () => void;
}

const getRandomAvatarColor = (name: string) => {
  const colors = [
    'from-blue-600 to-blue-400',
    'from-emerald-600 to-emerald-400',
    'from-violet-600 to-violet-400',
    'from-rose-600 to-rose-400',
    'from-amber-600 to-amber-400',
    'from-teal-600 to-teal-400',
    'from-indigo-600 to-indigo-400',
    'from-pink-600 to-pink-400',
    'from-cyan-600 to-cyan-400',
    'from-purple-600 to-purple-400'
  ];
  const charCode = (name?.charAt(0) || 'A').charCodeAt(0);
  const colorIndex = charCode % colors.length;
  return colors[colorIndex];
};

const BHCard = ({ bh, onViewDetails }: BHCardProps) => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['bh-stats', bh.id],
    queryFn: async () => await fetchBHReportStats(bh.id),
  });

  const avatarColor = getRandomAvatarColor(bh.full_name);

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border border-slate-100 shadow-sm rounded-xl bg-white">
      <CardContent className="p-0">
        <div className="p-5">
          {/* Header with Avatar, Name, and Location */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <Avatar className={`h-14 w-14 ring-2 ring-slate-100 bg-gradient-to-br ${avatarColor} text-white text-base shadow-sm`}>
                <AvatarFallback className={`bg-gradient-to-br ${avatarColor} text-base font-medium`}>
                  {(bh.full_name?.charAt(0) || 'B').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-base font-semibold text-slate-800 group-hover:text-slate-900 transition-colors">
                  {bh.full_name}
                </h3>
                <p className="text-sm text-slate-500">{bh.e_code || 'No Employee Code'}</p>
              </div>
            </div>
            {/* Location Badge - Moved to top right */}
            <div className="flex items-center text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
              <MapPin className="h-3.5 w-3.5 mr-1 text-slate-400" />
              <span className="text-xs">{bh.location || 'No location'}</span>
            </div>
          </div>
          
          {/* Main Stats */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-gradient-to-br from-slate-50 to-white p-3 rounded-lg border border-slate-100">
              <p className="text-xs text-slate-600 mb-1 flex items-center">
                <User className="h-3.5 w-3.5 mr-1 opacity-70" />
                Branches Mapped
              </p>
              <p className="text-2xl font-semibold text-slate-700">{bh.branches_assigned}</p>
            </div>
            <div className="bg-gradient-to-br from-sky-50 to-white p-3 rounded-lg border border-sky-100">
              <p className="text-xs text-sky-600 mb-1 flex items-center">
                <FileText className="h-3.5 w-3.5 mr-1 opacity-70" />
                Reports
              </p>
              <p className="text-2xl font-semibold text-sky-700">
                {isLoading ? "..." : stats?.total || 0}
              </p>
            </div>
          </div>
          
          {/* Report Status Grid */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            <div className="bg-gradient-to-br from-green-50 to-white p-2.5 rounded-lg text-center border border-teal-100/50">
              <p className="text-xs font-medium text-teal-700 mb-0.5">Approved</p>
              <p className="text-lg font-semibold text-teal-800">
                {isLoading ? "..." : stats?.approved || 0}
              </p>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-white p-2.5 rounded-lg text-center border border-yellow-100/50">
              <p className="text-xs font-medium text-yellow-700 mb-0.5">Pending</p>
              <p className="text-lg font-semibold text-yellow-800">
                {isLoading ? "..." : stats?.submitted || 0}
              </p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-white p-2.5 rounded-lg text-center border border-red-100/50">
              <p className="text-xs font-medium text-red-600 mb-0.5">Rejected</p>
              <p className="text-lg font-semibold text-red-700">
                {isLoading ? "..." : stats?.rejected || 0}
              </p>
            </div>
          </div>
          
          {/* View Details Button */}
          <Button 
            variant="outline" 
            onClick={onViewDetails} 
            className="w-full bg-white hover:bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300 text-sm font-medium transition-all duration-300"
          >
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ZHBHManagement;
