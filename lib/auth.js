import { validateApiKey } from './db';

export async function validateRequest(req) {
  const apiKey = req.headers.get('x-api-key');
  
  if (!apiKey) {
    return { valid: false, error: 'Missing X-API-KEY header', status: 401 };
  }
  
  const isValid = await validateApiKey(apiKey);
  
  if (!isValid) {
    return { valid: false, error: 'Invalid API key', status: 403 };
  }
  
  return { valid: true };
}
