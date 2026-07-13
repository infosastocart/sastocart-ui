import { useEffect, useState, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { query } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, Camera, Star, Wallet, Save, Loader2, MapPin, Plus, CheckCircle2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface Profile {
  full_name: string;
  email: string;
  phone: string;
  avatar_url: string;
}

const MyProfile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [points, setPoints] = useState(0);
  const [profile, setProfile] = useState<Profile>({
    full_name: "",
    email: "",
    phone: "",
    avatar_url: "",
  });
  const [addresses, setAddresses] = useState<any[]>([]);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [newAddress, setNewAddress] = useState({
    full_address: "",
    city: "",
    phone: "",
    is_default: false
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && user) {
      fetchProfileData();
      fetchAddresses();
    }
  }, [isLoaded, user]);

  const fetchAddresses = async () => {
    if (!user) return;
    try {
      const result = await query("SELECT * FROM user_addresses WHERE user_id = $1 ORDER BY is_default DESC", [user.id]);
      setAddresses(result.rows || []);
    } catch (err) {
      console.error("Error fetching addresses:", err);
    }
  };

  const fetchProfileData = async () => {
    try {
      if (!user) return;

      // 1. Fetch Profile
      const profileResult = await query("SELECT * FROM profiles WHERE id = $1", [user.id]);
      const profileData = profileResult.rows[0];

      // 2. Fetch Rewards
      const rewardsResult = await query("SELECT points FROM user_rewards WHERE user_id = $1", [user.id]);
      const rewardsData = rewardsResult.rows[0];

      if (profileData) {
        setProfile({
          full_name: profileData.full_name || "",
          email: profileData.email || user.primaryEmailAddress?.emailAddress || "",
          phone: profileData.phone || "",
          avatar_url: profileData.avatar_url || "",
        });
      } else {
        setProfile(prev => ({ ...prev, email: user.primaryEmailAddress?.emailAddress || "" }));
      }

      if (rewardsData) {
        setPoints(rewardsData.points);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setUploading(true);
    const file = event.target.files?.[0];
    if (!file) {
      setUploading(false);
      return;
    }

    try {
      if (!user) throw new Error("User session not found");

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        await query(
          "INSERT INTO profiles (id, avatar_url, email, full_name) VALUES ($2, $1, $3, $4) ON CONFLICT (id) DO UPDATE SET avatar_url = EXCLUDED.avatar_url",
          [base64String, user.id, user.primaryEmailAddress?.emailAddress || "", user.fullName || ""]
        );
        
        setProfile(prev => ({ ...prev, avatar_url: base64String }));
        toast.success("Avatar updated successfully!");
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error("AVATAR UPLOAD ERROR:", error);
      toast.error("Failed to upload image");
      setUploading(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!user) return;

      await query(
        "INSERT INTO user_addresses (user_id, full_address, city, phone, is_default) VALUES ($1, $2, $3, $4, $5)",
        [user.id, newAddress.full_address, newAddress.city, newAddress.phone, newAddress.is_default]
      );
      
      toast.success("Address added successfully!");
      setAddressModalOpen(false);
      setNewAddress({ full_address: "", city: "", phone: "", is_default: false });
      fetchAddresses();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      if (!user) {
        toast.error("No authenticated user found");
        throw new Error("No authenticated user found");
      }

      await query(
        "INSERT INTO profiles (id, full_name, phone, email) VALUES ($3, $1, $2, $4) ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone",
        [profile.full_name, profile.phone, user.id, user.primaryEmailAddress?.emailAddress || ""]
      );
      
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      console.error("Error in handleSaveProfile:", error);
      toast.error("Update failed: " + (error.message || "Database Error"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-muted/30">
      <main className="container max-w-4xl py-10 px-4 md:px-8">
        <div className="flex flex-col gap-8">
          
          {/* Rewards Wallet Card */}
          <Card className="overflow-hidden border-none shadow-xl bg-gradient-to-br from-primary to-orange-600 text-white transform transition-all hover:scale-[1.02]">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 opacity-80">
                    <Wallet className="h-4 w-4" />
                    <p className="text-xs font-black uppercase tracking-widest">Reward Points Balance</p>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black">{points}</span>
                    <span className="text-lg font-bold opacity-80">Points</span>
                  </div>
                  <p className="text-sm font-medium opacity-90 mt-4 bg-white/20 px-4 py-1.5 rounded-full inline-block">
                    ⭐ Collect 100 points for a special discount
                  </p>
                </div>
                <div className="h-24 w-24 bg-white/20 rounded-full flex items-center justify-center animate-pulse shadow-inner">
                  <Star className="h-12 w-12 fill-white text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Avatar Section */}
            <Card className="md:col-span-1 border-none shadow-lg rounded-3xl overflow-hidden bg-white">
              <CardContent className="p-8 flex flex-col items-center gap-6">
                <div className="relative group">
                  <div className="h-32 w-32 rounded-full border-4 border-primary/20 p-1 bg-white transition-transform group-hover:scale-105">
                    <Avatar className="h-full w-full">
                      <AvatarImage src={profile.avatar_url} className="object-cover" />
                      <AvatarFallback className="bg-muted text-2xl font-black text-muted-foreground uppercase">
                        {profile.full_name ? profile.full_name.charAt(0) : <User className="h-10 w-10" />}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    aria-label="Upload new avatar"
                    className="absolute bottom-0 right-0 h-10 w-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-orange-600 transition-all active:scale-90"
                  >
                    {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    aria-label="Profile picture upload"
                    onChange={handleAvatarUpload}
                  />
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-black text-brand-black truncate max-w-[200px]">
                    {profile.full_name || "New Explorer"}
                  </h2>
                  <p className="text-xs font-medium text-muted-foreground mt-1">{profile.email}</p>
                </div>
                <div className="w-full h-px bg-muted" />
                <p className="text-[10px] text-center uppercase font-black text-muted-foreground tracking-widest leading-relaxed">
                  Join Sastocart and start earning rewards on every delivery!
                </p>
              </CardContent>
            </Card>

            {/* Form Section */}
            <Card className="md:col-span-2 border-none shadow-lg rounded-3xl bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-black text-brand-black">Account Settings</CardTitle>
                <CardDescription className="text-sm font-medium">Update your profile information and how we can reach you.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-4">
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Full Name</Label>
                      <Input 
                        id="fullName" 
                        value={profile.full_name}
                        onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                        placeholder="John Doe"
                        className="rounded-xl border-muted bg-muted/20 focus:ring-primary h-12 font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Email Address</Label>
                      <Input 
                        id="email" 
                        value={profile.email}
                        disabled
                        className="rounded-xl border-muted bg-muted/40 cursor-not-allowed h-12 font-medium opacity-60"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Phone Number</Label>
                    <div className="relative">
                      <Input 
                        id="phone" 
                        value={profile.phone}
                        onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+977 9800000000"
                        className="rounded-xl border-muted bg-muted/20 focus:ring-primary h-12 pl-4 font-medium"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      disabled={saving}
                      className="w-full bg-orange-500 text-white hover:bg-orange-600 font-semibold py-6 rounded-2xl shadow-xl transition-all active:scale-95 gap-2"
                    >
                      {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                      Save Profile Changes
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Address Book Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-brand-black">Saved Addresses</h3>
                <p className="text-sm font-medium text-muted-foreground">Manage your shipping destinations for faster checkout.</p>
              </div>
              <Dialog open={addressModalOpen} onOpenChange={setAddressModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-orange-600 text-white font-black px-6 rounded-xl gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                    <Plus className="h-5 w-5" />
                    Add New Address
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-3xl border-none shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-black">New Shipping Address</DialogTitle>
                    <DialogDescription className="font-medium">Please provide accurate details to ensure smooth delivery.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddAddress} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Full Address</Label>
                      <Input 
                        placeholder="Street address, building, apartment"
                        value={newAddress.full_address}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, full_address: e.target.value }))}
                        className="rounded-xl h-12"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">City / District</Label>
                        <Input 
                          placeholder="e.g. Kathmandu"
                          value={newAddress.city}
                          onChange={(e) => setNewAddress(prev => ({ ...prev, city: e.target.value }))}
                          className="rounded-xl h-12"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Contact Phone</Label>
                        <Input 
                          placeholder="+977"
                          value={newAddress.phone}
                          onChange={(e) => setNewAddress(prev => ({ ...prev, phone: e.target.value }))}
                          className="rounded-xl h-12"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 pt-2">
                      <Checkbox 
                        id="default" 
                        checked={newAddress.is_default}
                        onCheckedChange={(checked) => setNewAddress(prev => ({ ...prev, is_default: !!checked }))}
                      />
                      <label 
                        htmlFor="default" 
                        className="text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Set as default address
                      </label>
                    </div>
                    <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-6 rounded-2xl mt-4 shadow-lg shadow-orange-200">
                      Save New Address
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {addresses.length === 0 ? (
                <Card className="sm:col-span-2 lg:col-span-3 border-2 border-dashed border-muted bg-transparent p-12 flex flex-col items-center justify-center text-center">
                  <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <MapPin className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                  <h4 className="text-lg font-black text-brand-black">No addresses saved</h4>
                  <p className="text-sm font-medium text-muted-foreground mt-1 max-w-[250px]">
                    Add your first address to enjoy a faster checkout experience.
                  </p>
                </Card>
              ) : (
                addresses.map((addr) => (
                  <Card key={addr.id} className={cn(
                    "relative border-2 transition-all hover:shadow-md rounded-3xl",
                    addr.is_default ? "border-primary bg-primary/[0.02]" : "border-muted bg-white"
                  )}>
                    <CardContent className="p-6">
                      {addr.is_default && (
                        <Badge className="absolute -top-3 left-4 bg-primary text-white font-black px-3 py-1 rounded-full uppercase text-[10px]">
                          Default
                        </Badge>
                      )}
                      <div className="flex items-start gap-4 pt-2">
                        <div className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                          addr.is_default ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                        )}>
                          <MapPin className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-black text-brand-black leading-tight">{addr.address_line1}</p>
                          <p className="text-xs font-bold text-muted-foreground">{addr.city}</p>
                        </div>
                      </div>
                      <div className="mt-6 pt-4 border-t border-muted flex items-center justify-between text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                        <span>Active Address</span>
                        {addr.is_default && <CheckCircle2 className="h-4 w-4 text-primary" />}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MyProfile;
