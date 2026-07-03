import axios from 'axios'

/**
 * Create an authenticated axios instance with Clerk token.
 */
export const createAuthenticatedClient = async (getToken: () => Promise<string | null>) => {
  const token = await getToken()

  return axios.create({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}
