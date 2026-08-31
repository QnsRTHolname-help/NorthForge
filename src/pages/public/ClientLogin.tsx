import { Navigate } from 'react-router-dom';
// Legacy path — the portal now uses one unified sign-in at /login.
export default function ClientLogin() {
  return <Navigate to="/login" replace />;
}
