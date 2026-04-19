import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().trim().min(1, "Name required").max(100),
  username: z.string().trim().min(3, "Min 3 chars").max(30).regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, underscore only"),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().regex(/^[0-9]{10}$/, "Must be exactly 10 digits"),
  password: z.string().min(6, "Min 6 characters").max(72),
});

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", username: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.errors[0].message);
      return;
    }
    setLoading(true);
    try {
      const { error: signErr } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { name: form.name.trim(), username: form.username.trim(), phone: form.phone },
        },
      });
      if (signErr) throw signErr;
      toast.success("Account created!");
      navigate("/dashboard");
    } catch (e: any) {
      const msg = e?.message || "Signup failed";
      if (msg.includes("duplicate") || msg.includes("already")) {
        setError("Username or email already exists");
      } else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold glow-text mb-2">武道 BUSHIDO</h1>
          <p className="text-muted-foreground font-body">Begin your warrior journey</p>
        </div>
        <div className="glass-card p-8">
          <form onSubmit={handle} className="space-y-4">
            {(["name", "username", "email", "phone"] as const).map((f) => (
              <div key={f}>
                <label className="text-sm text-muted-foreground font-body block mb-1.5 capitalize">{f}</label>
                <input
                  type={f === "email" ? "email" : "text"}
                  value={form[f]}
                  onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                  className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2.5 text-foreground font-body focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>
            ))}
            <div>
              <label className="text-sm text-muted-foreground font-body block mb-1.5">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2.5 text-foreground font-body focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>
            {error && <p className="text-destructive text-sm font-body">{error}</p>}
            <button type="submit" disabled={loading} className="glow-button w-full disabled:opacity-50">
              {loading ? "Creating..." : "Sign Up"}
            </button>
          </form>
          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground font-body">
              Already a warrior? Log in
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
