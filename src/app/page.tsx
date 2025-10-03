import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle2, Shield, Clock, TrendingUp, FileCheck, AlertCircle } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">ScotComply</span>
          </div>
          <div className="flex gap-3">
            <Link href="/auth/signin">
              <Button variant="ghost" size="lg">Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
            Stay Compliant.<br />
            <span className="text-blue-600">Stay Protected.</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            The complete compliance management platform for Scottish letting agents and landlords. 
            Automate compliance tracking, reduce risk, and focus on growing your business.
          </p>
          <div className="flex gap-4 justify-center mb-12">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                View Demo
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="flex justify-center gap-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span>All 32 Scottish Councils</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span>GDPR Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span>ISO 27001 Security</span>
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">
              Why Leading Agents Choose ScotComply
            </h2>
            <p className="text-center text-gray-600 mb-12 text-lg">
              Reduce compliance workload by 70% and eliminate regulatory risks
            </p>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Save 15+ Hours/Week</h3>
                <p className="text-gray-600">
                  Automated tracking and reminders eliminate manual spreadsheet management
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Zero Compliance Gaps</h3>
                <p className="text-gray-600">
                  Never miss a deadline with intelligent alerts and comprehensive tracking
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Reduce Costs by 40%</h3>
                <p className="text-gray-600">
                  Avoid penalties, streamline operations, and optimize resource allocation
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">
              Complete Compliance Coverage
            </h2>
            <p className="text-center text-gray-600 mb-12 text-lg">
              Everything you need to manage Scottish letting compliance in one platform
            </p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                <FileCheck className="h-10 w-10 text-blue-600 mb-4" />
                <h3 className="font-bold text-lg mb-2">Landlord Registration</h3>
                <p className="text-gray-600 text-sm">
                  Centralized tracking across all 32 councils with automated renewal alerts
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                <FileCheck className="h-10 w-10 text-green-600 mb-4" />
                <h3 className="font-bold text-lg mb-2">Certificate Management</h3>
                <p className="text-gray-600 text-sm">
                  Gas Safety, EICR, EPC, and PAT testing with expiry tracking and document storage
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                <FileCheck className="h-10 w-10 text-purple-600 mb-4" />
                <h3 className="font-bold text-lg mb-2">HMO Licensing</h3>
                <p className="text-gray-600 text-sm">
                  Automated license tracking, fire safety compliance, and occupancy management
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                <FileCheck className="h-10 w-10 text-orange-600 mb-4" />
                <h3 className="font-bold text-lg mb-2">Repairing Standard</h3>
                <p className="text-gray-600 text-sm">
                  Digital 21-point checklist with photo evidence and tribunal-ready reports
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                <AlertCircle className="h-10 w-10 text-red-600 mb-4" />
                <h3 className="font-bold text-lg mb-2">AML Compliance</h3>
                <p className="text-gray-600 text-sm">
                  Automated tenant screening against sanctions lists, PEPs, and adverse media
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                <TrendingUp className="h-10 w-10 text-indigo-600 mb-4" />
                <h3 className="font-bold text-lg mb-2">Council Intelligence</h3>
                <p className="text-gray-600 text-sm">
                  Real-time regulatory updates and region-specific compliance requirements
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Transform Your Compliance Management?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join hundreds of Scottish letting agents saving time and reducing risk
            </p>
            <Link href="/auth/signup">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="text-blue-200 mt-4 text-sm">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-6 w-6 text-blue-400" />
            <span className="text-xl font-bold text-white">ScotComply</span>
          </div>
          <p className="text-sm">
            © 2025 ScotComply. All rights reserved. Compliance management for Scottish letting professionals.
          </p>
        </div>
      </footer>
    </main>
  )
}
