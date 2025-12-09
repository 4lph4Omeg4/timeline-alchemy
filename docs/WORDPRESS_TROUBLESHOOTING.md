# WordPress Integration Troubleshooting Guide

## 🔍 Diagnose WordPress Problemen

### Werkende WordPress Integratie Funcionaliteit

Deze applicatie heeft uw WordPress integratie uitgebreid verbeterd met:

✅ **Comprehensive Debug Tool** - `/api/debug-wordpress` endpoint  
✅ **Enhanced Error Handling** - Betere foutmeldingen voor verschillende scenarios  
✅ **Retry Logic** - Automatische herhaling bij tijdelijke fouten  
✅ **WordPress.com Support** - Speciale handling voor WordPress.com sites  
✅ **Detailed Diagnostics** - Gedetailleerde diagnostiek in de UI  

### Hoe Stap naar Probleemsolving

#### 1. Gebruik de Debug Tool

In het WordPress verbinding scherm:
1. Vul uw WordPress credentials in
2. Klik op de **"Debug"** knop
3. Bekijk de uitgebreIDE diagnostiek resultaten

De debug tool test:
- Site accessibility
- REST API endpoints
- Authentication 
- Posting capabilities
- WordPress.com specifieke handling

#### 2. Veelvoorkomende Problemen en Oplossingen

##### 🚨 WordPress Connection Failed

**Mogelijke oorzaken:**
- Foutieve site URL
- Onjuiste credentials
- REST API niet enabled
- Verkeerde permissions

**Oplossingen:**
```
✅ Verify site URL format: https://yoursite.com (zonder trailing slash)
✅ Check username and password correctness
✅ Ensure WordPress REST API is enabled (usually enabled by default)
✅ Verify user has admin/editor permissions
```

##### 🚨 WordPress.com Limited Access

**Probleem:** WordPress.com heeft beperkte REST API toegang voor posting

**Oplossingen:**
```
🔧 Use Application Passwords instead of regular password
🔧 Check if REST API posting is enabled in WordPress.com settings
🔧 Consider migrating to self-hosted WordPress for full control
🔧 Use WordPress.com Business plan for enhanced API access
```

##### 🚨 Authentication Errors (401/403)

**401 Unauthorized:**
```
🔑 Check username and password are correct
🔑 Verify you're using Application Password for WordPress.com
🔑 Ensure user account is active and not suspended
```

**403 Forbidden:**
```
🛡️ Verify user has sufficient permissions (Editor/Administrator)
🛡️ Check if REST API posting is enabled
🛡️ Look for security plugins blocking API access
```

##### 🚨 REST API Not Found (404)

```
🌐 Ensure WordPress REST API is enabled:
   - Go to WordPress Admin → Settings → Permalinks
   - Save permalink structure (even if unchanged)
   - Check if .htaccess file is writable

🔧 For self-hosted WordPress:
   - Disable caching plugins temporarily
   - Check server configuration supports WordPress REST
```

##### 🚨 Timeout Errors

```
⏱️ WordPress site may be slow or unresponsive
⏱️ Check server performance and hosting provider
⏱️ Try posting smaller content chunks
⏱️ Check if site is experiencing high traffic
```

### 🔧 Technische Verbeteringen die Zijn Toegevoegd

#### Enhanced Error Messages
```javascript
// Specifieke foutmeldingen voor verschillende scenarios
if (response.status === 404) {
  errorMessage += '. Please ensure WordPress REST API is enabled on your site.'
} else if (response.status === 403) {
  errorMessage += '. Please check your permissions and ensure you have posting rights.'
} else if (response.status === 401) {
  errorMessage += '. Please check your WordPress credentials.'
}
```

#### WordPress.com Specific Handling
```javascript
if (isWordPressCom) {
  // WordPress.com vereist application passwords
  headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
    'User-Agent': 'Timeline-Alchemy/1.0',
    'Accept': 'application/json'
  }
}
```

#### Automatic Retry Logic
```javascript
// WordPress retry configuration
wordpress: {
  maxRetries: 2,
  baseDelay: 1000,
  maxDelay: 15000
}
```

#### Debug Endpoint Features
- **Site Accessibility Test** - Tests if WordPress site is accessible
- **API Endpoint Testing** - Tests all relevant WordPress REST API endpoints
- **Authentication Verification** - Verifies user credentials work
- **Posting Capability Test** - Actually creates a test post (as draft, then deletes it)
- **WordPress.com Compatibility** - Special tests for WordPress.com sites

### 🔍 Debug Output Example

De debug tool geeft u deze informatie:
```
✅ Summary:
   - Site Accessible: Yes
   - Authentication: Yes  
   - Can Post: Yes
   - WordPress.com: No

✅ API Endpoints Test:
   - wp-json/wp/v2/ - ✅ 200 OK
   - wp-json/wp/v2/users/me - ✅ 200 OK
   - wp-json/wp/v2/posts - ✅ 200 OK

✅ Connection Tests:
   - Basic Accessibility - ✅ Success
   - Authentication - ✅ Success (User: admin, ID: 1)
   - Posting Test - ✅ Success (Post ID: 123)
```

### 🎯 Recommendations per Scenario

#### For WordPress.com Sites:
```
💡 Use Application Passwords
💡 Check WordPress.com REST API settings
💡 Consider upgrading to Business plan for more API access
💡 Test with smaller content first
```

#### For Self-Hosted WordPress:
```
💡 Ensure REST API is enabled
💡 Check user permissions
💡 Disable security plugins temporarily for testing
💡 Verify .htaccess allows REST API access
```

#### For Development Testing:
```
🔧 Test credentials with Postman or curl first
🔧 Enable WordPress debug mode (WP_DEBUG = true)
🔧 Check error logs on server
🔧 Test with default WordPress theme
```

### 📞 Verdere Hulp

Als problemen blijven bestaan:

1. **Run de Debug Tool** en kopieer de volledige output
2. **Check WordPress logs** op uw server
3. **Test credentials manually** met Postman/curl
4. **Contact hosting provider** voor server-side WordPress configuratie issues
5. **Check WordPress community forums** voor specifieke plugin/theme conflicts

### 🔐 Veiligheidstips

```
🔒 Always use Application Passwords instead of main WordPress password
🔒 Regularly update WordPress and plugins
🔒 Use strong, unique credentials for API access
🔒 Monitor posted content for unauthorized changes
🔒 Consider IP restrictions for API access if needed
```

---

Deze troubleshooting guide zou WordPress integratie problemen moeten helpen identificeren en oplossen. De nieuwe debug tools geven gedetailleerde informatie over waarom verbindingen kunnen falen en bieden specifieke aanbevelingen voor verschillende WordPress configuraties.
