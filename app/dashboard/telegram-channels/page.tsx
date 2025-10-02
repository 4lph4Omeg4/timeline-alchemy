'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SocialIcon } from '@/components/ui/social-icons'
import toast from 'react-hot-toast'

interface TelegramChannel {
  id: string
  org_id: string
  channel_id: string
  channel_name: string
  bot_token: string
  created_at: string
}

export default function TelegramChannelsPage() {
  const [channels, setChannels] = useState<TelegramChannel[]>([])
  const [loading, setLoading] = useState(true)
  const [newChannel, setNewChannel] = useState({
    channel_id: '',
    channel_name: '',
    bot_token: ''
  })
  const router = useRouter()

  // Helper function to get user's organization ID
  const getUserOrgId = async (userId: string) => {
    const { data: orgMembers } = await supabase
      .from('org_members')
      .select('org_id, role')
      .eq('user_id', userId)
      .single()

    return orgMembers?.org_id
  }

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          toast.error('Please sign in to view Telegram channels')
          router.push('/auth/signin?redirectTo=' + encodeURIComponent('/dashboard/telegram-channels'))
          return
        }

        // Get the user's organization ID
        const userOrgId = await getUserOrgId(user.id)

        if (!userOrgId) {
          toast.error('No organization found. Please create an organization first.')
          setLoading(false)
          return
        }

        // Fetch Telegram channels for the user's organization
        const { data, error } = await supabase
          .from('telegram_channels')
          .select('*')
          .eq('org_id', userOrgId)

        if (error) {
          console.error('Error fetching Telegram channels:', error)
          toast.error('Failed to fetch Telegram channels')
        } else {
          setChannels(data || [])
        }
      } catch (error) {
        console.error('Unexpected error:', error)
        toast.error('An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchChannels()
  }, [router])

  const handleAddChannel = async () => {
    try {
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        toast.error('Please sign in to add Telegram channels')
        return
      }

      // Get the user's organization ID
      const userOrgId = await getUserOrgId(user.id)

      if (!userOrgId) {
        toast.error('No organization found. Please create an organization first.')
        return
      }

      // Validate input
      if (!newChannel.channel_id || !newChannel.channel_name || !newChannel.bot_token) {
        toast.error('Please fill in all fields')
        return
      }

      // Add the Telegram channel
      const { data, error } = await supabase
        .from('telegram_channels')
        .insert({
          id: crypto.randomUUID(), // Generate UUID explicitly
          org_id: userOrgId,
          channel_id: newChannel.channel_id,
          channel_name: newChannel.channel_name,
          bot_token: newChannel.bot_token
        })
        .select()

      if (error) {
        console.error('Error adding Telegram channel:', error)
        toast.error('Failed to add Telegram channel')
        return
      }

      // Add to local state
      setChannels(prev => [...prev, ...data])
      
      // Reset form
      setNewChannel({
        channel_id: '',
        channel_name: '',
        bot_token: ''
      })

      toast.success('Telegram channel added successfully!')
    } catch (error) {
      console.error('Unexpected error:', error)
      toast.error('An unexpected error occurred')
    }
  }

  const handleDeleteChannel = async (channelId: string) => {
    try {
      const { error } = await supabase
        .from('telegram_channels')
        .delete()
        .eq('id', channelId)

      if (error) {
        console.error('Error deleting Telegram channel:', error)
        toast.error('Failed to delete Telegram channel')
        return
      }

      // Remove from local state
      setChannels(prev => prev.filter(channel => channel.id !== channelId))
      
      toast.success('Telegram channel deleted successfully!')
    } catch (error) {
      console.error('Unexpected error:', error)
      toast.error('An unexpected error occurred')
    }
  }

  const handleTestChannel = async (channel: TelegramChannel) => {
    try {
      const response = await fetch('/api/debug/telegram-send-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel_id: channel.channel_id,
          bot_token: channel.bot_token
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Test message sent successfully!')
      } else {
        toast.error('Failed to send test message: ' + result.error)
      }
    } catch (error) {
      console.error('Error testing channel:', error)
      toast.error('Failed to test channel')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Telegram Channels</h1>
        <p className="text-gray-200 mt-2">
          Manage your Telegram channels for automated posting
        </p>
      </div>

      {/* Add New Channel */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Add Telegram Channel</CardTitle>
          <CardDescription className="text-gray-200">
            Add a Telegram channel to enable automated posting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="channel_id" className="text-white">Channel ID</Label>
              <Input
                id="channel_id"
                placeholder="e.g., @mychannel or -1001234567890"
                value={newChannel.channel_id}
                onChange={(e) => setNewChannel(prev => ({ ...prev, channel_id: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div>
              <Label htmlFor="channel_name" className="text-white">Channel Name</Label>
              <Input
                id="channel_name"
                placeholder="e.g., My Awesome Channel"
                value={newChannel.channel_name}
                onChange={(e) => setNewChannel(prev => ({ ...prev, channel_name: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div>
              <Label htmlFor="bot_token" className="text-white">Bot Token</Label>
              <Input
                id="bot_token"
                placeholder="e.g., 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                value={newChannel.bot_token}
                onChange={(e) => setNewChannel(prev => ({ ...prev, bot_token: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <Button
              onClick={handleAddChannel}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold shadow-lg hover:shadow-purple-500/50"
            >
              Add Channel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing Channels */}
      {channels.length > 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Your Telegram Channels</CardTitle>
            <CardDescription className="text-gray-200">
              Manage your connected Telegram channels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {channels.map((channel) => (
                <div key={channel.id} className="flex items-center justify-between p-6 border border-gray-700 rounded-lg bg-gray-800 hover:bg-gray-750 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-lg">
                      <SocialIcon platform="telegram" size="lg" className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-lg">{channel.channel_name}</h3>
                      <div className="text-sm text-gray-300 space-y-1">
                        <p className="text-blue-400 font-medium">
                          {channel.channel_id}
                        </p>
                        <p className="text-xs text-gray-400">
                          Added on {new Date(channel.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      className="border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white"
                      onClick={() => handleTestChannel(channel)}
                    >
                      Test
                    </Button>
                    <Button
                      variant="outline"
                      className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                      onClick={() => handleDeleteChannel(channel.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-200">
            <div className="flex items-start space-x-3">
              <span className="text-yellow-400 mt-0.5">•</span>
              <p>Create a Telegram bot using @BotFather</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-yellow-400 mt-0.5">•</span>
              <p>Add the bot to your channel as an administrator</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-yellow-400 mt-0.5">•</span>
              <p>Give the bot permission to post messages</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-yellow-400 mt-0.5">•</span>
              <p>Use the Channel ID (e.g., @mychannel or -1001234567890)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
