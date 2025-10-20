import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle2, Clock, TrendingUp, FileCheck, AlertCircle, Lock, Star } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L4 6V11C4 16.55 7.84 21.74 12 23C16.16 21.74 20 16.55 20 11V6L12 2Z" fill="#3b82f6" stroke="#1e3a8a" strokeWidth="2"/>
                <path d="M9 12L11 14L15 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-3xl font-extrabold text-gray-900">
              ScotComply
            </span>
          </div>
          <div className="flex gap-3">
            <Link href="/auth/signin">
              <Button variant="ghost" size="lg" className="font-semibold">Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg font-semibold">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Enhanced with Brand Identity */}
      <section className="relative container mx-auto px-4 py-20 overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200 rounded-full opacity-10 blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-200 rounded-full opacity-10 blur-3xl -z-10"></div>
        
        <div className="max-w-5xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-7xl font-extrabold text-gray-900 mb-4 leading-tight">
              Stay Compliant.<br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Stay Protected.
              </span>
            </h1>
            <p className="text-2xl text-gray-700 font-medium mb-2">
              Complete Compliance Management for Scottish Letting
            </p>
          </div>
          
          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Automate compliance tracking, reduce risk by <span className="font-bold text-blue-600">70%</span>, and focus on growing your business. 
            The platform trusted by leading Scottish letting agents.
          </p>
          
          <div className="flex gap-4 justify-center mb-12">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-lg px-10 py-7 shadow-xl font-semibold">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button variant="outline" size="lg" className="text-lg px-10 py-7 border-2 border-gray-300 hover:border-blue-600 font-semibold">
                Watch Demo
              </Button>
            </Link>
          </div>

          {/* Enhanced Trust Badges */}
          <div className="flex flex-wrap justify-center gap-8 text-base font-semibold">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-gray-800">All 32 Scottish Councils</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
              <Lock className="h-5 w-5 text-blue-600" />
              <span className="text-gray-800">GDPR Compliant</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
              <Star className="h-5 w-5 text-yellow-500" />
              <span className="text-gray-800">ISO 27001 Security</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Enhanced */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-5xl font-extrabold text-center mb-4 bg-gradient-to-r from-blue-900 to-blue-600 bg-clip-text text-transparent">
              Why Leading Agents Choose ScotComply
            </h2>
            <p className="text-center text-gray-600 mb-16 text-xl font-medium">
              Reduce compliance workload by 70% and eliminate regulatory risks
            </p>
            
            <div className="grid md:grid-cols-4 gap-6 mb-16">
              <div className="text-center bg-gradient-to-br from-white to-blue-50 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="text-6xl font-extrabold text-blue-600 mb-3">15+</div>
                <div className="text-lg font-bold text-gray-800">Hours Saved Weekly</div>
              </div>
              
              <div className="text-center bg-gradient-to-br from-white to-green-50 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="text-6xl font-extrabold text-green-600 mb-3">70%</div>
                <div className="text-lg font-bold text-gray-800">Workload Reduction</div>
              </div>
              
              <div className="text-center bg-gradient-to-br from-white to-purple-50 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="text-6xl font-extrabold text-purple-600 mb-3">40%</div>
                <div className="text-lg font-bold text-gray-800">Cost Reduction</div>
              </div>
              
              <div className="text-center bg-gradient-to-br from-white to-indigo-50 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="text-6xl font-extrabold text-indigo-600 mb-3">0</div>
                <div className="text-lg font-bold text-gray-800">Compliance Gaps</div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-10">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Clock className="h-10 w-10 text-white" strokeWidth={2} />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">Save 15+ Hours/Week</h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Automated tracking and reminders eliminate manual spreadsheet management
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L4 6V11C4 16.55 7.84 21.74 12 23C16.16 21.74 20 16.55 20 11V6L12 2Z" fill="white" stroke="white" strokeWidth="1.5"/>
                    <path d="M9 12L11 14L15 10" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">Zero Compliance Gaps</h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Never miss a deadline with intelligent alerts and comprehensive tracking
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <TrendingUp className="h-10 w-10 text-white" strokeWidth={2} />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">Reduce Costs by 40%</h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Avoid penalties, streamline operations, and optimize resource allocation
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid - Enhanced */}
      <section className="py-24 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-5xl font-extrabold text-center mb-4 bg-gradient-to-r from-blue-900 to-blue-600 bg-clip-text text-transparent">
              Complete Compliance Coverage
            </h2>
            <p className="text-center text-gray-600 mb-16 text-xl font-medium">
              Everything you need to manage Scottish letting compliance in one platform
            </p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white p-9 rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 border border-gray-100">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mb-6 shadow-md">
                  <span className="text-3xl">📋</span>
                </div>
                <h3 className="font-bold text-2xl mb-3 text-gray-900">Landlord Registration</h3>
                <p className="text-gray-600 text-base leading-relaxed">
                  Centralized tracking across all 32 councils with automated renewal alerts and seamless management
                </p>
              </div>
              
              <div className="bg-white p-9 rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 border border-gray-100">
                <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center mb-6 shadow-md">
                  <span className="text-3xl">📄</span>
                </div>
                <h3 className="font-bold text-2xl mb-3 text-gray-900">Certificate Management</h3>
                <p className="text-gray-600 text-base leading-relaxed">
                  Gas Safety, EICR, EPC, and PAT testing with expiry tracking and secure document storage
                </p>
              </div>
              
              <div className="bg-white p-9 rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 border border-gray-100">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center mb-6 shadow-md">
                  <span className="text-3xl">🏠</span>
                </div>
                <h3 className="font-bold text-2xl mb-3 text-gray-900">HMO Licensing</h3>
                <p className="text-gray-600 text-base leading-relaxed">
                  Automated license tracking, fire safety compliance, and occupancy management in one place
                </p>
              </div>
              
              <div className="bg-white p-9 rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 border border-gray-100">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl flex items-center justify-center mb-6 shadow-md">
                  <span className="text-3xl">🔧</span>
                </div>
                <h3 className="font-bold text-2xl mb-3 text-gray-900">Repairing Standard</h3>
                <p className="text-gray-600 text-base leading-relaxed">
                  Digital 21-point checklist with photo evidence and tribunal-ready compliance reports
                </p>
              </div>
              
              <div className="bg-white p-9 rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 border border-gray-100">
                <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center mb-6 shadow-md">
                  <span className="text-3xl">🛡️</span>
                </div>
                <h3 className="font-bold text-2xl mb-3 text-gray-900">AML Compliance</h3>
                <p className="text-gray-600 text-base leading-relaxed">
                  Automated tenant screening against sanctions lists, PEPs, and adverse media sources
                </p>
              </div>
              
              <div className="bg-white p-9 rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 border border-gray-100">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center mb-6 shadow-md">
                  <span className="text-3xl">📡</span>
                </div>
                <h3 className="font-bold text-2xl mb-3 text-gray-900">Council Intelligence</h3>
                <p className="text-gray-600 text-base leading-relaxed">
                  Real-time regulatory updates and region-specific compliance requirement notifications
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Enhanced */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-700 to-indigo-600 py-24 overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full opacity-5 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white rounded-full opacity-5 blur-3xl"></div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl font-extrabold text-white mb-6 leading-tight">
              Ready to Transform Your Compliance Management?
            </h2>
            <p className="text-2xl text-blue-100 mb-10 font-medium">
              Join hundreds of Scottish letting agents saving time and reducing risk
            </p>
            <Link href="/auth/signup">
              <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50 text-xl px-12 py-8 shadow-2xl font-bold">
                Start Your Free Trial
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
            </Link>
            <p className="text-blue-200 mt-6 text-lg font-medium">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Footer - Enhanced */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L4 6V11C4 16.55 7.84 21.74 12 23C16.16 21.74 20 16.55 20 11V6L12 2Z" fill="#3b82f6" stroke="#1e3a8a" strokeWidth="2"/>
                    <path d="M9 12L11 14L15 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent">
                  ScotComply
                </span>
              </div>
              <p className="text-gray-400 text-base max-w-2xl">
                Complete compliance management platform for Scottish letting professionals. 
                Stay compliant, stay protected, and focus on growing your business.
              </p>
            </div>
            
            <div className="border-t border-gray-800 pt-8">
              <p className="text-center text-sm text-gray-500">
                © 2025 ScotComply. All rights reserved. Compliance management for Scottish letting professionals.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
