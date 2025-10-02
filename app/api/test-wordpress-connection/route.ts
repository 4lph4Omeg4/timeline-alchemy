import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { siteUrl, username, password } = await request.json()
    
    if (!siteUrl || !username || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Site URL, username, and password are required' 
      })
    }

    // Clean up the site URL (remove trailing slash)
    const cleanSiteUrl = siteUrl.replace(/\/$/, '')
    
    // Check if it's a WordPress.com site
    const isWordPressCom = cleanSiteUrl.includes('.wordpress.com')
    
    let apiUrl: string
    if (isWordPressCom) {
      // WordPress.com uses a different API structure - try the site info endpoint first
      apiUrl = `${cleanSiteUrl}/wp-json/wp/v2/`
    } else {
      // Self-hosted WordPress
      apiUrl = `${cleanSiteUrl}/wp-json/wp/v2/users/me`
    }
    
    try {
      // Test WordPress connection by fetching user info
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          return NextResponse.json({ 
            success: false, 
            error: 'Invalid credentials. Please check your username and password.' 
          })
        } else if (response.status === 404) {
          if (isWordPressCom) {
            return NextResponse.json({ 
              success: false, 
              error: 'WordPress.com REST API access is limited. Please use a self-hosted WordPress site or check if your WordPress.com site has REST API enabled.' 
            })
          } else {
            return NextResponse.json({ 
              success: false, 
              error: 'WordPress REST API not found. Make sure your site URL is correct and REST API is enabled.' 
            })
          }
        } else {
          return NextResponse.json({ 
            success: false, 
            error: `WordPress API error: ${response.status} ${response.statusText}` 
          })
        }
      }

      const data = await response.json()
      
      // For WordPress.com, we might get site info instead of user info
      if (isWordPressCom) {
        return NextResponse.json({ 
          success: true, 
          message: `Successfully connected to WordPress.com site: ${cleanSiteUrl}`,
          siteData: {
            name: data.name || 'WordPress.com Site',
            description: data.description || '',
            url: data.url || cleanSiteUrl
          }
        })
      } else {
        return NextResponse.json({ 
          success: true, 
          message: `Successfully connected to WordPress as ${data.name || data.slug}`,
          userData: {
            id: data.id,
            name: data.name,
            slug: data.slug
          }
        })
      }
      
    } catch (fetchError) {
      console.error('WordPress connection error:', fetchError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to connect to WordPress. Please check your site URL and ensure it\'s accessible.' 
      })
    }
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    })
  }
}
