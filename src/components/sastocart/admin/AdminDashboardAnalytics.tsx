import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Coins, ClipboardList, Users, ArrowUpRight, ArrowDownRight, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth, useUser } from "@clerk/clerk-react";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis
} from "recharts";
import { fetchDashboardMetrics, DashboardMetrics } from "@/lib/api/dashboard";

const COLORS = ["#f97316", "#fdba74", "#ffedd5", "#fed7aa", "#ffc299"];



export const AdminDashboardAnalytics = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dynamic UI States
  const [recentReturns, setRecentReturns] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [activeUsers, setActiveUsers] = useState<number>(0);
  
  // Growth Metrics
  const [salesGrowth, setSalesGrowth] = useState<number>(0);
  const [ordersGrowth, setOrdersGrowth] = useState<number>(0);
  const [customersGrowth, setCustomersGrowth] = useState<number>(0);
  
  // Target Metrics
  const [targetAmount, setTargetAmount] = useState<number>(600000);
  const [newTargetValue, setNewTargetValue] = useState<string>("600000");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdatingTarget, setIsUpdatingTarget] = useState(false);
  
  const { user } = useUser();
  const { getToken } = useAuth();
  const isSuperAdmin = user?.primaryEmailAddress?.emailAddress === 'info.sastocart@gmail.com';

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchDashboardMetrics();
        setMetrics(data);

        // Fetch dynamic target
        const res = await fetch("/api/admin/target");
        if (res.ok) {
          const targetData = await res.json();
          setTargetAmount(targetData.target);
          setNewTargetValue(targetData.target.toString());
        }
      } catch (error) {
        console.error("Failed to load dashboard metrics", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  if (isLoading || !metrics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-[140px] w-full rounded-xl bg-stone-200" />
          <Skeleton className="h-[140px] w-full rounded-xl bg-stone-200" />
          <Skeleton className="h-[140px] w-full rounded-xl bg-stone-200" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Skeleton className="col-span-1 lg:col-span-2 h-[320px] rounded-xl bg-stone-200" />
          <Skeleton className="col-span-1 h-[320px] rounded-xl bg-stone-200" />
          <Skeleton className="col-span-1 h-[320px] rounded-xl bg-stone-200" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="col-span-1 h-[400px] rounded-xl bg-stone-200" />
          <Skeleton className="col-span-1 lg:col-span-2 h-[400px] rounded-xl bg-stone-200" />
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toLocaleString('en-IN')}`;
  };

  const handleUpdateTarget = async () => {
    try {
      setIsUpdatingTarget(true);
      const token = await getToken();
      const res = await fetch("/api/admin/target", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ target: Number(newTargetValue) })
      });
      if (res.ok) {
        const data = await res.json();
        setTargetAmount(data.target);
        setIsDialogOpen(false);
        toast.success("Monthly target updated successfully!");
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to update target");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsUpdatingTarget(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-stone-100 shadow-sm rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-stone-500">Total Sales</p>
                <h3 className="text-3xl font-bold text-stone-800 mt-2">{formatCurrency(metrics.totalSales)}</h3>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-500">
                <Coins className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className={`flex items-center font-semibold ${salesGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {salesGrowth >= 0 ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
                {salesGrowth > 0 ? '+' : ''}{salesGrowth.toFixed(2)}%
              </span>
              <span className="text-stone-400 ml-2">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-100 shadow-sm rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-stone-500">Total Orders</p>
                <h3 className="text-3xl font-bold text-stone-800 mt-2">{metrics.totalOrders.toLocaleString()}</h3>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-500">
                <ClipboardList className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className={`flex items-center font-semibold ${ordersGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {ordersGrowth >= 0 ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
                {ordersGrowth > 0 ? '+' : ''}{ordersGrowth.toFixed(2)}%
              </span>
              <span className="text-stone-400 ml-2">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-100 shadow-sm rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-stone-500">Total Customers</p>
                <h3 className="text-3xl font-bold text-stone-800 mt-2">{metrics.totalCustomers.toLocaleString()}</h3>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-500">
                <Users className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className={`flex items-center font-semibold ${customersGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {customersGrowth >= 0 ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
                {customersGrowth > 0 ? '+' : ''}{customersGrowth.toFixed(2)}%
              </span>
              <span className="text-stone-400 ml-2">from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="col-span-1 lg:col-span-2 border-stone-100 shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-stone-800">Revenue Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              {metrics.revenueAnalytics.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics.revenueAnalytics} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#a8a29e", fontSize: 12 }} dy={10} />
                    <Tooltip 
                      contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                      formatter={(value: number, name: string) => [name === 'revenue' ? formatCurrency(value) : value, name]}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="orders" stroke="#f97316" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-sm text-stone-400">
                  <p className="font-medium text-stone-500 mb-1">No Revenue Data</p>
                  <p>Rs. 0</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 border-stone-100 shadow-sm rounded-xl flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-lg font-bold text-stone-800">Monthly Target</CardTitle>
            {isSuperAdmin && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-stone-400 hover:text-orange-500">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Update Monthly Target</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="target" className="text-sm font-medium">New Target Amount (Rs.)</label>
                      <Input
                        id="target"
                        type="number"
                        value={newTargetValue}
                        onChange={(e) => setNewTargetValue(e.target.value)}
                        placeholder="600000"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleUpdateTarget} disabled={isUpdatingTarget} className="bg-orange-500 hover:bg-orange-600">
                      {isUpdatingTarget ? "Saving..." : "Save Target"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center pt-0">
            <div className="h-[180px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart 
                  cx="50%" 
                  cy="100%" 
                  innerRadius="80%" 
                  outerRadius="100%" 
                  barSize={15} 
                  data={[{ name: "Target", value: Math.min((metrics.totalSales / targetAmount) * 100, 100) || 0, fill: "#f97316" }]}
                  startAngle={180}
                  endAngle={0}
                >
                  <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                  <RadialBar background={{ fill: '#ffedd5' }} dataKey="value" cornerRadius={10} />
                  <text x="50%" y="85%" textAnchor="middle" dominantBaseline="middle" className="text-4xl font-bold fill-stone-800">
                    {Math.round((metrics.totalSales / targetAmount) * 100) || 0}%
                  </text>
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center mt-6">
              <p className="text-sm font-bold text-stone-800">{metrics.totalSales >= targetAmount ? 'Goal Reached!' : 'Keep Going!'}</p>
              <p className="text-xs text-stone-500 mt-1">Target: {formatCurrency(targetAmount)} | Revenue: {formatCurrency(metrics.totalSales)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 border-stone-100 shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-stone-800">Top Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[160px] w-full">
              {metrics.topCategories.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics.topCategories}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {metrics.topCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm text-stone-400">
                  No data available
                </div>
              )}
            </div>
            <div className="mt-4 space-y-3">
              {metrics.topCategories.slice(0, 3).map((cat, i) => (
                <div key={cat.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                    <span className="text-stone-600 truncate max-w-[100px]">{cat.name}</span>
                  </div>
                  <span className="font-semibold text-stone-800">{formatCurrency(cat.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 border-stone-100 shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-stone-800">Active Users</CardTitle>
            <div className="mt-1">
              <span className="text-3xl font-bold text-stone-800">{activeUsers.toLocaleString()}</span>
              <span className="text-sm text-stone-500 ml-2">Currently online</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-5 mt-4">
              {countries.length > 0 ? (
                countries.map((country) => (
                  <div key={country.name} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-stone-700">{country.name}</span>
                      <span className="text-stone-500">{country.percent}%</span>
                    </div>
                    <Progress value={country.percent} className="h-2 bg-orange-100" indicatorClassName="bg-orange-500" />
                  </div>
                ))
              ) : (
                <div className="text-center text-sm text-stone-400 py-8">
                  No active users available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-2 border-stone-100 shadow-sm rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-bold text-stone-800">Recent Return Requests</CardTitle>
            <Button variant="outline" size="sm" className="text-stone-600 border-stone-200">View All</Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-stone-100">
                  <TableHead className="text-stone-500 font-medium">Order ID</TableHead>
                  <TableHead className="text-stone-500 font-medium">Date</TableHead>
                  <TableHead className="text-stone-500 font-medium">Customer</TableHead>
                  <TableHead className="text-stone-500 font-medium text-right">Amount</TableHead>
                  <TableHead className="text-stone-500 font-medium text-right">Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentReturns.length > 0 ? (
                  recentReturns.map((req) => (
                    <TableRow key={req.id} className="border-stone-100">
                      <TableCell className="font-medium text-stone-800">{req.id}</TableCell>
                      <TableCell className="text-stone-500">{req.date}</TableCell>
                      <TableCell className="text-stone-800">{req.customer}</TableCell>
                      <TableCell className="text-right font-medium text-stone-800">{req.amount}</TableCell>
                      <TableCell className="text-right">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          req.status === 'Approved' ? 'bg-green-100 text-green-700' :
                          req.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {req.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="text-orange-500 hover:text-orange-600 hover:bg-orange-50">Details</Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-stone-400">
                      No return requests available
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
};
