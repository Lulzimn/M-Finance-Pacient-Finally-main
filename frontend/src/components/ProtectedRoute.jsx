import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute Component
 * Protects routes based on authentication and role
 * 
 * @param {string[]} roles - Array of allowed roles (e.g., ['admin'] or ['admin', 'staff'])
 * @param {ReactNode} children - Components to render if authorized
 */
export default function ProtectedRoute({ roles, children }) {
  const userStr = sessionStorage.getItem('user');
  
  // Not authenticated
  if (!userStr) {
    return <Navigate to="/login" replace />;
  }
  
  try {
    const user = JSON.parse(userStr);
    
    // Check if user has required role
    if (roles && roles.length > 0 && !roles.includes(user.role)) {
      // Redirect to appropriate dashboard if trying to access unauthorized route
      return <Navigate to={user.role === 'admin' ? '/admin' : '/staff'} replace />;
    }
    
    // Authorized - render children
    return children;
  } catch (error) {
    // Invalid user data in storage
    sessionStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }
}
