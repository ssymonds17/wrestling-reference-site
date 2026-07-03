import { verifyToken } from '@clerk/backend'
import { createApiResponse } from './utils'

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY

if (!CLERK_SECRET_KEY) {
  throw new Error('CLERK_SECRET_KEY environment variable is required')
}

/**
 * Verify the JWT token from the Authorization header
 * Returns the user ID if valid, or null if invalid/missing
 */
export const verifyAuthToken = async (event: any): Promise<string | null> => {
  const authHeader = event.headers?.Authorization || event.headers?.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)

  try {
    const payload = await verifyToken(token, {
      secretKey: CLERK_SECRET_KEY,
    })

    return payload.sub
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

/**
 * Middleware wrapper that requires authentication
 * Returns 401 if not authenticated, otherwise calls the handler
 */
export const requireAuth = (handler: (event: any, userId: string) => Promise<any>) => {
  return async (event: any) => {
    const userId = await verifyAuthToken(event)

    if (!userId) {
      return createApiResponse(401, {
        message: 'Unauthorized - valid authentication required',
      })
    }

    return handler(event, userId)
  }
}
