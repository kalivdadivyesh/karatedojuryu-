import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BELT_LEVELS = ["white", "yellow", "green", "blue", "black"];

interface Student {
  id: string;
  name: string;
  hex_id: string;
  belt_level: string;
}

export default function Admin() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      if (authLoading) return;
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: role, error } = await supabase.rpc("get_user_role", {
        _auth_id: user.id,
      });

      if (error || role !== "admin") {
        toast.error("Unauthorized access");
        navigate("/");
        return;
      }

      fetchStudents();
    }

    checkAdmin();
  }, [user, authLoading, navigate]);

  async function fetchStudents() {
    setIsLoading(true);
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");
    const adminIds = new Set((adminRoles || []).map((r) => r.user_id));

    const { data, error } = await supabase
      .from("users")
      .select("id, name, hex_id, belt_level");

    if (error) {
      toast.error("Failed to fetch students");
    } else {
      const filtered = (data || [])
        .filter((u) => !adminIds.has(u.id))
        .map((u) => ({
          id: u.id,
          name: u.name,
          hex_id: u.hex_id,
          belt_level: u.belt_level,
        }));
      setStudents(filtered);
    }
    setIsLoading(false);
  }

  async function updateBelt(studentId: string, newBelt: string) {
    const { error } = await supabase
      .from("users")
      .update({ belt_level: newBelt })
      .eq("id", studentId);

    if (error) {
      toast.error("Failed to update belt level");
    } else {
      toast.success("Belt level updated");
      fetchStudents();
    }
  }

  async function markAttendance(studentId: string, status: "present" | "absent") {
    const { error } = await supabase.from("attendance_records").insert({
      user_id: studentId,
      date: new Date().toISOString().split("T")[0],
      status: status,
    });

    if (error) {
      if (error.code === "23505") {
        toast.error("Attendance already marked for today");
      } else {
        toast.error("Failed to mark attendance");
      }
    } else {
      toast.success(`Attendance marked as ${status}`);
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground animate-pulse">Loading Admin Panel...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="font-display text-3xl font-bold glow-text">Admin Panel</h1>
            <p className="text-muted-foreground">Manage students, belts, and attendance</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </motion.div>

        <Card className="glass-card border-none">
          <CardHeader>
            <CardTitle className="text-xl font-display">Student List</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Belt Level</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell className="font-mono text-xs">{student.hex_id}</TableCell>
                    <TableCell>
                      <Select
                        defaultValue={student.belt_level.toLowerCase()}
                        onValueChange={(value) => updateBelt(student.id, value)}
                      >
                        <SelectTrigger className="w-[120px] capitalize">
                          <SelectValue placeholder="Select belt" />
                        </SelectTrigger>
                        <SelectContent>
                          {BELT_LEVELS.map((belt) => (
                            <SelectItem key={belt} value={belt} className="capitalize">
                              {belt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-green-500/10 hover:bg-green-500/20 text-green-500 border-green-500/20"
                          onClick={() => markAttendance(student.id, "present")}
                        >
                          ✅ Present
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/20"
                          onClick={() => markAttendance(student.id, "absent")}
                        >
                          ❌ Absent
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {students.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No students found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
