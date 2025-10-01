import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy | Timeline Alchemy',
  description: 'Privacy Policy for Timeline Alchemy - Learn how we collect, use, and protect your data.',
}

export default function PrivacyPolicyPage() {
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
        <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-gray-200">
          <p className="text-lg">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">1. Introduction</h2>
            <p>
              Welcome to Timeline Alchemy ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered content creation platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">2. Information We Collect</h2>
            <p>We collect information that you provide directly to us, including:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Information:</strong> Name, email address, password, and organization details</li>
              <li><strong>Content Data:</strong> Blog posts, social media content, images, and scheduling information you create through our platform</li>
              <li><strong>Payment Information:</strong> Payment card details and billing information (processed securely through Stripe)</li>
              <li><strong>Usage Data:</strong> Information about how you use our platform, including features accessed and content generated</li>
              <li><strong>Social Media Connections:</strong> When you connect social media accounts, we receive authorization tokens to publish on your behalf</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide, maintain, and improve our AI content generation services</li>
              <li>Process your transactions and manage your subscriptions</li>
              <li>Send you technical notices, updates, and support messages</li>
              <li>Respond to your comments, questions, and customer service requests</li>
              <li>Generate AI-powered content based on your prompts and preferences</li>
              <li>Publish content to your connected social media platforms</li>
              <li>Analyze usage patterns to improve our platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">4. Data Storage and Security</h2>
            <p>
              We store your data securely using industry-standard encryption and security measures. Your data is stored on servers provided by Supabase and Vercel, with data centers located in the European Union. We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">5. AI and Third-Party Services</h2>
            <p>
              Our platform uses OpenAI's GPT-4 and DALL-E for content generation. When you use our AI features, your prompts and generated content are processed by OpenAI's servers. We also use:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Stripe:</strong> For payment processing</li>
              <li><strong>Social Media APIs:</strong> To publish content to your connected accounts (Twitter, LinkedIn, Instagram, Facebook, YouTube, TikTok)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">6. Your Rights</h2>
            <p>Under GDPR and other privacy laws, you have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to or restrict processing</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>
            <p className="mt-4">
              To exercise these rights, please contact us at <a href="mailto:timeline-alchemy@sh4m4ni4k.nl" className="text-yellow-400 hover:underline">timeline-alchemy@sh4m4ni4k.nl</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">7. Cookies</h2>
            <p>
              We use cookies and similar tracking technologies to track activity on our platform and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">8. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. When you delete your account, we will delete or anonymize your personal data within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">9. Children's Privacy</h2>
            <p>
              Our platform is not intended for children under 16 years of age. We do not knowingly collect personal information from children under 16. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">11. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us:
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

