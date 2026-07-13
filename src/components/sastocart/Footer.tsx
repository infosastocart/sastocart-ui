import { Facebook, Instagram, MessageCircle, Phone, Mail, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="bg-white text-gray-800 pt-16 pb-8 border-t border-gray-100">
      <div className="container px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-16">
          {/* Brand Section */}
          <div className="space-y-6">
            <Link to="/" className="text-2xl font-black tracking-tight flex items-center">
              <span className="text-brand-black">Sasto</span>
              <span className="text-primary">Cart</span>
            </Link>
            <p className="text-sm leading-relaxed text-gray-800">
              Sastocart is your one-stop destination for everyday essentials. We bring you quality products at affordable prices, delivered right to your doorstep with care and speed.
            </p>
            <div className="flex items-center gap-4">
              <a 
                href="https://www.facebook.com/sastocartnp" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-800 hover:bg-primary hover:text-white transition-all duration-300"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="https://www.instagram.com/sasto.cart?igsh=MWI5YXc5N3Vua3R4bg==" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-800 hover:bg-primary hover:text-white transition-all duration-300"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="https://wa.me/9779746695656" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-800 hover:bg-primary hover:text-white transition-all duration-300"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h4 className="text-brand-black font-bold uppercase tracking-widest text-xs">Quick Links</h4>
            <ul className="space-y-4 text-sm">
              <li>
                <Link to="/" className="text-gray-800 hover:text-primary transition-colors font-medium">Home</Link>
              </li>
              <li>
                <Link to="/blog" className="text-gray-800 hover:text-primary transition-colors font-medium">Blog</Link>
              </li>
              <li>
                <Link to="/my-orders" className="text-gray-800 hover:text-primary transition-colors font-medium">My Orders</Link>
              </li>
              <li>
                <Link to="/my-profile" className="text-gray-800 hover:text-primary transition-colors font-medium">My Profile</Link>
              </li>
            </ul>
          </div>

          {/* Contact Section */}
          <div className="space-y-6">
            <h4 className="text-brand-black font-bold uppercase tracking-widest text-xs">Connect with Us</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-center gap-3 text-gray-800">
                <Phone className="h-4 w-4 text-primary" />
                <span className="font-medium">+977-9746695656</span>
              </li>
              <li className="flex items-center gap-3 text-gray-800">
                <Mail className="h-4 w-4 text-primary" />
                <span className="font-medium">info.sastocart@gmail.com</span>
              </li>
              <li className="flex items-center gap-3 text-gray-800">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-medium">Birganj, Nepal</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold text-gray-800 uppercase tracking-widest">
          <p>© 2026 Sastocart. All rights reserved.</p>
          <div className="flex gap-8">
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
