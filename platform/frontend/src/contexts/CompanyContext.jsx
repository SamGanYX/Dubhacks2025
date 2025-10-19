import { createContext, useContext, useState } from 'react'
import { companyAPI } from '../services/api'

const CompanyContext = createContext()

export function useCompany() {
  const context = useContext(CompanyContext)
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider')
  }
  return context
}

export function CompanyProvider({ children }) {
  const [companies, setCompanies] = useState([])
  const [currentCompany, setCurrentCompany] = useState(null)
  const [loading, setLoading] = useState(false)

  const createCompany = async (companyData) => {
    setLoading(true)
    try {
      const response = await companyAPI.create(companyData)
      if (response.success) {
        setCompanies(prev => [response.company, ...prev])
        return { success: true, company: response.company }
      } else {
        return { success: false, error: response.error, details: response.details }
      }
    } catch (error) {
      return { success: false, error: 'Failed to create company' }
    } finally {
      setLoading(false)
    }
  }

  const fetchCompanies = async (filters = {}) => {
    setLoading(true)
    try {
      const response = await companyAPI.getAll(filters)
      if (response.success) {
        setCompanies(response.companies)
        return { success: true, companies: response.companies }
      } else {
        return { success: false, error: response.error }
      }
    } catch (error) {
      return { success: false, error: 'Failed to fetch companies' }
    } finally {
      setLoading(false)
    }
  }

  const fetchCompany = async (companyId) => {
    setLoading(true)
    try {
      const response = await companyAPI.getById(companyId)
      if (response.success) {
        setCurrentCompany(response.company)
        return { success: true, company: response.company }
      } else {
        return { success: false, error: response.error }
      }
    } catch (error) {
      return { success: false, error: 'Failed to fetch company' }
    } finally {
      setLoading(false)
    }
  }

  const updateCompany = async (companyId, updates) => {
    setLoading(true)
    try {
      const response = await companyAPI.update(companyId, updates)
      if (response.success) {
        setCompanies(prev => 
          prev.map(company => 
            company.id === companyId ? response.company : company
          )
        )
        if (currentCompany && currentCompany.id === companyId) {
          setCurrentCompany(response.company)
        }
        return { success: true, company: response.company }
      } else {
        return { success: false, error: response.error, details: response.details }
      }
    } catch (error) {
      return { success: false, error: 'Failed to update company' }
    } finally {
      setLoading(false)
    }
  }

  const updateCompanyStatus = async (companyId, status) => {
    setLoading(true)
    try {
      const response = await companyAPI.updateStatus(companyId, status)
      if (response.success) {
        setCompanies(prev => 
          prev.map(company => 
            company.id === companyId ? { ...company, status } : company
          )
        )
        return { success: true }
      } else {
        return { success: false, error: response.error }
      }
    } catch (error) {
      return { success: false, error: 'Failed to update company status' }
    } finally {
      setLoading(false)
    }
  }

  const getSetupStatus = async (companyId) => {
    try {
      const response = await companyAPI.getSetupStatus(companyId)
      if (response.success) {
        return { success: true, setupStatus: response.setupStatus }
      } else {
        return { success: false, error: response.error }
      }
    } catch (error) {
      return { success: false, error: 'Failed to fetch setup status' }
    }
  }

  const retrySetup = async (companyId) => {
    setLoading(true)
    try {
      const response = await companyAPI.retrySetup(companyId)
      if (response.success) {
        return { success: true }
      } else {
        return { success: false, error: response.error }
      }
    } catch (error) {
      return { success: false, error: 'Failed to retry setup' }
    } finally {
      setLoading(false)
    }
  }

  const value = {
    companies,
    currentCompany,
    loading,
    createCompany,
    fetchCompanies,
    fetchCompany,
    updateCompany,
    updateCompanyStatus,
    getSetupStatus,
    retrySetup
  }

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  )
}
