import { Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Layout from './components/Layout'
import Home from './pages/Home'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import CompanyList from './pages/CompanyList'
import Login from './pages/Login'
import { AuthProvider } from './contexts/AuthContext'
import { CompanyProvider } from './contexts/CompanyContext'

function App() {
  return (
    <AuthProvider>
      <CompanyProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/companies" element={<CompanyList />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </Layout>
      </CompanyProvider>
    </AuthProvider>
  )
}

export default App
