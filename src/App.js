import React from 'react';
import DataList from './components/DataList';

function App() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">My Data App</h1>
      <DataList />
    </div>
  );
}

export default App;