'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, ArrowRight, BarChart3, Clock, FileCheck, CheckCircle2 } from 'lucide-react'

export default function SignInPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 text-white mb-16">
            <Shield className="h-10 w-10" />
            <span className="text-3xl font-bold">ScotComply</span>
          </Link>
          
          <div className="space-y-8">
            <div>
              <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
                Welcome Back
              </h1>
              <p className="text-xl text-blue-100">
                Continue managing your compliance with confidence
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 space-y-4">
              <h3 className="text-white font-semibold text-lg">Your Dashboard Awaits</h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-white">
                  <div className="bg-white/20 rounded-lg p-2">
                    <FileCheck className="h-5 w-5" />
                  </div>
                  <span>Track all certificates and registrations</span>
                </div>
                
                <div className="flex items-center gap-3 text-white">
                  <div className="bg-white/20 rounded-lg p-2">
                    <Clock className="h-5 w-5" />
                  </div>
                  <span>Get automated renewal reminders</span>
                </div>
                
                <div className="flex items-center gap-3 text-white">
                  <div className="bg-white/20 rounded-lg p-2">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <span>View compliance analytics and reports</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 text-blue-100 text-sm">
          © 2025 ScotComply. Compliance made simple.
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <Link href="/" className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">ScotComply</span>
            </Link>
          </div>

          <Card className="border-0 shadow-xl">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-3xl font-bold">Sign In</CardTitle>
              <CardDescription className="text-base">
                Access your compliance dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  required
                  disabled={isLoading}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  className="h-11"
                />
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full h-11 text-base bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                {isLoading ? 'Signing in...' : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">New to ScotComply?</span>
                </div>
              </div>
              
              <div className="text-center">
                <Link href="/auth/signup">
                  <Button variant="outline" className="w-full h-11">
                    Create an Account
                  </Button>
                </Link>
              </div>
            </div>
            </CardContent>
          </Card>
          
          {/* Trust badges for mobile */}
          <div className="lg:hidden mt-8 flex justify-center gap-6 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Secure Login</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>256-bit SSL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
