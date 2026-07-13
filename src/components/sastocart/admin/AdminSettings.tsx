import { UserProfile } from "@clerk/clerk-react";

export const AdminSettings = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-stone-800">Settings</h2>
        <p className="text-stone-500 mt-2">Manage your account preferences.</p>
      </div>

      <div className="w-full bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
        <UserProfile 
          appearance={{
            elements: {
              card: "shadow-none w-full border-none m-0",
              rootBox: "w-full"
            }
          }} 
        />
      </div>
    </div>
  );
};
