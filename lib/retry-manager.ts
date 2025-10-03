/**
 * Smart Retry Manager - Handles retry logic with exponential backoff
 */

export interface RetryOptions {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
  jitter?: boolean
}

export interface RetryResult<T> {
  success: boolean
  data?: T
  error?: string
  attempts: number
  totalTime: number
}

export class RetryManager {
  private static defaultOptions: Required<RetryOptions> = {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    backoffMultiplier: 2,
    jitter: true
  }

  /**
   * Execute a function with retry logic
   */
  static async execute<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<RetryResult<T>> {
    const opts = { ...this.defaultOptions, ...options }
    const startTime = Date.now()
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
      try {
        const data = await fn()
        return {
          success: true,
          data,
          attempts: attempt + 1,
          totalTime: Date.now() - startTime
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        
        // Don't retry on the last attempt
        if (attempt === opts.maxRetries) {
          break
        }

        // Calculate delay with exponential backoff
        const delay = this.calculateDelay(attempt, opts)
        
        console.log(`🔄 Retry attempt ${attempt + 1}/${opts.maxRetries} failed, retrying in ${delay}ms...`)
        console.log(`   Error: ${lastError.message}`)
        
        await this.sleep(delay)
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Unknown error',
      attempts: opts.maxRetries + 1,
      totalTime: Date.now() - startTime
    }
  }

  /**
   * Calculate delay with exponential backoff and jitter
   */
  private static calculateDelay(attempt: number, options: Required<RetryOptions>): number {
    let delay = options.baseDelay * Math.pow(options.backoffMultiplier, attempt)
    
    // Cap at max delay
    delay = Math.min(delay, options.maxDelay)
    
    // Add jitter to prevent thundering herd
    if (options.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5)
    }
    
    return Math.floor(delay)
  }

  /**
   * Sleep for specified milliseconds
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Check if an error is retryable
   */
  static isRetryableError(error: any): boolean {
    if (!error) return false

    const message = error.message?.toLowerCase() || ''
    const status = error.status || error.statusCode

    // Network errors
    if (message.includes('network') || message.includes('timeout') || message.includes('connection')) {
      return true
    }

    // Rate limiting
    if (status === 429 || message.includes('rate limit') || message.includes('too many requests')) {
      return true
    }

    // Temporary server errors
    if (status >= 500 && status < 600) {
      return true
    }

    // Specific platform errors that are retryable
    const retryablePlatformErrors = [
      'twitter api error',
      'linkedin api error',
      'discord api error',
      'reddit api error',
      'telegram api error',
      'instagram api error',
      'youtube api error'
    ]

    return retryablePlatformErrors.some(errorType => message.includes(errorType))
  }

  /**
   * Platform-specific retry configuration
   */
  static getPlatformRetryConfig(platform: string): RetryOptions {
    const configs: Record<string, RetryOptions> = {
      twitter: {
        maxRetries: 3,
        baseDelay: 2000, // Twitter can be slow
        maxDelay: 30000
      },
      linkedin: {
        maxRetries: 2,
        baseDelay: 1500,
        maxDelay: 20000
      },
      discord: {
        maxRetries: 2,
        baseDelay: 1000,
        maxDelay: 10000
      },
      reddit: {
        maxRetries: 3,
        baseDelay: 2000,
        maxDelay: 30000
      },
      telegram: {
        maxRetries: 2,
        baseDelay: 1000,
        maxDelay: 10000
      },
      instagram: {
        maxRetries: 2,
        baseDelay: 1500,
        maxDelay: 20000
      },
      youtube: {
        maxRetries: 2,
        baseDelay: 2000,
        maxDelay: 30000
      },
      wordpress: {
        maxRetries: 2,
        baseDelay: 1000,
        maxDelay: 15000
      }
    }

    return configs[platform] || this.defaultOptions
  }
}

/**
 * Utility function for easy retry execution
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  platform?: string,
  customOptions?: RetryOptions
): Promise<RetryResult<T>> {
  const options = platform 
    ? { ...RetryManager.getPlatformRetryConfig(platform), ...customOptions }
    : customOptions

  return RetryManager.execute(fn, options)
}
