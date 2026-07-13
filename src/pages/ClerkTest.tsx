import { useEffect, useState } from "react";
import { SignIn, SignUp } from "@clerk/clerk-react";
import { query } from "../lib/db";
import { Button } from "@/components/ui/button";

function ProductsTest() {
  const [products, setProducts] = useState<any[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        // Run raw SQL query to fetch products
        const result = await query("SELECT * FROM products LIMIT 5");
        setProducts(result.rows);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  if (loading) return <div className="mt-8 text-center">Testing Neon connection...</div>;
  
  return (
    <div className="w-full mt-12 p-6 border rounded-lg bg-card text-card-foreground shadow-sm">
      <h2 className="text-xl font-bold mb-4">Neon DB Connection Test</h2>
      {error ? (
        <div className="text-red-500 font-medium">Connection Error: {error}</div>
      ) : products.length === 0 ? (
        <p className="text-muted-foreground">Connection successful, but no products found in the database.</p>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-green-600 font-medium mb-2">Connection successful! Found {products.length} products:</p>
          <ul className="list-disc pl-5">
            {products.map((p, i) => (
              <li key={i} className="text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                {JSON.stringify(p)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function ClerkTest() {
  const [isSignIn, setIsSignIn] = useState(true);

  return (
    <div className="container mx-auto py-10 flex flex-col items-center gap-10">
      <h1 className="text-3xl font-bold">Clerk Authentication Test</h1>
      
      <div className="flex flex-col items-center gap-6 w-full max-w-xl">
        <Button 
          variant="outline" 
          onClick={() => setIsSignIn(!isSignIn)}
          className="font-bold border-2"
        >
          {isSignIn ? "Switch to Sign Up" : "Switch to Sign In"}
        </Button>

        <div className="flex flex-col items-center gap-4 w-full">
          <h2 className="text-2xl font-semibold">{isSignIn ? "Sign In" : "Sign Up"}</h2>
          {isSignIn ? (
            <SignIn routing="hash" />
          ) : (
            <SignUp routing="hash" />
          )}
        </div>
      </div>

      <ProductsTest />
    </div>
  );
}
