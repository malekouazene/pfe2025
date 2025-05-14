import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="p-4 text-center">
      <h1 className="text-4xl font-bold text-red-500 mb-4">404</h1>
      <p className="mb-4">Page not found.</p>
      <Link to="/" className="text-blue-500 underline">
        Return to home
      </Link>
    </div>
  );
};

export default NotFound;
