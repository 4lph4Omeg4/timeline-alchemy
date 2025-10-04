import BulkContentGenerator from '@/components/bulk-content-generator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Database, Zap, Sparkles } from 'lucide-react'

export default function BulkContentPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-yellow-400" />
          ✨ Bulk Content Generator
        </h1>
        <p className="text-gray-300 mt-2">
          Generate multiple blog posts from your Grok trends data automatically with Timeline Alchemy magic
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-white">
              <FileText className="h-5 w-5 text-purple-400" />
              📊 Import Grok Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-gray-200">
              Paste your JSON arrays from Grok trends directly into the generator. 
              Supports multiple format configurations with Timeline Alchemy intelligence.
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border-green-500/30 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-white">
              <Database className="h-5 w-5 text-green-400" />
              🚀 Bulk Processing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-gray-200">
              Process dozens of trends simultaneously. AI generates unique content 
              for each trend based on summaries, audience, and tone with magical precision.
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-900/20 to-purple-900/20 border-yellow-500/30 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-white">
              <Zap className="h-5 w-5 text-yellow-400" />
              ✨ Multi-Platform
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-gray-200">
              Generate blog posts, social media content, or mixed formats. 
              Includes hashtags, CTAs, and audience targeting with Timeline Alchemy enhancement.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Usage Instructions */}
      <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-500/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-400" />
            ✨ How to Use Timeline Alchemy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h4 className="font-semibold text-purple-300 flex items-center gap-2">
                📊 1. Prepare Your Grok Data
              </h4>
              <p className="text-sm text-gray-200 mt-2">
                Copy your trends array from Grok and ensure it follows the expected format with items like trend, summary, keywords, audience, etc. 
                Timeline Alchemy will automatically parse and enhance your data.
              </p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h4 className="font-semibold text-green-300 flex items-center gap-2">
                ⚙️ 2. Configure Generation
              </h4>
              <p className="text-sm text-gray-200 mt-2">
                Choose content type (blog/social/mixed) and language (Nederlands/English) based on your needs. 
                Timeline Alchemy will optimize prompts for maximum engagement.
              </p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-300 flex items-center gap-2">
                🚀 3. Generate & Save
              </h4>
              <p className="text-sm text-gray-200 mt-2">
                The AI will create unique content for each trend. Save individual posts as packages or copy them for WordPress publishing. 
                Each post is optimized with Timeline Alchemy's magical enhancement.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Generator Component */}
      <BulkContentGenerator />
    </div>
  )
}
