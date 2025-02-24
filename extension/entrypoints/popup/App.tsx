import React from 'react';
import Login from './components/Login';
import Home from './components/Home';
import { HashRouter, Route, Routes } from 'react-router';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* <Route
          path="/"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        /> */}
        <Route path="/" element={<Home />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
