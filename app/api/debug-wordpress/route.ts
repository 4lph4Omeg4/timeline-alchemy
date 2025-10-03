import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { siteUrl, username, password, testAction } = await request.json()
    
    if (!siteUrl || !username || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Site URL, username, and password are required' 
      })
    }

    console.log('🔍 WordPress Debug - Starting diagnostics')
    console.log('Site URL:', siteUrl)
    console.log('Username:', username)
    console.log('Password length:', password.length)
    console.log('Test Action:', testAction)

    // Clean up the site URL (remove trailing slash)
    const cleanSiteUrl = siteUrl.replace(/\/$/, '')
    
    // Check if it's a WordPress.com site
    const isWordPressCom = cleanSiteUrl.includes('.wordpress.com')
    
    console.log('Clean Site URL:', cleanSiteUrl)
    console.log('Is WordPress.com:', isWordPressCom)

    const debugResults = {
      siteUrl: cleanSiteUrl,
      isWordPressCom,
      apiEndpoints: {},
      tests: {}
    }

    // Test 1: Check if site is accessible
    try {
      const basicResponse = await fetch(cleanSiteUrl, {
        method: 'GET',
        timeout: 10000
      } as any)
      
      debugResults.tests.basicAccessibility = {
        status: basicResponse.status,
        ok: basicResponse.ok,
        headers: {
          'content-type': basicResponse.headers.get('content-type'),
          'server': basicResponse.headers.get('server')
        }
      }
      
      console.log('✅ Basic accessibility test:', basicResponse.status)
    } catch (error) {
      debugResults.tests.basicAccessibility = {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      console.log('❌ Basic accessibility failed:', error)
    }

    // Test 2: Check WordPress REST API availability
    const apiEndpoints = [
      'wp-json/wp/v2/',
      'wp-json/wp/v2/users/me',
      'wp-json/wp/v2/posts',
      'wp-json/wp/v2/sites', // WordPress.com specific
    ]

    for (const endpoint of apiEndpoints) {
      try {
        const apiUrl = `${cleanSiteUrl}/${endpoint}`
        console.log('🔍 Testing endpoint:', apiUrl)
        
        let response
        if (endpoint === 'wp-json/wp/v2/sites') {
          // Test site info endpoint (WordPress.com specific)
          response = await fetch(`${cleanSiteUrl}/wp-json/`, {
            method: 'GET',
            headers: {
              'User-Agent': 'Timeline-Alchemy/1.0'
            },
            timeout: 10000
          } as any)
        } else if (endpoint === 'wp-json/wp/v2/users/me' || endpoint === 'wp-json/wp/v2/posts') {
          // Test authenticated endpoint
          response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
              'Content-Type': 'application/json',
              'User-Agent': 'Timeline-Alchemy/1.0'
            },
            timeout: 10000
          } as any)
        } else {
          // Test public endpoint
          response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'User-Agent': 'Timeline-Alchemy/1.0'
            },
            timeout: 10000
          } as any)
        }

        debugResults.apiEndpoints[endpoint] = {
          url: apiUrl,
          status: response.status,
          ok: response.ok,
          contentType: response.headers.get('content-type'),
          error: null
        }

        if (response.ok) {
          try {
            const data = await response.json()
            
            if (endpoint === 'wp-json/wp/v2/users/me') {
              debugResults.tests.authentication = {
                success: true,
                user: {
                  id: data.id,
                  name: data.name,
                  slug: data.slug
                }
              }
            }
            
            if (endpoint === 'wp-json/wp/v2/posts') {
              debugResults.tests.postingCapability = {
                success: true,
                message: 'Can read posts (posting capability needs further testing)'
              }
            }

            console.log(`✅ ${endpoint} - Status: ${response.status}`)
          } catch (parseError) {
            debugResults.apiEndpoints[endpoint].parseError = parseError instanceof Error ? parseError.message : 'Parse error'
            console.log(`⚠️ ${endpoint} - Response not JSON:`, response.status)
          }
        } else {
          debugResults.apiEndpoints[endpoint].error = `HTTP ${response.status}`
          console.log(`❌ ${endpoint} - Status: ${response.status}`)
        }
      } catch (error) {
        debugResults.apiEndpoints[endpoint] = {
          url: `${cleanSiteUrl}/${endpoint}`,
          error: error instanceof Error ? error.message : 'Unknown error',
          timeout: true
        }
        console.log(`❌ ${endpoint} - Error:`, error)
      }
    }

    // Test 3: Try to authenticate (if testAction is 'test_post')
    if (testAction === 'test_post') {
      console.log('🚀 Testing WordPress posting capability...')
      
      try {
        const testPostUrl = `${cleanSiteUrl}/wp-json/wp/v2/posts`
        
        const postResponse = await fetch(testPostUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
            'User-Agent': 'Timeline-Alchemy/1.0'
          },
          body: JSON.stringify({
            title: 'Timeline Alchemy Test Post',
            content: 'This is a test post from Timeline Alchemy to verify WordPress integration.',
            status: 'draft', // Use draft first to avoid spam
            meta: {
              'timeline_alchemy_test': true
            }
          }),
          timeout: 15000
        } as any)

        if (postResponse.ok) {
          const postData = await postResponse.json()
          debugResults.tests.postingTest = {
            success: true,
            postId: postData.id,
            message: 'Successfully created test post'
          }
          console.log('✅ WordPress posting test successful!')
          
          // Clean up: delete the test post
          try {
            await fetch(`${cleanSiteUrl}/wp-json/wp/v2/posts/${postData.id}?force=true`, {
              method: 'DELETE',
              headers: {
                'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')
              }
            })
            console.log('✅ Cleaned up test post')
          } catch (cleanupError) {
            console.log('⚠️ Could not clean up test post (non-critical)')
          }
        } else {
          const errorData = await postResponse.json().catch(() => ({ message: 'Unknown error' }))
          debugResults.tests.postingTest = {
            success: false,
            error: `HTTP ${postResponse.status}: ${errorData.message || postResponse.statusText}`
          }
          console.log('❌ WordPress posting test failed:', postResponse.status, errorData.message)
        }
      } catch (error) {
        debugResults.tests.postingTest = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
        console.log('❌ WordPress posting test errored:', error)
      }
    }

    // Test 4: Check WordPress.com specific endpoints
    if (isWordPressCom) {
      try {
        const comResponse = await fetch(`${cleanSiteUrl}/wp-json/wp/v2/sites`, {
          method: 'GET',
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
            'User-Agent': 'Timeline-Alchemy/1.0'
          },
          timeout: 10000
        } as any)
        
        debugResults.tests.wordpressComApi = {
          status: comResponse.status,
          ok: comResponse.ok,
          available: comResponse.ok
        }
        
        console.log(`🔍 WordPress.com API test: ${comResponse.status}`)
      } catch (error) {
        debugResults.tests.wordpressComApi = {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
        console.log('❌ WordPress.com API test failed:', error)
      }
    }

    console.log('🎯 WordPress Debug - Diagnostics complete')
    console.log('Results:', JSON.stringify(debugResults, null, 2))

    return NextResponse.json({
      success: true,
      debugResults,
      summary: {
        siteAccessible: debugResults.tests.basicAccessibility?.ok || false,
        hasAuthentication: debugResults.tests.authentication?.success || false,
        canPost: debugResults.tests.postingTest?.success || false,
        isWordPressCom: isWordPressCom
      }
    })
    
  } catch (error) {
    console.error('WordPress debug error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
