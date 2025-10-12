// Facebook SDK TypeScript definitions
declare global {
  interface Window {
    FB: {
      init(params: {
        appId: string
        cookie?: boolean
        xfbml?: boolean
        version: string
      }): void
      
      AppEvents: {
        logPageView(): void
      }
      
      login(
        callback: (response: {
          authResponse?: {
            accessToken: string
            userID: string
            expiresIn: number
          }
          status: string
        }) => void,
        options?: { scope?: string }
      ): void
      
      logout(callback: () => void): void
      
      getLoginStatus(
        callback: (response: {
          authResponse?: {
            accessToken: string
            userID: string
          }
          status: string
        }) => void
      ): void
      
      api(
        path: string,
        method: string,
        params: any,
        callback: (response: any) => void
      ): void
      
      ui(
        params: {
          method: string
          href?: string
          quote?: string
          hashtag?: string
        },
        callback?: (response: any) => void
      ): void
    }
    
    fbAsyncInit?: () => void
  }
}

export {}

