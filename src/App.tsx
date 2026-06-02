import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './components/Dashboard/DashboardLayout'; 
import { AddProduct } from './components/Dashboard/AddProduct'; 
import { ProductsList } from './components/Dashboard/ProductsList'; 
import { AdminLogin } from './components/Dashboard/AdminLogin'; 
import { POSDashboard } from './components/Dashboard/POSDashboard'; 
// 🚀 استدعاء صفحة الفواتير واليوميات اللي نسيناها
import { DashboardOverview } from './components/Dashboard/DashboardOverview'; 

// 🔐 مكون حماية المسارات (Guard)
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

        {/* 🔐 باقي المسارات محمية وتستخدم الـ DashboardLayout اللي جواه الـ Sidebar */}
        <Route path="/" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          {/* أول ما تفتح السيستم، يوديك للكاشير مباشرة */}
          <Route index element={<Navigate to="pos" replace />} />
          
          {/* 🛒 مسار الكاشير (الشاشة المدمجة) */}
          <Route path="pos" element={<POSDashboard />} />
          
          {/* 📊 مسار الفواتير واليوميات اللي هتيجي من السايد بار */}
          <Route path="dashboard" element={<DashboardOverview />} />
          
          {/* 📦 مسارات الجرد وإضافة الأصناف */}
          <Route path="products" element={<ProductsList />} />
          <Route path="add-product" element={<AddProduct />} />
          
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;