import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Spinner from '../components/Spinner.jsx';
import { defaultHomePath } from '../utils/authPaths.js';

/** `/` — send guests to login; signed-in users to portal or admin home. */
export default function RootRedirect() {
  const { user, ready } = useAuth();
  if (!ready) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={defaultHomePath(user)} replace />;
}
