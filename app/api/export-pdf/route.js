import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { getDomainScans, getScanResults } from '@/lib/db';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const domain = searchParams.get('domain');
  const scanId = searchParams.get('scan');

  if (!domain) {
    return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
  }

  // Fetch data from database
  const scans = getDomainScans(domain);
  if (!scans || scans.length === 0) {
    return NextResponse.json({ error: 'No scans found for this domain' }, { status: 404 });
  }

  const targetScan = scanId ? scans.find(s => String(s.id) === String(scanId)) : scans[0];
  if (!targetScan) {
    return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
  }

  const results = getScanResults(targetScan.id);
  
  // Group by device
  const mobileResults = results.filter(r => r.device_type === 'mobile');
  const desktopResults = results.filter(r => r.device_type === 'desktop');

  const calcAvg = (arr, field) => arr.length ? Math.round(arr.reduce((s, r) => s + r[field], 0) / arr.length) : '—';

  const scoreColor = (s) => {
    if (s === '—') return '#a1a1aa';
    if (s >= 90) return '#10b981';
    if (s >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const mobileAvg = {
    perf: calcAvg(mobileResults, 'perf_score'),
    seo: calcAvg(mobileResults, 'seo_score'),
    a11y: calcAvg(mobileResults, 'a11y_score'),
    bp: calcAvg(mobileResults, 'bp_score'),
  };
  
  const desktopAvg = {
    perf: calcAvg(desktopResults, 'perf_score'),
    seo: calcAvg(desktopResults, 'seo_score'),
    a11y: calcAvg(desktopResults, 'a11y_score'),
    bp: calcAvg(desktopResults, 'bp_score'),
  };

  const formatDate = (d) => new Date(d).toLocaleString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  // Build page breakdown HTML
  const buildPageRows = (deviceResults) => {
    return deviceResults.map(r => {
      const path = r.url.replace(`https://${domain}`, '').replace(`http://${domain}`, '') || '/';
      
      let metrics = {};
      let issuesHtml = '';
      try {
        const parsed = JSON.parse(r.raw_data || '{}');
        if (parsed && parsed.metrics) metrics = parsed.metrics;
        if (parsed && parsed.issues && Array.isArray(parsed.issues)) {
          issuesHtml = parsed.issues.slice(0, 8).map(issue => 
            `<div style="padding:6px 10px;background:#fff3f3;border-radius:4px;margin-bottom:4px;font-size:11px;">
              <strong style="color:#dc2626">${issue.title}</strong>
              ${issue.displayValue ? `<span style="float:right;color:#ea580c">${issue.displayValue}</span>` : ''}
            </div>`
          ).join('');
        }
      } catch(e) {}

      return `
        <div style="page-break-inside:avoid;border:1px solid #e5e7eb;border-radius:8px;padding:14px;margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <code style="font-size:13px;color:#1e293b;font-weight:600;">${path}</code>
            <div style="display:flex;gap:16px;">
              <span style="text-align:center;font-size:11px;color:#64748b">Rendimiento<br/><strong style="font-size:18px;color:${scoreColor(r.perf_score)}">${r.perf_score}</strong></span>
              <span style="text-align:center;font-size:11px;color:#64748b">SEO<br/><strong style="font-size:18px;color:${scoreColor(r.seo_score)}">${r.seo_score}</strong></span>
              <span style="text-align:center;font-size:11px;color:#64748b">Accesibilidad<br/><strong style="font-size:18px;color:${scoreColor(r.a11y_score)}">${r.a11y_score}</strong></span>
              <span style="text-align:center;font-size:11px;color:#64748b">Prácticas<br/><strong style="font-size:18px;color:${scoreColor(r.bp_score)}">${r.bp_score}</strong></span>
            </div>
          </div>
          ${metrics.fcp || metrics.lcp ? `
          <div style="display:flex;gap:16px;margin-bottom:8px;padding:8px;background:#f8fafc;border-radius:6px;">
            ${metrics.fcp ? `<span style="font-size:11px;color:#64748b">FCP: <strong style="color:#0f172a">${metrics.fcp}</strong></span>` : ''}
            ${metrics.lcp ? `<span style="font-size:11px;color:#64748b">LCP: <strong style="color:#0f172a">${metrics.lcp}</strong></span>` : ''}
            ${metrics.tbt ? `<span style="font-size:11px;color:#64748b">TBT: <strong style="color:#0f172a">${metrics.tbt}</strong></span>` : ''}
            ${metrics.cls ? `<span style="font-size:11px;color:#64748b">CLS: <strong style="color:#0f172a">${metrics.cls}</strong></span>` : ''}
            ${metrics.si ? `<span style="font-size:11px;color:#64748b">SI: <strong style="color:#0f172a">${metrics.si}</strong></span>` : ''}
          </div>` : ''}
          ${issuesHtml ? `
          <div>
            <div style="font-size:11px;font-weight:600;color:#dc2626;margin-bottom:4px;">Problemas detectados:</div>
            ${issuesHtml}
          </div>` : ''}
        </div>
      `;
    }).join('');
  };

  const scoreCircle = (val, label) => `
    <div style="text-align:center;">
      <div style="width:72px;height:72px;border-radius:50%;border:4px solid ${scoreColor(val)};display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:bold;color:${scoreColor(val)};margin:0 auto;">${val}</div>
      <div style="margin-top:6px;font-size:12px;color:#475569;font-weight:600;">${label}</div>
    </div>
  `;

  const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #1e293b; background: #fff; padding: 40px; font-size: 13px; line-height: 1.5; }
    h1 { font-size: 28px; color: #0f172a; margin-bottom: 4px; }
    h2 { font-size: 18px; color: #334155; margin: 28px 0 14px 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; }
    h3 { font-size: 15px; color: #334155; margin-bottom: 10px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; border-bottom: 3px solid #3b82f6; padding-bottom: 16px; }
    .meta { font-size: 12px; color: #64748b; }
    .scores-row { display: flex; gap: 32px; justify-content: center; padding: 20px; background: #f8fafc; border-radius: 12px; margin-bottom: 8px; }
    .section { page-break-inside: avoid; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Reporte de Rendimiento Web</h1>
      <div class="meta">${domain}</div>
    </div>
    <div style="text-align:right;">
      <div class="meta">Fecha: ${formatDate(targetScan.started_at)}</div>
      <div class="meta">Estado: ${targetScan.status === 'completed' ? 'Completado' : targetScan.status}</div>
      <div class="meta">Páginas analizadas: ${results.length / 2} (${results.length} auditorías)</div>
    </div>
  </div>

  <div class="section">
    <h2>📱 Resultados Móvil</h2>
    <div class="scores-row">
      ${scoreCircle(mobileAvg.perf, 'Rendimiento')}
      ${scoreCircle(mobileAvg.seo, 'SEO')}
      ${scoreCircle(mobileAvg.a11y, 'Accesibilidad')}
      ${scoreCircle(mobileAvg.bp, 'Buenas Prácticas')}
    </div>
    ${mobileResults.length > 0 ? `<h3>Desglose por página</h3>${buildPageRows(mobileResults)}` : '<p style="color:#94a3b8">Sin datos móviles.</p>'}
  </div>

  <div class="section" style="page-break-before: always;">
    <h2>💻 Resultados Escritorio</h2>
    <div class="scores-row">
      ${scoreCircle(desktopAvg.perf, 'Rendimiento')}
      ${scoreCircle(desktopAvg.seo, 'SEO')}
      ${scoreCircle(desktopAvg.a11y, 'Accesibilidad')}
      ${scoreCircle(desktopAvg.bp, 'Buenas Prácticas')}
    </div>
    ${desktopResults.length > 0 ? `<h3>Desglose por página</h3>${buildPageRows(desktopResults)}` : '<p style="color:#94a3b8">Sin datos de escritorio.</p>'}
  </div>

  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;text-align:center;">
    Generado automáticamente por VeloMetric Platform — ${new Date().toLocaleDateString('es-ES')}
  </div>
</body>
</html>`;

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '24px', right: '24px', bottom: '24px', left: '24px' }
    });

    await browser.close();

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="reporte-${domain}.pdf"`,
      },
    });

  } catch (err) {
    if (browser) await browser.close();
    console.error('PDF Export error:', err);
    return NextResponse.json({ error: 'Failed to generate PDF: ' + err.message }, { status: 500 });
  }
}
