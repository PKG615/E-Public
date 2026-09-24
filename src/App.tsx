import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";

// ==================== PUBLIC STOREFRONT ====================
import { Header } from "./components/common/Header";
import { Navbar } from "./components/common/Navbar";
import { Footer } from "./components/common/Footer";

import { HomePage } from "./pages/customer/HomePage";
import { ShopPage } from "./pages/customer/ShopPage";
import { ProductDetailPage } from "./pages/customer/ProductDetailPage";
import { CartPage } from "./pages/customer/CartPage";
import { WishlistPage } from "./pages/customer/WishlistPage";
import { ComparePage } from "./pages/customer/ComparePage";
import { AccountPage } from "./pages/customer/AccountPage";
import { AddressesPage } from "./pages/customer/AddressesPage";
import { CheckoutPage } from "./pages/customer/CheckoutPage";
import { OrdersPage } from "./pages/customer/OrdersPage";
import { OrderDetailPage } from "./pages/customer/OrderDetailPage";
import { OrderConfirmationPage } from "./pages/customer/OrderConfirmationPage";
import { OrderTrackingPage } from "./pages/customer/OrderTrackingPage";
import { CustomerReturnsPage } from "./pages/customer/CustomerReturnsPage";
import { CustomerReviewsPage } from "./pages/customer/CustomerReviewsPage";
import { CollectionsListPage } from "./pages/customer/CollectionsListPage";
import { CollectionDetailPage } from "./pages/customer/CollectionDetailPage";

// ==================== ADMIN / CMS ====================
import { AdminLayout, AdminTab } from "./components/admin/AdminLayout";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminProducts } from "./pages/admin/AdminProducts";
import { AdminInventory } from "./pages/admin/AdminInventory";
import { AdminCategories } from "./pages/admin/AdminCategories";
import { AdminBrands } from "./pages/admin/AdminBrands";
import { AdminBanners } from "./pages/admin/AdminBanners";
import { AdminCollections } from "./pages/admin/AdminCollections";
import { AdminOrders } from "./pages/admin/AdminOrders";
import { AdminShipments } from "./pages/admin/AdminShipments";
import { AdminReturns } from "./pages/admin/AdminReturns";
import { AdminReviews } from "./pages/admin/AdminReviews";
import { AdminSupport } from "./pages/admin/AdminSupport";
import { AdminCustomers } from "./pages/admin/AdminCustomers";
import { AdminMarketing } from "./pages/admin/AdminMarketing";
import { AdminAnalytics } from "./pages/admin/AdminAnalytics";

// ==========================================================
// CMS LOGIN
// ==========================================================

function Login() {
  const { login, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");

    const ok = await login(email.trim(), password);

    if (!ok) {
      setError("Invalid credentials or the backend is unavailable.");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md bg-white rounded-2xl p-6 sm:p-8 shadow-2xl"
      >
        <div className="w-12 h-12 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-bold mb-5">
          ADM
        </div>

        <h1 className="text-2xl font-bold text-neutral-900">CMS Admin Login</h1>

        <p className="text-sm text-neutral-500 mt-1 mb-6">
          Authenticate against the production API.
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 text-red-700 text-sm p-3">
            {error}
          </div>
        )}

        <label className="block text-sm font-medium mb-1">Email</label>

        <input
          className="w-full border rounded-lg px-3 py-2.5 mb-4"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label className="block text-sm font-medium mb-1">Password</label>

        <input
          className="w-full border rounded-lg px-3 py-2.5 mb-5"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          disabled={loading}
          className="w-full bg-neutral-900 text-white rounded-lg py-2.5 font-semibold disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}

// ==========================================================
// CMS APP
// ==========================================================

function CmsApp() {
  const { user, isAdmin, loading } = useAuth();

  const [adminTab, setAdminTab] = useState<AdminTab>("dashboard");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Login />;
  }

  const exitToStorefront = () => {
    window.location.href =
      import.meta.env.VITE_STOREFRONT_URL || window.location.origin;
  };

  return (
    <AdminLayout
      currentTab={adminTab}
      onSelectTab={setAdminTab}
      onExitAdmin={exitToStorefront}
    >
      {adminTab === "dashboard" && (
        <AdminDashboard
          onNavigateToTab={setAdminTab}
          onNavigateToStorefront={exitToStorefront}
        />
      )}

      {adminTab === "analytics" && (
        <AdminAnalytics onNavigateToTab={setAdminTab} />
      )}

      {adminTab === "inventory" && <AdminInventory />}

      {adminTab === "products" && <AdminProducts />}

      {adminTab === "categories" && <AdminCategories />}

      {adminTab === "brands" && <AdminBrands />}

      {adminTab === "banners" && <AdminBanners />}

      {adminTab === "collections" && <AdminCollections />}

      {adminTab === "orders" && <AdminOrders />}

      {adminTab === "shipments" && <AdminShipments />}

      {adminTab === "returns" && <AdminReturns />}

      {adminTab === "reviews" && <AdminReviews />}

      {adminTab === "support" && <AdminSupport />}

      {adminTab === "customers" && (
        <AdminCustomers onNavigateToTab={setAdminTab} />
      )}

      {adminTab === "marketing" && <AdminMarketing />}
    </AdminLayout>
  );
}

// ==========================================================
// PUBLIC STOREFRONT LAYOUT
// ==========================================================

function StorefrontLayout() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col">
      <Header />

      <Navbar />

      <main className="flex-1">
        <Routes>
          {/* Home */}
          <Route path="/" element={<HomePage />} />

          {/* Catalog */}
          <Route path="/shop" element={<ShopPage />} />

          <Route path="/product/:id" element={<ProductDetailPage />} />

          {/* Collections */}
          <Route path="/collections" element={<CollectionsListPage />} />

          <Route path="/collections/:id" element={<CollectionDetailPage />} />

          {/* Shopping */}
          <Route path="/cart" element={<CartPage />} />

          <Route path="/wishlist" element={<WishlistPage />} />

          <Route path="/compare" element={<ComparePage />} />

          {/* Customer */}
          <Route path="/account" element={<AccountPage />} />

          <Route path="/addresses" element={<AddressesPage />} />

          {/* Checkout */}
          <Route path="/checkout" element={<CheckoutPage />} />

          {/* Orders */}
          <Route path="/orders" element={<OrdersPage />} />

          <Route path="/orders/:id" element={<OrderDetailPage />} />

          <Route
            path="/order-confirmation"
            element={<OrderConfirmationPage />}
          />

          <Route path="/order-tracking" element={<OrderTrackingPage />} />

          {/* Returns */}
          <Route path="/returns" element={<CustomerReturnsPage />} />

          {/* Reviews */}
          <Route path="/reviews" element={<CustomerReviewsPage />} />

          {/* Unknown customer route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

// ==========================================================
// ROOT APP
// ==========================================================

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ================= PUBLIC STORE ================= */}
          <Route path="/admin/*" element={<CmsApp />} />

          {/* ================= CUSTOMER STORE ================= */}
          <Route path="/*" element={<StorefrontLayout />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
