import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  Phone, 
  Zap, 
  Building2, 
  Users, 
  CheckCircle, 
  ArrowRight,
  Star,
  Shield,
  Clock
} from 'lucide-react'

export default function Home() {
  const { isAuthenticated } = useAuth()

  const features = [
    {
      icon: Phone,
      title: 'AI-Powered Transcription',
      description: 'Automatically convert voicemails to text using advanced AI technology'
    },
    {
      icon: Zap,
      title: 'Smart Ticket Creation',
      description: 'Intelligently create Jira tickets with proper categorization and priority'
    },
    {
      icon: Building2,
      title: 'Multi-Tenant Platform',
      description: 'Each company gets their own customized Jira workspace and configuration'
    },
    {
      icon: Users,
      title: 'Team Management',
      description: 'Manage multiple companies and their service desk configurations'
    }
  ]

  const benefits = [
    {
      icon: CheckCircle,
      title: 'Reduced Response Time',
      description: 'Cut down ticket creation time from minutes to seconds'
    },
    {
      icon: Star,
      title: 'Improved Accuracy',
      description: 'AI ensures consistent and accurate ticket categorization'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with reliable uptime'
    },
    {
      icon: Clock,
      title: '24/7 Processing',
      description: 'Round-the-clock voicemail processing and ticket creation'
    }
  ]

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <div className="text-center">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Transform Voicemails into
            <span className="text-primary-600"> Smart Jira Tickets</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Our AI-powered platform automatically converts customer voicemails into structured Jira Service Management tickets, 
            reducing manual work and improving response times for your support team.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            {isAuthenticated ? (
              <Link to="/onboarding" className="btn-primary text-lg px-8 py-3">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-primary text-lg px-8 py-3">
                  Sign In
                </Link>
                <Link to="/onboarding" className="btn-secondary text-lg px-8 py-3">
                  Start Free Trial
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Powerful Features
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Everything you need to automate your voicemail-to-ticket workflow
          </p>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div key={index} className="card text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100">
                  <Icon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Why Choose JARVIS?
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Join companies already transforming their customer support
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <div key={index} className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-success-100">
                    <Icon className="h-6 w-6 text-success-600" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">
                    {benefit.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    {benefit.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-600">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to Get Started?
            </h2>
            <p className="mt-4 text-lg text-primary-100">
              Set up your company's voicemail-to-ticket automation in minutes
            </p>
            <div className="mt-8">
              {isAuthenticated ? (
                <Link to="/onboarding" className="btn bg-white text-primary-600 hover:bg-gray-50 text-lg px-8 py-3">
                  Create Your Workspace
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              ) : (
                <Link to="/login" className="btn bg-white text-primary-600 hover:bg-gray-50 text-lg px-8 py-3">
                  Sign In to Continue
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
