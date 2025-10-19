import { useState, useEffect } from 'react'
import { useCompany } from '../contexts/CompanyContext'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { 
  Building2, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Loader
} from 'lucide-react'

const STATUS_COLORS = {
  pending: 'bg-warning-100 text-warning-800',
  active: 'bg-success-100 text-success-800',
  suspended: 'bg-error-100 text-error-800',
  cancelled: 'bg-gray-100 text-gray-800'
}

const SETUP_STATUS_COLORS = {
  pending: 'bg-warning-100 text-warning-800',
  in_progress: 'bg-primary-100 text-primary-800',
  completed: 'bg-success-100 text-success-800',
  failed: 'bg-error-100 text-error-800'
}

export default function CompanyList() {
  const { companies, fetchCompanies, updateCompanyStatus, loading } = useCompany()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [industryFilter, setIndustryFilter] = useState('')

  useEffect(() => {
    fetchCompanies({
      search: searchTerm,
      status: statusFilter,
      industry: industryFilter
    })
  }, [searchTerm, statusFilter, industryFilter])

  const handleStatusChange = async (companyId, newStatus) => {
    const result = await updateCompanyStatus(companyId, newStatus)
    if (result.success) {
      toast.success('Company status updated successfully')
    } else {
      toast.error(result.error || 'Failed to update status')
    }
  }

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.domain.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !statusFilter || company.status === statusFilter
    const matchesIndustry = !industryFilter || company.industry === industryFilter
    
    return matchesSearch && matchesStatus && matchesIndustry
  })

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'suspended':
        return <AlertCircle className="h-4 w-4" />
      case 'cancelled':
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getSetupStatusIcon = (setupStatus) => {
    switch (setupStatus) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'in_progress':
        return <Loader className="h-4 w-4 animate-spin" />
      case 'failed':
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
          <p className="mt-2 text-gray-600">
            Manage your company accounts and their Jira workspaces
          </p>
        </div>
        <Link to="/onboarding" className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Company
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="form-group">
            <label className="label">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
                placeholder="Search companies..."
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="form-group">
            <label className="label">Industry</label>
            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="input"
            >
              <option value="">All Industries</option>
              <option value="Technology">Technology</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Finance">Finance</option>
              <option value="Education">Education</option>
              <option value="Retail">Retail</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Real Estate">Real Estate</option>
              <option value="Consulting">Consulting</option>
              <option value="Media">Media</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label className="label">&nbsp;</label>
            <button
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('')
                setIndustryFilter('')
              }}
              className="btn-secondary w-full"
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Companies Table */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="h-8 w-8 animate-spin text-primary-600" />
            <span className="ml-2 text-gray-600">Loading companies...</span>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No companies found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first company.
            </p>
            <div className="mt-6">
              <Link to="/onboarding" className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Company
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Industry
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Setup Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCompanies.map((company) => (
                  <tr key={company._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-primary-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {company.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {company.domain}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {company.industry}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[company.status]}`}>
                        {getStatusIcon(company.status)}
                        <span className="ml-1 capitalize">{company.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${SETUP_STATUS_COLORS[company.jiraConfig?.setupStatus || 'pending']}`}>
                        {getSetupStatusIcon(company.jiraConfig?.setupStatus || 'pending')}
                        <span className="ml-1 capitalize">{company.jiraConfig?.setupStatus || 'pending'}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(company.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/companies/${company._id}`}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          View
                        </Link>
                        <select
                          value={company.status}
                          onChange={(e) => handleStatusChange(company._id, e.target.value)}
                          className="text-sm border-0 bg-transparent text-gray-600 hover:text-gray-900 focus:outline-none"
                        >
                          <option value="pending">Pending</option>
                          <option value="active">Active</option>
                          <option value="suspended">Suspended</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
