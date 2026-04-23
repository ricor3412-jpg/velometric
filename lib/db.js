import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase environment variables are missing! Database operations will fail.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);

// --- DOMAIN MANAGEMENT ---

export const getOrCreateDomain = async (name, url) => {
  const { data: existing, error: selectError } = await supabase
    .from('domains')
    .select('*')
    .eq('name', name)
    .single();

  if (existing) return existing;

  const { data: inserted, error: insertError } = await supabase
    .from('domains')
    .insert([{ name, url }])
    .select()
    .single();

  if (insertError) {
    // Handle potential race condition if domain was created between select and insert
    const { data: retry } = await supabase.from('domains').select('*').eq('name', name).single();
    return retry;
  }
  
  return inserted;
};

// --- SCAN MANAGEMENT ---

export const startScan = async (domainId, networkProfile = '4g') => {
  const { data, error } = await supabase
    .from('scans')
    .insert([{ domain_id: domainId, status: 'running', network_profile: networkProfile }])
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
};

export const finishScan = async (scanId) => {
  const { error } = await supabase
    .from('scans')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', scanId);

  if (error) throw error;
};

export const updateScanStatus = async (scanId, status) => {
  const { error } = await supabase
    .from('scans')
    .update({ status })
    .eq('id', scanId);
    
  if (error) throw error;
}

export const savePageResult = async (scanId, url, deviceType, scores, rawData = '{}') => {
  let parsedRaw = rawData;
  if (typeof rawData === 'string') {
    try { parsedRaw = JSON.parse(rawData); } catch (e) {}
  }

  const { error } = await supabase
    .from('scan_results')
    .insert([{ 
      scan_id: scanId, 
      url, 
      device_type: deviceType, 
      perf_score: scores.performance, 
      seo_score: scores.seo, 
      a11y_score: scores.accessibility, 
      bp_score: scores['best-practices'] || scores.bp_score, 
      raw_data: parsedRaw 
    }]);

  if (error) throw error;
};

export const appendLog = async (scanId, message, type = 'info') => {
  const { error } = await supabase
    .from('scan_logs')
    .insert([{ scan_id: scanId, message, type }]);

  if (error) throw error;
};

// --- QUERIES ---

export const getLatestScans = async () => {
  const { data, error } = await supabase
    .from('scans')
    .select(`
      id, 
      status, 
      network_profile, 
      started_at,
      domains (name, url),
      scan_results (perf_score, seo_score, a11y_score, bp_score)
    `)
    .order('started_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return data.map(s => {
    const results = s.scan_results || [];
    const avg = (key) => results.length > 0
      ? Math.round(results.reduce((acc, r) => acc + (r[key] || 0), 0) / results.length)
      : null;
    return {
      id: s.id,
      name: s.domains.name,
      url: s.domains.url,
      status: s.status,
      network_profile: s.network_profile,
      started_at: s.started_at,
      results: {
        performance: avg('perf_score'),
        seo: avg('seo_score'),
        accessibility: avg('a11y_score'),
        bestPractices: avg('bp_score'),
      }
    };
  });
};

export const getDomainScans = async (domainName) => {
  const { data, error } = await supabase
    .from('scans')
    .select(`
      id, status, network_profile, started_at, completed_at,
      domains!inner(name)
    `)
    .eq('domains.name', domainName)
    .order('started_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const getScanById = async (id) => {
  const { data, error } = await supabase
    .from('scans')
    .select(`
      *,
      domains:domain_id (name, url)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return {
    ...data,
    domain_name: data.domains.name,
    domain_url: data.domains.url
  };
};

export const getScanResults = async (scanId) => {
  const { data, error } = await supabase
    .from('scan_results')
    .select('*')
    .eq('scan_id', scanId);

  if (error) throw error;
  return data;
};

export const getScanLogs = async (scanId) => {
  const { data, error } = await supabase
    .from('scan_logs')
    .select('*')
    .eq('scan_id', scanId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
};

// --- API KEY MANAGEMENT ---

export const createApiKey = async (name) => {
  const key = 'ps_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const { error } = await supabase
    .from('api_keys')
    .insert([{ key, name }]);

  if (error) throw error;
  return key;
};

export const validateApiKey = async (key) => {
  const { data, error } = await supabase
    .from('api_keys')
    .select('id')
    .eq('key', key)
    .single();

  return !!data;
};

export const listApiKeys = async () => {
  const { data, error } = await supabase
    .from('api_keys')
    .select('id, name, created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const revokeApiKey = async (id) => {
  const { error } = await supabase
    .from('api_keys')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Export as default for convenience
export default supabase;
