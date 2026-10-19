import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Sales from './pages/Sales';
import Delivery from './pages/Delivery';
import AddOrder from './pages/AddOrder';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';
import Layout from './Layout';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/delivery" element={<Delivery />} />
        <Route
          path="/admin/new-order"
          element={
            <AdminRoute>
              <AddOrder />
            </AdminRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}