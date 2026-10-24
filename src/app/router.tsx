import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageShell } from '../components/layout/PageShell';
import { ScrollToTop } from '../components/common/ScrollToTop';
import { Spinner } from '../components/ui/Spinner';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';
import { AdminRoute } from '../features/auth/AdminRoute';

// Lazy-loaded route components
const HomePage = lazy(() => import('../features/home/HomePage'));
const ServicesPage = lazy(() => import('../features/services/ServicesPage'));
const ServiceDetailPage = lazy(
  () => import('../features/services/ServiceDetailPage')
);
const BookingPage = lazy(() => import('../features/booking/BookingPage'));
const AboutPage = lazy(() => import('../features/about/AboutPage'));
const ContactPage = lazy(() => import('../features/contact/ContactPage'));
const FaqPage = lazy(() => import('../features/faq/FaqPage'));
const LegalPage = lazy(() => import('../features/legal/LegalPage'));

const LoginPage = lazy(() => import('../features/auth/LoginPage'));
const RegisterPage = lazy(() => import('../features/auth/RegisterPage'));
const ForgotPasswordPage = lazy(
  () => import('../features/auth/ForgotPasswordPage')
);
const ResetPasswordPage = lazy(
  () => import('../features/auth/ResetPasswordPage')
);
const AccountPage = lazy(() => import('../features/account/AccountPage'));

const AdminLayout = lazy(() => import('../features/admin/AdminLayout'));
const DashboardPage = lazy(() => import('../features/admin/DashboardPage'));
const BookingsAdminPage = lazy(
  () => import('../features/admin/BookingsAdminPage')
);
const ServicesAdminPage = lazy(
  () => import('../features/admin/ServicesAdminPage')
);
const FaqsAdminPage = lazy(() => import('../features/admin/FaqsAdminPage'));
const MessagesAdminPage = lazy(
  () => import('../features/admin/MessagesAdminPage')
);
const LegalPagesAdminPage = lazy(
  () => import('../features/admin/LegalPagesAdminPage')
);
const SiteSettingsPage = lazy(
  () => import('../features/admin/SiteSettingsPage')
);
const JobsAdminPage = lazy(() =>
  import('../features/admin/JobsAdminPage').then((m) => ({
    default: m.default,
  }))
);
const JobDetailAdminPage = lazy(() =>
  import('../features/admin/JobDetailAdminPage').then((m) => ({
    default: m.default,
  }))
);
const InvoicesAdminPage = lazy(() =>
  import('../features/admin/InvoicesAdminPage').then((m) => ({
    default: m.default,
  }))
);
const TrackPage = lazy(() =>
  import('../features/track/TrackPage').then((m) => ({
    default: m.default,
  }))
);
const InvoicePrintPage = lazy(() =>
  import('../features/jobs/InvoicePrintPage').then((m) => ({
    default: m.default,
  }))
);
const ShopPage = lazy(() =>
  import('../features/catalogue/ShopPage').then((m) => ({
    default: m.default,
  }))
);
const ProductDetailPage = lazy(() =>
  import('../features/catalogue/ProductDetailPage').then((m) => ({
    default: m.default,
  }))
);
const ProductsAdminPage = lazy(() =>
  import('../features/admin/ProductsAdminPage').then((m) => ({
    default: m.default,
  }))
);
const CategoriesAdminPage = lazy(() =>
  import('../features/admin/CategoriesAdminPage').then((m) => ({
    default: m.default,
  }))
);
const BrandsAdminPage = lazy(() =>
  import('../features/admin/BrandsAdminPage').then((m) => ({
    default: m.default,
  }))
);
const OrdersAdminPage = lazy(() =>
  import('../features/admin/AdminOrdersPage').then((m) => ({
    default: m.AdminOrdersPage,
  }))
);
const OrderDetailAdminPage = lazy(() =>
  import('../features/admin/AdminOrderDetailPage').then((m) => ({
    default: m.AdminOrderDetailPage,
  }))
);
const DeliveryAdminPage = lazy(() =>
  import('../features/admin/AdminDeliveryCouponsPage').then((m) => ({
    default: m.AdminDeliveryCouponsPage,
  }))
);
const CartPage = lazy(() => import('../features/cart/CartPage'));
const CheckoutPage = lazy(() => import('../features/checkout/CheckoutPage'));
const OrderSuccessPage = lazy(() =>
  import('../features/orders/OrderSuccessPage').then((m) => ({
    default: m.OrderSuccessPage,
  }))
);
const OrderPrintPage = lazy(() =>
  import('../features/orders/OrderPrintPage').then((m) => ({
    default: m.OrderPrintPage,
  }))
);
const MockPaymentGatewayPage = lazy(() =>
  import('../features/orders/MockPaymentGatewayPage').then((m) => ({
    default: m.MockPaymentGatewayPage,
  }))
);
const PaymentReceiptPage = lazy(() =>
  import('../features/orders/PaymentReceiptPage').then((m) => ({
    default: m.PaymentReceiptPage,
  }))
);
const PaymentsAdminPage = lazy(() =>
  import('../features/admin/PaymentsAdminPage').then((m) => ({
    default: m.PaymentsAdminPage,
  }))
);
const PaymentSettingsAdminPage = lazy(() =>
  import('../features/admin/PaymentSettingsAdminPage').then((m) => ({
    default: m.PaymentSettingsAdminPage,
  }))
);

