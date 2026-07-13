import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useAdminPermissions } from "@/hooks/useAdminPermissions";
import { Navigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@clerk/clerk-react";

export const AdminTeam = () => {
  const { role, isLoading: roleLoading } = useAdminPermissions();
  const { getToken } = useAuth();
  const [team, setTeam] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form State
  const [email, setEmail] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availablePermissions = [
    { id: "dashboard", label: "View Dashboard" },
    { id: "orders", label: "View Orders" },
    { id: "products", label: "Manage Products" },
    { id: "customers", label: "View Customers" },
    { id: "blog", label: "Manage Blog" },
  ];

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      const res = await fetch("/api/admin/team");
      if (res.ok) {
        const data = await res.json();
        setTeam(data);
      }
    } catch (error) {
      console.error("Failed to fetch team", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (targetEmail: string) => {
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/team", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ email: targetEmail })
      });
      if (res.ok) {
        toast.success("Sub-admin removed successfully");
        fetchTeam();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to remove sub-admin");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (checked) {
      setPermissions([...permissions, permissionId]);
    } else {
      setPermissions(permissions.filter((p) => p !== permissionId));
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter an email address");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, permissions }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || "Invitation sent successfully!");
        setEmail("");
        setPermissions([]);
        fetchTeam(); // Refresh team list
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to send invitation");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (roleLoading) {
    return <div>Loading...</div>;
  }

  // Double check authorization on component mount
  if (role !== "superadmin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div className="space-y-8 w-full max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2 text-stone-800">
          <span className="w-2 h-6 bg-orange-500 rounded-full" />
          Team Management
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Sub-Admins</CardTitle>
              <CardDescription>Manage access for your team members.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div>Loading team...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {team.map((member) => (
                      <TableRow key={member.id || member.email}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{member.name || "Pending"}</p>
                            <p className="text-sm text-stone-500">{member.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${member.role === 'superadmin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                            {member.role === 'superadmin' ? 'Super Admin' : 'Sub Admin'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {member.role === 'superadmin' ? (
                            <span className="text-sm text-stone-500">All Access</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {member.permissions?.map((p: string) => (
                                <span key={p} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-stone-100 text-stone-800">
                                  {p}
                                </span>
                              ))}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {member.role === 'subadmin' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="icon" variant="destructive" className="h-8 w-8">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove Sub-Admin</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to remove this sub-admin? This will immediately revoke their dashboard access.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => handleDelete(member.email)}>
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {team.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-stone-500">No team members found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Invite Sub-Admin</CardTitle>
              <CardDescription>Send an invitation to a new team member.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInvite} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium leading-none">Email Address</label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="colleague@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <label className="text-sm font-medium leading-none">Permissions</label>
                  {availablePermissions.map((permission) => (
                    <div key={permission.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={permission.id} 
                        checked={permissions.includes(permission.id)}
                        onCheckedChange={(checked) => handlePermissionChange(permission.id, checked as boolean)}
                      />
                      <label
                        htmlFor={permission.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {permission.label}
                      </label>
                    </div>
                  ))}
                </div>

                <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : "Send Invitation"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
