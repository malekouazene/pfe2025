import React from 'react';
import { useParams } from 'react-router-dom';

const DocumentDetail = () => {
  const { id } = useParams();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Document Detail</h1>
      <p>Showing details for document with ID: {id}</p>
    </div>
  );
};

export default DocumentDetail;
