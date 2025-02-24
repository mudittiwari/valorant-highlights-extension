import React from 'react';
import { Navigate } from 'react-router';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const documentationUser = localStorage.getItem('documentation-user');
  if (!documentationUser) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export default PrivateRoute;