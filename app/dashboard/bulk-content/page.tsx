import BulkContentGenerator from '@/components/bulk-content-generator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Database, Zap } from 'lucide-react'

export default function BulkContentPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Bulk Content Generator</h1>
        <p className="text-muted-foreground mt-2">
          Generate multiple blog posts from your Grok trends data automatically
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Import Grok Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Paste your JSON arrays from Grok trends directly into the generator. 
              Supports multiple format configurations.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="h-5 w-5" />
              Bulk Processing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Process dozens of trends simultaneously. AI generates unique content 
              for each trend based on summaries, audience, and tone.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5" />
              Multi-Platform
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Generate blog posts, social media content, or mixed formats. 
              Includes hashtags, CTAs, and audience targeting.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold">1. Prepare Your Grok Data</h4>
              <p className="text-sm text-muted-foreground">
                Copy your trends array from Grok and ensure it follows the expected format with items like trend, summary, keywords, audience, etc.
              </p>
            </div>
            <div>
              <h4 className="font-semibold">2. Configure Generation</h4>
              <p className="text-sm text-muted-foreground">
                Choose content type (blog/social/mixed) and language (Nederlands/English) based on your needs.
              </p>
            </div>
            <div>
              <h4 className="font-semibold">3. Generate & Review</h4>
              <p className="text-sm text-muted-foreground">
                The AI will create unique content for each trend. Copy individual posts or process them for WordPress publishing.
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
