import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      setError("Username and password required");
      return;
    }
    setLoading(true);
    try {
      const { data: restricted } = await supabase.rpc("is_user_restricted", { _username: username.trim() });
      if (restricted === true) {
        setError("Your account has been restricted. Contact admin.");
        setLoading(false);
        return;
      }
      const { data: email, error: emailErr } = await supabase.rpc("get_email_by_username", {
        _username: username.trim(),
      });
      if (emailErr || !email) {
        setError("Invalid username or password");
        setLoading(false);
        return;
      }
      const { error: signErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signErr) {
        setError("Invalid username or password");
        setLoading(false);
        return;
      }
      toast.success("Welcome back!");
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", (await supabase.auth.getUser()).data.user!.id)
        .maybeSingle();
      navigate(roleData?.role === "admin" ? "/admin" : "/dashboard");
    } catch (e: any) {
      setError(e?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold glow-text mb-2">武道 BUSHIDO</h1>
          <p className="text-muted-foreground font-body">Welcome back, warrior</p>
        </div>
        <div className="glass-card p-8">
          <form onSubmit={handle} className="space-y-5">
            <div>
              <label className="text-sm text-muted-foreground font-body block mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2.5 text-foreground font-body focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground font-body block mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2.5 text-foreground font-body focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>
            {error && <p className="text-destructive text-sm font-body">{error}</p>}
            <button type="submit" disabled={loading} className="glow-button w-full disabled:opacity-50">
              {loading ? "Signing in..." : "Log In"}
            </button>
          </form>
          <div className="mt-6 text-center">
            <Link to="/signup" className="text-sm text-muted-foreground hover:text-foreground font-body">
              New warrior? Sign up
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
