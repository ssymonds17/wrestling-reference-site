export const createApiResponse = (
  statusCode: number,
  body?: Record<string, unknown> | Array<unknown>
) => ({
  statusCode,
  body: typeof body !== 'undefined' ? JSON.stringify(body) : undefined,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Methods': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Origin': '*',
  },
})
