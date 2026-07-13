import { FileText } from "lucide-react";

const TermsOfService = () => {
  return (
    <div className="bg-muted/30 min-h-screen">
      <main className="container max-w-4xl py-16 px-4">
        <div className="bg-white rounded-3xl border-2 border-brand-black/5 p-8 md:p-12 shadow-sm">
          <div className="flex items-center gap-3 text-primary mb-6">
            <FileText className="h-8 w-8" />
            <h1 className="text-3xl font-black text-brand-black tracking-tight uppercase">Terms of Service</h1>
          </div>
          
          <p className="text-muted-foreground mb-8 font-medium">
            Last Updated: May 14, 2026
          </p>

          <div className="space-y-8 prose prose-slate max-w-none">
            <section>
              <h2 className="text-xl font-black text-brand-black mb-4">1. Agreement to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing or using Sastocart, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-brand-black mb-4">2. User Accounts</h2>
              <p className="text-gray-700 leading-relaxed mb-4">When you create an account with us, you must provide accurate and complete information. You are responsible for:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Maintaining the confidentiality of your account and password.</li>
                <li>Restricting access to your computer or mobile device.</li>
                <li>All activities that occur under your account.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-brand-black mb-4">3. Products and Pricing</h2>
              <p className="text-gray-700 leading-relaxed">
                All products listed on Sastocart are subject to availability. We reserve the right to modify prices or discontinue products at any time without notice. While we strive for accuracy, errors in pricing or descriptions may occur; in such cases, we reserve the right to cancel orders placed for such items.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-brand-black mb-4">4. Shipping and Delivery</h2>
              <p className="text-gray-700 leading-relaxed">
                Delivery times are estimates and not guaranteed. Sastocart is not responsible for delays caused by third-party shipping carriers or events beyond our control.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-brand-black mb-4">5. Returns and Refunds</h2>
              <p className="text-gray-700 leading-relaxed">
                Our return policy allows for returns within a specified period for most items, provided they are in their original condition and packaging. Please contact our support team at info.sastocart@gmail.com to initiate a return or for more information on eligible products.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-brand-black mb-4">6. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed">
                Sastocart and its affiliates shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use our services or for the cost of procurement of substitute goods.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-brand-black mb-4">7. Governing Law</h2>
              <p className="text-gray-700 leading-relaxed">
                These terms and conditions are governed by and construed in accordance with the laws of Nepal, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-brand-black mb-4">8. Changes to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to update or change our Terms of Service at any time. Your continued use of the service after we post any modifications to the Terms of Service on this page will constitute your acknowledgment of the modifications and your consent to abide and be bound by the modified Terms of Service.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TermsOfService;
