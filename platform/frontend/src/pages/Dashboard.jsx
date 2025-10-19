import { useState, useEffect } from 'react'
import { useCompany } from '../contexts/CompanyContext'
import { webhookAPI } from '../services/api'
import toast from 'react-hot-toast'
import { 
  Building2, 
  Phone, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Users,
  Zap,
  Loader
} from 'lucide-react'

export default function Dashboard() {
  const { companies, fetchCompanies, loading } = useCompany()
  const [stats, setStats] = useState({
    totalCompanies: 0,
    activeCompanies: 0,
    pendingSetup: 0,
    totalTickets: 0
  })
  const [recentActivity, setRecentActivity] = useState([])

  useEffect(() => {
    fetchCompanies()
  }, [])

  useEffect(() => {
    if (companies.length > 0) {
      const totalCompanies = companies.length
      const activeCompanies = companies.filter(c => c.status === 'active').length
      const pendingSetup = companies.filter(c => c.jiraConfig?.setupStatus === 'pending' || c.jiraConfig?.setupStatus === 'in_progress').length
      const totalTickets = companies.reduce((sum, c) => sum + (c.subscription?.ticketsUsed || 0), 0)

      setStats({
        totalCompanies,
        activeCompanies,
        pendingSetup,
        totalTickets
      })
    }
  }, [companies])

  const testWebhook = async (companyId) => {
    try {
      const result = await webhookAPI.test(companyId, "Hi, I need urgent help with my account!")
      if (result.success) {
        toast.success(`Test successful! Created ticket: ${result.testResult.issueKey}`)
      } else {
        toast.error('Test failed: ' + result.error)
      }
    } catch (error) {
      toast.error('Test failed: ' + error.message)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-success-600 bg-success-100'
      case 'pending':
        return 'text-warning-600 bg-warning-100'
      case 'suspended':
        return 'text-error-600 bg-error-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getSetupStatusColor = (setupStatus) => {
    switch (setupStatus) {
      case 'completed':
        return 'text-success-600 bg-success-100'
      case 'in_progress':
        return 'text-primary-600 bg-primary-100'
      case 'failed':
        return 'text-error-600 bg-error-100'
      default:
        return 'text-warning-600 bg-warning-100'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="h-8 w-8 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-600">Loading dashboard...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Overview of your JARVIS AI Platform
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Building2 className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Companies
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stats.totalCompanies}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-success-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Active Companies
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stats.activeCompanies}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-warning-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Pending Setup
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stats.pendingSetup}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Zap className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Tickets
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stats.totalTickets}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Companies */}
      <div className="card">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Recent Companies
          </h3>
          <div className="mt-5">
            {companies.length === 0 ? (
              <div className="text-center py-6">
                <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No companies yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating your first company.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Setup Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tickets Used
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {companies.slice(0, 10).map((company) => (
                      <tr key={company._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                                <Building2 className="h-4 w-4 text-primary-600" />
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(company.status)}`}>
                            {company.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSetupStatusColor(company.jiraConfig?.setupStatus || 'pending')}`}>
                            {company.jiraConfig?.setupStatus || 'pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {company.subscription?.ticketsUsed || 0} / {company.subscription?.maxTickets || 100}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => testWebhook(company._id)}
                            className="text-primary-600 hover:text-primary-900"
                            disabled={company.jiraConfig?.setupStatus !== 'completed'}
                          >
                            Test Webhook
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Building2 className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-5">
              <h3 className="text-sm font-medium text-gray-900">
                Add New Company
              </h3>
              <p className="text-sm text-gray-500">
                Create a new company workspace
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-5">
              <h3 className="text-sm font-medium text-gray-900">
                Manage Companies
              </h3>
              <p className="text-sm text-gray-500">
                View and manage all companies
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Phone className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-5">
              <h3 className="text-sm font-medium text-gray-900">
                Test Integration
              </h3>
              <p className="text-sm text-gray-500">
                Test voicemail processing
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
