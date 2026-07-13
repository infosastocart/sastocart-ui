import { useState, useEffect } from "react";
import { fetchCustomers, CustomerData } from "@/lib/api/customers";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, User, MapPin, Mail, Phone, ShoppingBag, Coins } from "lucide-react";

export const AdminCustomers = () => {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setIsLoading(true);
        const data = await fetchCustomers();
        setCustomers(data);
      } catch (error) {
        console.error("Failed to load customers", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCustomers();
  }, []);

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toLocaleString('en-IN')}`;
  };

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 min-h-[500px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2 text-stone-800">
          <span className="w-2 h-6 bg-orange-500 rounded-full" />
          Customers
        </h2>
        
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            type="search"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-stone-50 border-stone-200 focus-visible:ring-orange-500 rounded-lg h-10"
          />
        </div>
      </div>

      <div className="rounded-xl border border-stone-100 overflow-hidden">
        <Table>
          <TableHeader className="bg-stone-50">
            <TableRow className="border-stone-100">
              <TableHead className="text-stone-600 font-semibold py-4">Customer</TableHead>
              <TableHead className="text-stone-600 font-semibold py-4">Contact Info</TableHead>
              <TableHead className="text-stone-600 font-semibold py-4 hidden md:table-cell">Shipping Address</TableHead>
              <TableHead className="text-stone-600 font-semibold py-4 text-center">Orders</TableHead>
              <TableHead className="text-stone-600 font-semibold py-4 text-right">Total Spent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading Skeletons
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index} className="border-stone-100">
                  <TableCell className="py-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full bg-stone-200" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32 bg-stone-200" />
                        <Skeleton className="h-3 w-24 bg-stone-200" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40 bg-stone-200" />
                      <Skeleton className="h-3 w-28 bg-stone-200" />
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Skeleton className="h-4 w-48 bg-stone-200" />
                  </TableCell>
                  <TableCell className="text-center">
                    <Skeleton className="h-4 w-8 bg-stone-200 mx-auto" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-4 w-20 bg-stone-200 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredCustomers.length > 0 ? (
              // Real Data
              filteredCustomers.map((customer) => (
                <TableRow key={customer.user_id} className="border-stone-100 hover:bg-stone-50/50 transition-colors">
                  <TableCell className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-stone-800">{customer.name}</p>
                        <p className="text-xs text-stone-500 font-mono mt-0.5">ID: {customer.user_id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-sm text-stone-600">
                        <Mail className="h-3.5 w-3.5 text-stone-400" />
                        <span className="truncate max-w-[150px]" title={customer.email}>{customer.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-stone-600">
                        <Phone className="h-3.5 w-3.5 text-stone-400" />
                        <span>{customer.phone}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-start gap-1.5 text-sm text-stone-600 max-w-[250px]">
                      <MapPin className="h-3.5 w-3.5 text-stone-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2" title={customer.address}>{customer.address}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-100 text-stone-700 font-medium text-sm">
                      <ShoppingBag className="h-3.5 w-3.5" />
                      {customer.total_orders}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Coins className="h-3.5 w-3.5 text-orange-500" />
                      <span className="font-bold text-stone-800">{formatCurrency(customer.total_spent)}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              // Empty State
              <TableRow>
                <TableCell colSpan={5} className="py-16 text-center">
                  <div className="mx-auto w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4">
                    <User className="h-8 w-8 text-stone-400" />
                  </div>
                  <h3 className="text-lg font-bold text-stone-800">No customers found</h3>
                  <p className="text-stone-500 mt-1 max-w-sm mx-auto">
                    {searchQuery ? "We couldn't find any customers matching your search." : "When customers place orders, they will appear here automatically."}
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
