import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistCompareProvider } from './context/WishlistCompareContext';
import { Header } from './components/common/Header';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { HomePage } from './pages/customer/HomePage';
import { ShopPage } from './pages/customer/ShopPage';
import { ProductDetailPage } from './pages/customer/ProductDetailPage';
import { CartPage } from './pages/customer/CartPage';
import { WishlistPage } from './pages/customer/WishlistPage';
import { ComparePage } from './pages/customer/ComparePage';
import { CheckoutPage } from './pages/customer/CheckoutPage';
import { AddressesPage } from './pages/customer/AddressesPage';
import { OrdersPage } from './pages/customer/OrdersPage';
import { OrderDetailPage } from './pages/customer/OrderDetailPage';
import { OrderTrackingPage } from './pages/customer/OrderTrackingPage';
import { OrderConfirmationPage } from './pages/customer/OrderConfirmationPage';
import { CustomerReturnsPage } from './pages/customer/CustomerReturnsPage';
import { CustomerReviewsPage } from './pages/customer/CustomerReviewsPage';
import { AccountPage } from './pages/customer/AccountPage';
import { CollectionDetailPage } from './pages/customer/CollectionDetailPage';
import { CollectionsListPage } from './pages/customer/CollectionsListPage';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <WishlistCompareProvider>
            <div className="min-h-screen flex flex-col bg-neutral-50 font-sans text-neutral-900">
              <Header />
              <Navbar />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/shop" element={<ShopPage />} />
                  <Route path="/product/:slugOrId" element={<ProductDetailPage />} />
                  <Route path="/products/:slugOrId" element={<ProductDetailPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/account" element={<AccountPage />} />
                  <Route path="/account/profile" element={<AccountPage />} />
                  <Route path="/account/notifications" element={<AccountPage />} />
                  <Route path="/account/support" element={<AccountPage />} />
                  <Route path="/account/questions" element={<AccountPage />} />
                  <Route path="/account/coupons" element={<AccountPage />} />
                  <Route path="/notifications" element={<AccountPage />} />
                  <Route path="/support" element={<AccountPage />} />
                  <Route path="/addresses" element={<AddressesPage />} />
                  <Route path="/orders" element={<OrdersPage />} />
                  <Route path="/account/orders" element={<OrdersPage />} />
                  <Route path="/returns" element={<CustomerReturnsPage />} />
                  <Route path="/account/returns" element={<CustomerReturnsPage />} />
                  <Route path="/reviews" element={<CustomerReviewsPage />} />
                  <Route path="/account/reviews" element={<CustomerReviewsPage />} />
                  <Route path="/orders/:orderId" element={<OrderDetailPage />} />
                  <Route path="/account/orders/:orderId" element={<OrderDetailPage />} />
                  <Route path="/orders/:orderId/tracking" element={<OrderTrackingPage />} />
                  <Route path="/account/orders/:orderId/tracking" element={<OrderTrackingPage />} />
                  <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
                  <Route path="/wishlist" element={<WishlistPage />} />
                  <Route path="/compare" element={<ComparePage />} />
                  <Route path="/collections" element={<CollectionsListPage />} />
                  <Route path="/collections/:slug" element={<CollectionDetailPage />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </WishlistCompareProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}
