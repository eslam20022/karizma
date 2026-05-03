import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './components/Dashboard/DashboardLayout'; 
import { DashboardOverview } from './components/Dashboard/DashboardOverview'; 
import { AddProduct } from './components/Dashboard/AddProduct'; 
import { ProductsList } from './components/Dashboard/ProductsList'; 
import { OrdersList } from './components/Dashboard/OrdersList';
import { CustomersList } from './components/Dashboard/CustomersList';
import { Marketing } from './components/Dashboard/Marketing';
import { AdminLogin } from './components/Dashboard/AdminLogin'; // 🚀 استدعاء اللوجن
import { CarouselManager} from './components/Dashboard/CarouselManager'; // 🚀 استدعاء اللوجن

// مكون حماية المسارات (Guard)
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuth = sessionStorage.getItem('admin_auth') === 'true';
  return isAuth ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 🔓 مسار تسجيل الدخول (مفتوح للكل) */}
        <Route path="/login" element={<AdminLogin />} />

        {/* 🔐 باقي المسارات محمية (Protected) */}
        <Route path="/" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardOverview />} />
          <Route path="products" element={<ProductsList />} />
          <Route path="CarouselManager" element={<CarouselManager />} />
          <Route path="add-product" element={<AddProduct />} />
          <Route path="orders" element={<OrdersList />} />
          <Route path="users" element={<CustomersList />} />
          <Route path="marketing" element={<Marketing />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;