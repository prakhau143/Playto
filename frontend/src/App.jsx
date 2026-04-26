import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

import AuthPage from "./pages/Auth";
import MerchantHome from "./pages/MerchantHome";
import MerchantSLA from "./pages/MerchantSLA";
import MerchantHelp from "./pages/MerchantHelp";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminAddUser from "./pages/AdminAddUser";
import AdminQueue from "./pages/AdminQueue";
import AdminSubmissions from "./pages/AdminSubmissions";
import AdminSubmissionDetail from "./pages/AdminSubmissionDetail";

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  return <Navigate to={user.role === "admin" ? "/admin" : "/merchant"} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/auth" element={<AuthPage />} />

        <Route
          path="/merchant"
          element={
            <ProtectedRoute>
              <Layout>
                <MerchantHome />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/merchant/sla"
          element={
            <ProtectedRoute>
              <Layout>
                <MerchantSLA />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/merchant/help"
          element={
            <ProtectedRoute>
              <Layout>
                <MerchantHelp />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <Layout>
                <AdminDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requireAdmin>
              <Layout>
                <AdminUsers />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users/new"
          element={
            <ProtectedRoute requireAdmin>
              <Layout>
                <AdminAddUser />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/queue"
          element={
            <ProtectedRoute requireAdmin>
              <Layout>
                <AdminQueue />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/submissions"
          element={
            <ProtectedRoute requireAdmin>
              <Layout>
                <AdminSubmissions />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/submissions/:id"
          element={
            <ProtectedRoute requireAdmin>
              <Layout>
                <AdminSubmissionDetail />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
