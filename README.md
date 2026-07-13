# 🛒 Sastocart

**Sastocart** is a modern, premium e-commerce platform built for speed, aesthetics, and engagement. It features a robust design system, real-time updates, and a gamified reward system to enhance the customer shopping experience.

---

## ✨ Key Features

### 🛍️ Customer Experience
- **Premium Product Discovery**: Sleek product grid with zoom-on-hover effects and advanced category filtering.
- **Global Search**: Search for products from any page with instantaneous redirection to the shop.
- **Realtime Notifications**: Stay updated with a pulsing notification bell for order updates and rewards.
- **Gamified 'Rate & Earn'**: Earn 5 Reward Points for every product review. Collect points to unlock exclusive discounts.
- **Order Tracking**: Track your packages directly from the "My Orders" dashboard with live tracking links.

### 🔐 Administrative Dashboard
- **Inventory Management**: Add, edit, and delete products with real-time stock monitoring.
- **Order Fulfillment**: Intercept and manage orders, with a specialized workflow for inputting shipping tracking details.
- **Status Control**: Update order statuses (Pending, Processed, Shipped, Delivered) with instant customer feedback via Supabase Realtime.

---

## 🚀 Tech Stack

- **Core**: [React 18](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Backend/Database**: [Neon DB](https://neon.tech/) (PostgreSQL) + [Clerk](https://clerk.com/) (Auth)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Toast Notifications**: [Sonner](https://sonner.stevenly.me/)

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Piyus2105/sastocart-ui.git
   cd sastocart-ui
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   Create a `.env` file in the root directory and add your Clerk and Neon DB credentials:
   ```env
   VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   VITE_NEON_DB_URL=your_neon_db_url
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

---

## 🎨 Design System

Sastocart follows a **60-30-10** color rule for a premium feel:
- **60% (Base)**: White / Soft Gray (`#FFFFFF`, `bg-muted/30`)
- **30% (Brand)**: Sasto Orange (`#ea580c` / `primary`)
- **10% (Accent)**: Deep Black (`#000000`)

---

## 📝 License

This project is licensed under the MIT License.
