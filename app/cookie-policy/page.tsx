import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata = {
  title: 'Cookie Policy | Timeline Alchemy',
  description: 'Cookie Policy for Timeline Alchemy - Learn about how we use cookies and similar technologies.',
}

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900">
      {/* Header */}
      <header className="bg-gray-900 shadow-sm border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/">
              <Logo size="md" showText={false} />
            </Link>
            <Link href="/">
              <Button variant="outline">Back to Home</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold text-white mb-8">Cookie Policy</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-gray-200">
          <p className="text-lg">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">1. What Are Cookies?</h2>
            <p>
              Cookies are small text files that are placed on your computer or mobile device when you visit our website. They are widely used to make websites work more efficiently and to provide information to website owners about how users interact with their sites.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">2. How We Use Cookies</h2>
            <p>Timeline Alchemy uses cookies for several purposes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Essential Cookies:</strong> These cookies are necessary for the website to function properly and cannot be disabled</li>
              <li><strong>Authentication Cookies:</strong> To keep you logged in and maintain your session</li>
              <li><strong>Preference Cookies:</strong> To remember your settings and preferences</li>
              <li><strong>Analytics Cookies:</strong> To understand how visitors use our website and improve its performance</li>
              <li><strong>Functional Cookies:</strong> To provide enhanced functionality and personalization</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">3. Types of Cookies We Use</h2>
            
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Essential Cookies</h3>
            <p>These cookies are strictly necessary for the operation of our website. They include:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Session cookies to maintain your login state</li>
              <li>Security cookies to protect against cross-site request forgery</li>
              <li>Load balancing cookies to ensure optimal website performance</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Analytics Cookies</h3>
            <p>We use analytics cookies to understand how our website is used:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Google Analytics to track website usage and performance</li>
              <li>Custom analytics to measure user engagement with our AI features</li>
              <li>Performance monitoring to identify and fix technical issues</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Functional Cookies</h3>
            <p>These cookies enable enhanced functionality:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Language preference settings</li>
              <li>Theme preferences (dark/light mode)</li>
              <li>Content creation preferences and templates</li>
              <li>Social media connection status</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">4. Third-Party Cookies</h2>
            <p>We may use third-party services that set their own cookies:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Stripe:</strong> Payment processing cookies for secure transactions</li>
              <li><strong>Supabase:</strong> Authentication and database cookies</li>
              <li><strong>OpenAI:</strong> AI service integration cookies</li>
              <li><strong>Social Media Platforms:</strong> OAuth integration cookies for connected accounts</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">5. Managing Your Cookie Preferences</h2>
            <p>You can control and manage cookies in several ways:</p>
            
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Browser Settings</h3>
            <p>Most web browsers allow you to control cookies through their settings preferences. You can:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Block all cookies</li>
              <li>Allow only first-party cookies</li>
              <li>Delete existing cookies</li>
              <li>Set preferences for specific websites</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Cookie Consent</h3>
            <p>
              When you first visit our website, you'll see a cookie consent banner. You can choose to accept all cookies, reject non-essential cookies, or customize your preferences. You can change your preferences at any time through your account settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">6. Impact of Disabling Cookies</h2>
            <p>Please note that disabling certain cookies may affect the functionality of our website:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You may need to log in repeatedly</li>
              <li>Some features may not work properly</li>
              <li>Your preferences may not be saved</li>
              <li>Content creation and scheduling features may be limited</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">7. Cookie Retention</h2>
            <p>Different cookies have different retention periods:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Session Cookies:</strong> Deleted when you close your browser</li>
              <li><strong>Persistent Cookies:</strong> Remain on your device for a set period (typically 30 days to 2 years)</li>
              <li><strong>Authentication Cookies:</strong> Typically expire after 30 days of inactivity</li>
              <li><strong>Preference Cookies:</strong> May persist for up to 1 year</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">8. Updates to This Policy</h2>
            <p>
              We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the updated policy on our website and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">9. Contact Us</h2>
            <p>
              If you have any questions about our use of cookies or this Cookie Policy, please contact us:
            </p>
            <ul className="list-none space-y-2 mt-4">
              <li><strong>Email:</strong> <a href="mailto:timeline-alchemy@sh4m4ni4k.nl" className="text-yellow-400 hover:underline">timeline-alchemy@sh4m4ni4k.nl</a></li>
              <li><strong>Address:</strong> Poststraat 47B, 6371VL, Landgraaf, Netherlands</li>
            </ul>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black text-gray-200 py-8 mt-16 border-t border-gray-800">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} Timeline Alchemy. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