// Phase 8 Public Pages
const BlogListPage = lazy(() => import('../features/blog/BlogListPage'));
const BlogPostPage = lazy(() => import('../features/blog/BlogPostPage'));
const ToolsHubPage = lazy(() => import('../features/tools/ToolsHubPage'));
const CostEstimatorPage = lazy(() => import('../features/tools/CostEstimatorPage'));
const NextServiceCalculatorPage = lazy(
  () => import('../features/tools/NextServiceCalculatorPage')
);
const GalleryPage = lazy(() => import('../features/gallery/GalleryPage'));
const ReviewsPage = lazy(() => import('../features/reviews/ReviewsPage'));

// Phase 8 & 9 Admin Pages
const BlogAdminPage = lazy(() => import('../features/admin/BlogAdminPage'));
const ReviewsAdminPage = lazy(() => import('../features/admin/ReviewsAdminPage'));
const GalleryAdminPage = lazy(() => import('../features/admin/GalleryAdminPage'));
const EstimatorAdminPage = lazy(() => import('../features/admin/EstimatorAdminPage'));
const ChatbotAdminPage = lazy(() => import('../features/admin/ChatbotAdminPage'));

const ComingSoon = lazy(() => import('../components/common/ComingSoon'));
const NotFoundPage = lazy(() => import('../components/common/NotFoundPage'));

function RouteLoadingFallback() {
  const { t } = useTranslation();
  return (
    <div className="min-h-[65vh] flex items-center justify-center bg-[#0E1013]">
      <Spinner size="lg" label={t('common.loading')} />
    </div>
  );
}

function ShopCategoryRedirect() {
  const { slug } = useParams<{ slug: string }>();
  return <Navigate to={slug ? `/catalogue/category/${slug}` : '/catalogue'} replace />;
}

