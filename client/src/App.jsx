import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AuthProvider } from "./contexts/AuthContext";

gsap.registerPlugin(ScrollTrigger);
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./layouts/MainLayout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard";
import ReaderDashboard from "./pages/ReaderDashboard";
import BookListPage from "./pages/BookListPage";
import BookFormPage from "./pages/BookFormPage";
import UserListPage from "./pages/UserListPage";
import UserFormPage from "./pages/UserFormPage";
import BorrowListPage from "./pages/BorrowListPage";
import BorrowFormPage from "./pages/BorrowFormPage";
import ReturnPage from "./pages/ReturnPage";
import FineListPage from "./pages/FineListPage";
import BillingPage from "./pages/BillingPage";
import WalletPage from "./pages/WalletPage";
import StudentHistoryPage from "./pages/StudentHistoryPage";
import MyReservationsPage from "./pages/MyReservationsPage";
import LandingPage from "./pages/LandingPage";
import LogViewerPage from "./pages/LogViewerPage";

function AnimatedOutlet({ children }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function ToastContent() {
  return (
    <Toaster
      position="top-right"
      gutter={12}
      containerStyle={{ margin: "8px" }}
      toastOptions={{
        duration: 4000,
        style: {
          borderRadius: "14px",
          padding: "12px 20px",
          fontSize: "14px",
          fontWeight: 500,
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          border: "1px solid rgba(0,0,0,0.04)",
        },
        success: { iconTheme: { primary: "#059669", secondary: "#fff" } },
        error: { iconTheme: { primary: "#DC2626", secondary: "#fff" } },
      }}
    />
  );
}

function AppRoutes() {
  const location = useLocation();

  return (
    <Routes location={location}>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        element={
          <ProtectedRoute roles={["librarian", "user"]}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<ProtectedRoute roles={["librarian"]}><AnimatedOutlet><Dashboard /></AnimatedOutlet></ProtectedRoute>} />
        <Route path="/my-dashboard" element={<ProtectedRoute roles={["user"]}><AnimatedOutlet><ReaderDashboard /></AnimatedOutlet></ProtectedRoute>} />
        <Route path="/books" element={<AnimatedOutlet><BookListPage /></AnimatedOutlet>} />
        <Route path="/books/new" element={<ProtectedRoute roles={["librarian"]}><AnimatedOutlet><BookFormPage /></AnimatedOutlet></ProtectedRoute>} />
        <Route path="/books/:id/edit" element={<ProtectedRoute roles={["librarian"]}><AnimatedOutlet><BookFormPage /></AnimatedOutlet></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute roles={["librarian"]}><AnimatedOutlet><UserListPage /></AnimatedOutlet></ProtectedRoute>} />
        <Route path="/users/new" element={<ProtectedRoute roles={["librarian"]}><AnimatedOutlet><UserFormPage /></AnimatedOutlet></ProtectedRoute>} />
        <Route path="/borrows" element={<ProtectedRoute roles={["librarian"]}><AnimatedOutlet><BorrowListPage /></AnimatedOutlet></ProtectedRoute>} />
        <Route path="/borrows/new" element={<ProtectedRoute roles={["librarian"]}><AnimatedOutlet><BorrowFormPage /></AnimatedOutlet></ProtectedRoute>} />
        <Route path="/borrows/:id/return" element={<ProtectedRoute roles={["librarian"]}><AnimatedOutlet><ReturnPage /></AnimatedOutlet></ProtectedRoute>} />
        <Route path="/fines" element={<ProtectedRoute roles={["librarian"]}><AnimatedOutlet><FineListPage /></AnimatedOutlet></ProtectedRoute>} />
        <Route path="/billing" element={<ProtectedRoute roles={["librarian"]}><AnimatedOutlet><BillingPage /></AnimatedOutlet></ProtectedRoute>} />
        <Route path="/fines/my" element={<ProtectedRoute roles={["user"]}><AnimatedOutlet><FineListPage /></AnimatedOutlet></ProtectedRoute>} />
        <Route path="/wallet" element={<ProtectedRoute roles={["user"]}><AnimatedOutlet><WalletPage /></AnimatedOutlet></ProtectedRoute>} />
        <Route path="/profile/history" element={<ProtectedRoute roles={["user"]}><AnimatedOutlet><StudentHistoryPage /></AnimatedOutlet></ProtectedRoute>} />
        <Route path="/reservations" element={<ProtectedRoute roles={["user"]}><AnimatedOutlet><MyReservationsPage /></AnimatedOutlet></ProtectedRoute>} />
        <Route path="/logs" element={<ProtectedRoute roles={["librarian"]}><AnimatedOutlet><LogViewerPage /></AnimatedOutlet></ProtectedRoute>} />
        <Route path="/" element={<LandingPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <ToastContent />
          <AppRoutes />
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
