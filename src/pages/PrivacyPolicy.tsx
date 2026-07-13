import { Shield } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="bg-muted/30 min-h-screen">
      <main className="container max-w-4xl py-16 px-4">
        <div className="bg-white rounded-3xl border-2 border-brand-black/5 p-8 md:p-12 shadow-sm">
          <div className="flex items-center gap-3 text-primary mb-6">
            <Shield className="h-8 w-8" />
            <h1 className="text-3xl font-black text-brand-black tracking-tight uppercase">Privacy Policy</h1>
          </div>
          
          <p className="text-muted-foreground mb-8 font-medium">
            Effective Date: May 14, 2026
          </p>

          <div className="space-y-8 prose prose-slate max-w-none">
            <section>
              <h2 className="text-xl font-black text-brand-black mb-4">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                Welcome to Sastocart. We value your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website or use our services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-brand-black mb-4">2. Information We Collect</h2>
              <p className="text-gray-700 leading-relaxed mb-4">We collect several types of information from and about users of our website, including:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Personal Identification Information:</strong> Name, email address, phone number, and shipping/billing address.</li>
                <li><strong>Account Information:</strong> Username and password used to create an account.</li>
                <li><strong>Order Details:</strong> Information about the products you purchase, transaction history, and payment status (note: we do not store full credit card details).</li>
                <li><strong>Technical Data:</strong> IP address, browser type, and usage patterns through cookies and similar technologies.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-brand-black mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">We use the collected information for various purposes:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>To process and fulfill your orders, including shipping and delivery.</li>
                <li>To manage your account and provide customer support.</li>
                <li>To send you transactional emails, order updates, and marketing communications (if opted-in).</li>
                <li>To improve our website functionality and user experience.</li>
                <li>To detect and prevent fraudulent activities.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-brand-black mb-4">4. Cookies and Tracking Technologies</h2>
              <p className="text-gray-700 leading-relaxed">
                Sastocart uses cookies to enhance your browsing experience. Cookies are small data files stored on your device that help us remember your preferences and analyze site traffic. You can choose to disable cookies through your browser settings, though some features of the site may not function properly.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-brand-black mb-4">5. Data Security</h2>
              <p className="text-gray-700 leading-relaxed">
                We implement a variety of security measures to maintain the safety of your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-brand-black mb-4">6. Contact Information</h2>
              <p className="text-gray-700 leading-relaxed">
                If you have any questions about this Privacy Policy or our data practices, please contact us at:
              </p>
              <div className="mt-4 p-6 bg-muted/50 rounded-2xl border border-brand-black/5">
                <p className="font-bold text-brand-black">Sastocart</p>
                <p className="text-gray-700">Birganj, Nepal</p>
                <p className="text-gray-700">Email: info.sastocart@gmail.com</p>
                <p className="text-gray-700">Phone: +977-9746695656</p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
