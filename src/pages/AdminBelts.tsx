import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import BeltManager from "@/components/admin/BeltManager";

export default function AdminBelts() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) navigate("/login");
      else if (role && role !== "admin") navigate("/dashboard");
    }
  }, [user, role, loading, navigate]);

  if (loading || role !== "admin") {
    return <div className="theme-sober min-h-screen flex items-center justify-center bg-background text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="theme-sober min-h-screen bg-background px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold glow-text">Belt Changes</h1>
            <p className="text-muted-foreground font-body mt-1">Manage the belt structure — changes apply live</p>
          </div>
          <Link to="/admin" className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/70 rounded-lg font-body text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Admin
          </Link>
        </div>
        <BeltManager />
      </div>
    </div>
  );
}
