import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminPage from './pages/AdminPage';
import ItemsPage from './pages/ItemsPage';
import ItemDetailPage from './pages/ItemDetailPage';
import PrivateRoute from './components/PrivateRoute';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import EditUserPage from './pages/EditUserPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import PersistLogin from './components/PersistLogin';
import FfbReupload from "./pages/FfbReupload";
import SplitSO from "./pages/SplitSO";
import CPUpdate from "./pages/CPUpdate";
import BargeUpdate from "./pages/BargeUpdate";
import SQLExecute from "./pages/SQLExecute";

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Protected routes */}
      <Route element={<PersistLogin />}>
        {/* Routes that require login and will display the main layout */}
        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            {/* General authenticated routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={<HomePage />} />

            {/* Item management routes - accessible by all authenticated users */}
            <Route path="items" element={<ItemsPage />} />
            <Route path="items/:id" element={<ItemDetailPage />} />

            {/* Admin only routes */}
            <Route element={<PrivateRoute allowedRoles={['ADMIN']} />}>
              <Route path="admin" element={<AdminPage />} />
              <Route path="admin/users/:id/edit" element={<EditUserPage />} />
            </Route>
            <Route element={<PrivateRoute allowedPermissions={['WB_FFB_REUPLOAD']} />}>
              <Route path="/ffbreupload" element={<FfbReupload />} />
            </Route>
            <Route element={<PrivateRoute allowedPermissions={['WB_SPLIT_SO']} />}>
              <Route path="/splitso" element={<SplitSO />} />
            </Route>
            <Route element={<PrivateRoute allowedPermissions={['WB_CP_UPDATE']} />}>
              <Route path="/cpupdate" element={<CPUpdate />} />
            </Route>
            <Route element={<PrivateRoute allowedPermissions={['WB_BARGE_UPDATE']} />}>
              <Route path="/barge" element={<BargeUpdate />} />
            </Route>
            <Route element={<PrivateRoute allowedPermissions={['WB_SQL_EXECUTE']} />}>
              <Route path="/sqlexecute" element={<SQLExecute />} />
            </Route>
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
