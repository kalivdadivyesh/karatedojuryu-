import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

interface StoredUser {
  name: string;
  age: number;
  password: string;
}

const STORAGE_KEY = "karate_users";
const SESSION_KEY = "karate_current_user";

function getUsers(): StoredUser[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

export default function Auth() {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isSignup && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (isSignup && (!name.trim() || !age || !password)) {
      setError("All fields are required");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const users = getUsers();
      const trimmed = name.trim();

      if (isSignup) {
        if (users.some((u) => u.name.toLowerCase() === trimmed.toLowerCase())) {
          setError("User with this name already exists");
          setLoading(false);
          return;
        }
        const newUser: StoredUser = { name: trimmed, age: parseInt(age), password };
        users.push(newUser);
        saveUsers(users);
        localStorage.setItem(SESSION_KEY, JSON.stringify({ name: trimmed, age: parseInt(age) }));
      } else {
        const found = users.find(
          (u) => u.name.toLowerCase() === trimmed.toLowerCase() && u.password === password
        );
        if (!found) {
          setError("Invalid name or password");
          setLoading(false);
          return;
        }
        localStorage.setItem(SESSION_KEY, JSON.stringify({ name: found.name, age: found.age }));
      }

      navigate("/");
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold glow-text mb-2">武道 BUSHIDO</h1>
          <p className="text-muted-foreground font-body">
            {isSignup ? "Create your warrior account" : "Welcome back, warrior"}
          </p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm text-muted-foreground font-body block mb-1.5">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2.5 text-foreground font-body focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Enter your name"
                required
              />
            </div>

            <AnimatePresence>
              {isSignup && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <label className="text-sm text-muted-foreground font-body block mb-1.5">Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2.5 text-foreground font-body focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Enter your age"
                    min={5}
                    max={100}
                    required={isSignup}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="text-sm text-muted-foreground font-body block mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2.5 text-foreground font-body focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Enter your password"
                required
              />
            </div>

            <AnimatePresence>
              {isSignup && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <label className="text-sm text-muted-foreground font-body block mb-1.5">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2.5 text-foreground font-body focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Confirm your password"
                    required={isSignup}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-destructive text-sm font-body"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="glow-button w-full text-center disabled:opacity-50"
            >
              {loading ? "Please wait..." : isSignup ? "Sign Up" : "Log In"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setIsSignup(!isSignup); setError(""); }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
            >
              {isSignup ? "Already have an account? Log In" : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