function ShopProductRedirect() {
  const { slug } = useParams<{ slug: string }>();
  return <Navigate to={slug ? `/catalogue/product/${slug}` : '/catalogue'} replace />;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
          {/* Standalone Printable Routes (Protected: own customer job/order or admin) */}
          <Route
            path="/invoice/:id/print"
            element={
              <ProtectedRoute>
                <InvoicePrintPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order/:id/print"
            element={
              <ProtectedRoute>
                <OrderPrintPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order/:id/payment-receipt"
            element={
              <ProtectedRoute>
                <PaymentReceiptPage />
              </ProtectedRoute>
            }
          />
          {/* Phase 7 Mock Payment Gateway Hosted Simulation */}
          <Route path="/pay/mock/:token" element={<MockPaymentGatewayPage />} />

          {/* Public & Customer Routes inside PageShell */}
          <Route element={<PageShell />}>
            <Route path="/" element={<HomePage />} />

            {/* Phase 2 Public Information Routes */}
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/services/:slug" element={<ServiceDetailPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/privacy" element={<LegalPage slug="privacy" />} />
            <Route path="/terms" element={<LegalPage slug="terms" />} />
            <Route path="/returns" element={<LegalPage slug="returns" />} />
            <Route
              path="/delivery-policy"
              element={<LegalPage slug="delivery-policy" />}
            />

            {/* Phase 3 Online Service Booking & Status Lookup Routes */}
            <Route path="/book" element={<BookingPage />} />
            <Route path="/book/status" element={<BookingPage />} />

            {/* Phase 4 Public Job & Booking Tracking Route */}
            <Route path="/track" element={<TrackPage />} />

            {/* Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Protected Customer Account Route */}
            <Route
              path="/account"
              element={
                <ProtectedRoute>
                  <AccountPage />
                </ProtectedRoute>
              }
            />

            {/* Phase 5 Parts & Accessories Catalogue Routes (Canonical /catalogue, /shop redirects) */}
            <Route path="/catalogue" element={<ShopPage />} />
            <Route path="/catalogue/category/:slug" element={<ShopPage />} />
            <Route path="/catalogue/product/:slug" element={<ProductDetailPage />} />
            <Route path="/shop" element={<Navigate to="/catalogue" replace />} />
            <Route path="/shop/category/:slug" element={<ShopCategoryRedirect />} />
            <Route path="/shop/product/:slug" element={<ShopProductRedirect />} />

            {/* Phase 6 Cart, Checkout & Order Success Routes */}
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route
              path="/order-success/:orderNo"
              element={<OrderSuccessPage />}
            />

            {/* Phase 8 Car Knowledge Center (Blog/Guides) */}
            <Route path="/blog" element={<BlogListPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />

            {/* Phase 8 Tools */}
            <Route path="/tools" element={<ToolsHubPage />} />
            <Route path="/tools/cost-estimator" element={<CostEstimatorPage />} />
            <Route
              path="/tools/next-service"
              element={<NextServiceCalculatorPage />}
            />

            {/* Phase 8 Gallery & Reviews */}
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/reviews" element={<ReviewsPage />} />

            {/* 404 Catch-All */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          {/* Protected Admin Routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="bookings" element={<BookingsAdminPage />} />
            <Route path="jobs" element={<JobsAdminPage />} />
            <Route path="jobs/:id" element={<JobDetailAdminPage />} />
            <Route path="invoices" element={<InvoicesAdminPage />} />
            <Route path="orders" element={<OrdersAdminPage />} />
            <Route path="orders/:id" element={<OrderDetailAdminPage />} />
            <Route path="payments" element={<PaymentsAdminPage />} />
            <Route path="payment-settings" element={<PaymentSettingsAdminPage />} />
            <Route path="delivery" element={<DeliveryAdminPage />} />
            <Route path="coupons" element={<DeliveryAdminPage />} />
            <Route path="products" element={<ProductsAdminPage />} />
            <Route path="categories" element={<CategoriesAdminPage />} />
            <Route path="brands" element={<BrandsAdminPage />} />
            <Route path="services" element={<ServicesAdminPage />} />
            <Route path="blog" element={<BlogAdminPage />} />
            <Route path="reviews" element={<ReviewsAdminPage />} />
            <Route path="gallery" element={<GalleryAdminPage />} />
            <Route path="estimator" element={<EstimatorAdminPage />} />
            <Route path="chatbot" element={<ChatbotAdminPage />} />
            <Route path="faqs" element={<FaqsAdminPage />} />
            <Route path="messages" element={<MessagesAdminPage />} />
            <Route path="pages" element={<LegalPagesAdminPage />} />
            <Route path="settings" element={<SiteSettingsPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

