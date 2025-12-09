'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

interface Conversation {
  id: string
  user1_id: string
  user2_id: string
  created_at: string
  updated_at: string
  otherUser: {
    id: string
    name: string
    avatar_url?: string
  }
  latestMessage: {
    content: string
    created_at: string
  } | null
  unreadCount: number
}

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  read: boolean
  created_at: string
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [otherUser, setOtherUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)

  const searchParams = useSearchParams()
  const conversationIdParam = searchParams.get('conversationId')

  useEffect(() => {
    setMounted(true)
    const loadUserAndConversations = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
        await loadConversations()
      }
      setLoading(false)
    }
    loadUserAndConversations()
  }, [])

  // Auto-select conversation from URL
  useEffect(() => {
    if (conversationIdParam && !selectedConversation && currentUserId) {
      if (conversations.length > 0) {
        // Try to find in loaded conversations
        const targetConv = conversations.find(c => c.id === conversationIdParam)
        if (targetConv) {
          loadMessages(targetConv)
        } else {
          // Not found in list, try to load directly
          loadConversationById(conversationIdParam)
        }
      } else if (!loading) {
        // Conversations loaded but empty (or failed), try to load directly
        loadConversationById(conversationIdParam)
      }
    }
  }, [conversations, conversationIdParam, loading, currentUserId])

  const loadConversations = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        // Only show error if we expected to be authenticated (handled by auth guard usually)
        return
      }

      const response = await fetch('/api/messages/conversations', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      const data = await response.json()

      if (data.success) {
        setConversations(data.conversations)
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
      toast.error('Failed to load conversations')
    }
  }

  const loadConversationById = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const response = await fetch(`/api/messages/${id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      const data = await response.json()

      if (data.success) {
        // Construct conversation object
        const conversation: Conversation = {
          ...data.conversation,
          otherUser: data.otherUser,
          latestMessage: data.messages && data.messages.length > 0
            ? data.messages[data.messages.length - 1]
            : null,
          unreadCount: 0 // Assume read since we just loaded it
        }

        setSelectedConversation(conversation)
        setMessages(data.messages)
        setOtherUser(data.otherUser)

        // Optionally add to conversations list if not present
        setConversations(prev => {
          if (!prev.find(c => c.id === conversation.id)) {
            return [conversation, ...prev]
          }
          return prev
        })
      } else {
        toast.error('Conversation not found')
      }
    } catch (error) {
      console.error('Error loading conversation:', error)
      toast.error('Failed to load conversation')
    }
  }

  const loadMessages = async (conversation: Conversation) => {
    try {
      setSelectedConversation(conversation)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        toast.error('Not authenticated')
        return
      }

      const response = await fetch(`/api/messages/${conversation.id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      const data = await response.json()

      if (data.success) {
        setMessages(data.messages)
        setOtherUser(data.otherUser)

        // Reload conversations to update unread counts
        await loadConversations()
      }
    } catch (error) {
      console.error('Error loading messages:', error)
      toast.error('Failed to load messages')
    }
  }

  const sendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return

    setSending(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        toast.error('Not authenticated')
        setSending(false)
        return
      }

      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          content: newMessage.trim()
        })
      })

      const data = await response.json()

      if (data.success) {
        // Add message to local state
        setMessages(prev => [...prev, data.message])
        setNewMessage('')

        // Reload conversations to update preview
        await loadConversations()
      } else {
        toast.error(data.error || 'Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 mb-2">
          💬 Messages
        </h1>
        <p className="text-gray-400">
          Connect with conscious creators in the Timeline Alchemy community
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
        {/* Conversations List */}
        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-purple-500/30 lg:col-span-1 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-white">Conversations</CardTitle>
            <CardDescription className="text-gray-400">
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-y-auto h-[calc(100%-120px)]">
            {conversations.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">💬</div>
                <p className="text-gray-400 mb-4">No conversations yet</p>
                <p className="text-gray-500 text-sm">
                  Start connecting with other creators by viewing their portfolios and sending messages!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => loadMessages(conv)}
                    className={`p-4 rounded-lg cursor-pointer transition-all duration-300 ${selectedConversation?.id === conv.id
                      ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 border-2 border-purple-500'
                      : 'bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700'
                      }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-purple-500/50 flex-shrink-0">
                          {conv.otherUser.avatar_url ? (
                            <img
                              src={conv.otherUser.avatar_url}
                              alt={conv.otherUser.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback to gradient on error
                                const target = e.currentTarget as HTMLImageElement
                                target.style.display = 'none'
                                const fallback = document.createElement('div')
                                fallback.className = 'w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold'
                                fallback.textContent = conv.otherUser.name.charAt(0).toUpperCase()
                                target.parentElement?.appendChild(fallback)
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                              {conv.otherUser.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{conv.otherUser.name}</p>
                          <p className="text-xs text-gray-500">Timeline Alchemy Creator</p>
                        </div>
                      </div>
                      {conv.unreadCount > 0 && (
                        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                          {conv.unreadCount}
                        </div>
                      )}
                    </div>
                    {conv.latestMessage && (
                      <div>
                        <p className="text-sm text-gray-400 truncate">
                          {conv.latestMessage.content}
                        </p>
                        {mounted && (
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDistanceToNow(new Date(conv.latestMessage.created_at), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Messages View */}
        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-purple-500/30 lg:col-span-2 overflow-hidden flex flex-col">
          {selectedConversation ? (
            <>
              <CardHeader className="border-b border-purple-500/30">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-purple-500/50 flex-shrink-0">
                    {otherUser?.avatar_url ? (
                      <img
                        src={otherUser.avatar_url}
                        alt={otherUser.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to gradient on error
                          const target = e.currentTarget as HTMLImageElement
                          target.style.display = 'none'
                          const fallback = document.createElement('div')
                          fallback.className = 'w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl'
                          fallback.textContent = otherUser?.name?.charAt(0).toUpperCase()
                          target.parentElement?.appendChild(fallback)
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
                        {otherUser?.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-white">{otherUser?.name}</CardTitle>
                    <CardDescription className="text-gray-400">Timeline Alchemy Creator</CardDescription>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">✨</div>
                    <p className="text-gray-400">
                      Start the conversation with a conscious creator!
                    </p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isMine = message.sender_id === currentUserId
                    return (
                      <div
                        key={message.id}
                        className={`flex gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isMine && otherUser?.avatar_url && (
                          <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-purple-500/50 flex-shrink-0 mt-1">
                            <img
                              src={otherUser.avatar_url}
                              alt={otherUser.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement
                                target.style.display = 'none'
                                const fallback = document.createElement('div')
                                fallback.className = 'w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs'
                                fallback.textContent = otherUser?.name?.charAt(0).toUpperCase()
                                target.parentElement?.appendChild(fallback)
                              }}
                            />
                          </div>
                        )}
                        {!isMine && !otherUser?.avatar_url && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs border-2 border-purple-500/50 flex-shrink-0 mt-1">
                            {otherUser?.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div
                          className={`max-w-[70%] rounded-lg p-4 ${isMine
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                            : 'bg-gray-700 text-gray-200'
                            }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{message.content}</p>
                          {mounted && (
                            <p className={`text-xs mt-2 ${isMine ? 'text-purple-200' : 'text-gray-400'}`}>
                              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>

              {/* Send Message */}
              <div className="border-t border-purple-500/30 p-4">
                <div className="flex gap-2">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-gray-800 border-purple-500/30 text-white resize-none"
                    rows={3}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={sending || !newMessage.trim()}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 self-end"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      '📤 Send'
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-8xl mb-4">💬</div>
                <p className="text-2xl text-gray-300 mb-2">Select a conversation</p>
                <p className="text-gray-500">
                  Choose a conversation from the list to start messaging
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

