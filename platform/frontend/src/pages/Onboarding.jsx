import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { useCompany } from '../contexts/CompanyContext'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { 
  Building2, 
  Plus, 
  Trash2, 
  Save, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle,
  Loader
} from 'lucide-react'

const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'Retail', 
  'Manufacturing', 'Real Estate', 'Consulting', 'Media', 'Other'
]

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-1000', '1000+']

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 
  'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Asia/Shanghai', 'Australia/Sydney'
]

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'ja', label: 'Japanese' },
  { value: 'zh', label: 'Chinese' }
]

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'select', label: 'Dropdown' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' }
]

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical']

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { createCompany } = useCompany()
  const { isAuthenticated } = useAuth()

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      domain: '',
      industry: '',
      size: '',
      contactEmail: '',
      phoneNumber: '',
      jiraConfig: {
        workspaceName: '',
        adminEmail: '',
        timezone: 'UTC',
        language: 'en'
      },
      serviceDeskConfig: {
        workTypes: [
          {
            name: 'General Support',
            description: 'General customer support requests',
            priority: 'Medium',
            fields: [
              { name: 'Summary', type: 'text', required: true, options: [] },
              { name: 'Description', type: 'textarea', required: true, options: [] }
            ]
          }
        ],
        requestTypes: [
          {
            name: 'Technical Support',
            description: 'Technical issues and troubleshooting',
            category: 'Technical',
            slaHours: 24
          }
        ]
      }
    }
  })

  const { fields: workTypeFields, append: appendWorkType, remove: removeWorkType } = useFieldArray({
    control,
    name: 'serviceDeskConfig.workTypes'
  })

  const { fields: requestTypeFields, append: appendRequestType, remove: removeRequestType } = useFieldArray({
    control,
    name: 'serviceDeskConfig.requestTypes'
  })

  const onSubmit = async (data) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to create a company')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createCompany(data)
      if (result.success) {
        toast.success('Company created successfully! Jira workspace setup in progress.')
        setCurrentStep(4) // Show success step
      } else {
        if (result.details) {
          result.details.forEach(detail => {
            toast.error(`${detail.field}: ${detail.message}`)
          })
        } else {
          toast.error(result.error || 'Failed to create company')
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const addWorkType = () => {
    appendWorkType({
      name: '',
      description: '',
      priority: 'Medium',
      fields: [
        { name: 'Summary', type: 'text', required: true, options: [] },
        { name: 'Description', type: 'textarea', required: true, options: [] }
      ]
    })
  }

  const addRequestType = () => {
    appendRequestType({
      name: '',
      description: '',
      category: '',
      slaHours: 24
    })
  }

  const addField = (workTypeIndex) => {
    const currentFields = watch(`serviceDeskConfig.workTypes.${workTypeIndex}.fields`)
    // This would need to be implemented with useFieldArray for nested arrays
    // For now, we'll keep it simple
  }

  if (currentStep === 4) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-100">
            <CheckCircle className="h-8 w-8 text-success-600" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Company Created Successfully!</h2>
          <p className="mt-2 text-gray-600">
            Your company has been created and your Jira workspace setup is in progress. 
            You'll receive an email once the setup is complete.
          </p>
          <div className="mt-6">
            <a href="/companies" className="btn-primary">
              View All Companies
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Company Onboarding</h1>
          <p className="mt-2 text-gray-600">
            Set up your company's voicemail-to-ticket automation system
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  step <= currentStep ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  step <= currentStep ? 'text-primary-600' : 'text-gray-500'
                }`}>
                  {step === 1 ? 'Company Info' : step === 2 ? 'Jira Config' : 'Service Desk'}
                </span>
                {step < 3 && (
                  <div className={`ml-4 h-0.5 w-16 ${
                    step < currentStep ? 'bg-primary-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Step 1: Company Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Company Information</h2>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="form-group">
                  <label className="label-required">Company Name</label>
                  <input
                    {...register('name', { required: 'Company name is required' })}
                    className={errors.name ? 'input-error' : 'input'}
                    placeholder="Acme Corporation"
                  />
                  {errors.name && <p className="error-message">{errors.name.message}</p>}
                </div>

                <div className="form-group">
                  <label className="label-required">Domain</label>
                  <input
                    {...register('domain', { required: 'Domain is required' })}
                    className={errors.domain ? 'input-error' : 'input'}
                    placeholder="acme.com"
                  />
                  {errors.domain && <p className="error-message">{errors.domain.message}</p>}
                </div>

                <div className="form-group">
                  <label className="label-required">Industry</label>
                  <select
                    {...register('industry', { required: 'Industry is required' })}
                    className={errors.industry ? 'input-error' : 'input'}
                  >
                    <option value="">Select industry</option>
                    {INDUSTRIES.map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                  {errors.industry && <p className="error-message">{errors.industry.message}</p>}
                </div>

                <div className="form-group">
                  <label className="label-required">Company Size</label>
                  <select
                    {...register('size', { required: 'Company size is required' })}
                    className={errors.size ? 'input-error' : 'input'}
                  >
                    <option value="">Select size</option>
                    {COMPANY_SIZES.map(size => (
                      <option key={size} value={size}>{size} employees</option>
                    ))}
                  </select>
                  {errors.size && <p className="error-message">{errors.size.message}</p>}
                </div>

                <div className="form-group">
                  <label className="label-required">Contact Email</label>
                  <input
                    type="email"
                    {...register('contactEmail', { required: 'Contact email is required' })}
                    className={errors.contactEmail ? 'input-error' : 'input'}
                    placeholder="contact@acme.com"
                  />
                  {errors.contactEmail && <p className="error-message">{errors.contactEmail.message}</p>}
                </div>

                <div className="form-group">
                  <label className="label-required">Phone Number</label>
                  <input
                    {...register('phoneNumber', { required: 'Phone number is required' })}
                    className={errors.phoneNumber ? 'input-error' : 'input'}
                    placeholder="+1 (555) 123-4567"
                  />
                  {errors.phoneNumber && <p className="error-message">{errors.phoneNumber.message}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Jira Configuration */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Jira Workspace Configuration</h2>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="form-group">
                  <label className="label-required">Workspace Name</label>
                  <input
                    {...register('jiraConfig.workspaceName', { required: 'Workspace name is required' })}
                    className={errors.jiraConfig?.workspaceName ? 'input-error' : 'input'}
                    placeholder="acme-support"
                  />
                  {errors.jiraConfig?.workspaceName && <p className="error-message">{errors.jiraConfig.workspaceName.message}</p>}
                </div>

                <div className="form-group">
                  <label className="label-required">Admin Email</label>
                  <input
                    type="email"
                    {...register('jiraConfig.adminEmail', { required: 'Admin email is required' })}
                    className={errors.jiraConfig?.adminEmail ? 'input-error' : 'input'}
                    placeholder="admin@acme.com"
                  />
                  {errors.jiraConfig?.adminEmail && <p className="error-message">{errors.jiraConfig.adminEmail.message}</p>}
                </div>

                <div className="form-group">
                  <label className="label">Timezone</label>
                  <select
                    {...register('jiraConfig.timezone')}
                    className="input"
                  >
                    {TIMEZONES.map(timezone => (
                      <option key={timezone} value={timezone}>{timezone}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="label">Language</label>
                  <select
                    {...register('jiraConfig.language')}
                    className="input"
                  >
                    {LANGUAGES.map(lang => (
                      <option key={lang.value} value={lang.value}>{lang.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Service Desk Configuration */}
          {currentStep === 3 && (
            <div className="space-y-8">
              <h2 className="text-lg font-semibold text-gray-900">Service Desk Configuration</h2>
              
              {/* Work Types */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-md font-medium text-gray-900">Work Types</h3>
                  <button
                    type="button"
                    onClick={addWorkType}
                    className="btn-secondary text-sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Work Type
                  </button>
                </div>
                
                <div className="space-y-4">
                  {workTypeFields.map((field, index) => (
                    <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900">Work Type {index + 1}</h4>
                        {workTypeFields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeWorkType(index)}
                            className="text-error-600 hover:text-error-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="form-group">
                          <label className="label-required">Name</label>
                          <input
                            {...register(`serviceDeskConfig.workTypes.${index}.name`, { required: true })}
                            className="input"
                            placeholder="Technical Support"
                          />
                        </div>
                        
                        <div className="form-group">
                          <label className="label">Priority</label>
                          <select
                            {...register(`serviceDeskConfig.workTypes.${index}.priority`)}
                            className="input"
                          >
                            {PRIORITIES.map(priority => (
                              <option key={priority} value={priority}>{priority}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <label className="label">Description</label>
                        <textarea
                          {...register(`serviceDeskConfig.workTypes.${index}.description`)}
                          className="input"
                          rows={2}
                          placeholder="Description of this work type"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Request Types */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-md font-medium text-gray-900">Request Types</h3>
                  <button
                    type="button"
                    onClick={addRequestType}
                    className="btn-secondary text-sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Request Type
                  </button>
                </div>
                
                <div className="space-y-4">
                  {requestTypeFields.map((field, index) => (
                    <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900">Request Type {index + 1}</h4>
                        {requestTypeFields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRequestType(index)}
                            className="text-error-600 hover:text-error-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="form-group">
                          <label className="label-required">Name</label>
                          <input
                            {...register(`serviceDeskConfig.requestTypes.${index}.name`, { required: true })}
                            className="input"
                            placeholder="Account Issues"
                          />
                        </div>
                        
                        <div className="form-group">
                          <label className="label-required">Category</label>
                          <input
                            {...register(`serviceDeskConfig.requestTypes.${index}.category`, { required: true })}
                            className="input"
                            placeholder="Account"
                          />
                        </div>
                        
                        <div className="form-group">
                          <label className="label">SLA (hours)</label>
                          <input
                            type="number"
                            {...register(`serviceDeskConfig.requestTypes.${index}.slaHours`, { 
                              required: true, 
                              min: 1, 
                              max: 168 
                            })}
                            className="input"
                            placeholder="24"
                          />
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <label className="label">Description</label>
                        <textarea
                          {...register(`serviceDeskConfig.requestTypes.${index}.description`)}
                          className="input"
                          rows={2}
                          placeholder="Description of this request type"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Previous
            </button>

            <div className="flex space-x-3">
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="btn-primary"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-1" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-success disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="h-4 w-4 mr-1 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-1" />
                      Create Company
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
