import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  Users, 
  Calendar, 
  Shield, 
  BarChart3, 
  MapPin,
  ArrowRight
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/auth");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="max-w-4xl w-full text-center space-y-8">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            Branch Visit Management System
          </h1>
          
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Streamline your branch visits, track performance, and manage branch health with our comprehensive platform
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center">
            <Button 
              size="lg"
              onClick={handleGetStarted}
              className="text-lg px-8 py-6 bg-blue-600 hover:bg-blue-700 group"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-16 max-w-6xl w-full">
          {[
            {
              icon: <Building2 className="h-8 w-8 text-blue-600" />,
              title: "Branch Management",
              description: "Efficiently manage branch visits with detailed tracking and reporting"
            },
            {
              icon: <Users className="h-8 w-8 text-blue-600" />,
              title: "Role-Based Access",
              description: "Different dashboards for Branch Heads, Zonal Heads, and Cluster Heads"
            },
            {
              icon: <BarChart3 className="h-8 w-8 text-blue-600" />,
              title: "Performance Analytics",
              description: "Track branch performance metrics and generate insights"
            }
              
          ].map((feature, i) => (
            <div 
              key={i}
              className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-3 text-slate-800">{feature.title}</h3>
              <p className="text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-20 bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-4xl w-full">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-slate-800">Ready to Transform Your Branch Management?</h2>
            <p className="text-slate-600">Join thousands of organizations using our platform to streamline their branch operations</p>
            <Button 
              size="lg"
              onClick={handleGetStarted}
              className="mt-4 bg-blue-600 hover:bg-blue-700"
            >
              Start Managing Your Branches
            </Button>
          </div>
        </div>
      </main>
      
      <footer className="py-8 border-t border-slate-200 bg-white mt-20">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} Branch Visit Management System. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Index;
