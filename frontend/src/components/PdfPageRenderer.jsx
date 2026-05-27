import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Use the bundled worker from pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

/**
 * PdfPageRenderer
 * 
 * Takes a PDF URL, fetches it, renders every page to a canvas,
 * converts each canvas to a data-URL image, and outputs real <img> tags
 * that browsers can actually print (unlike iframes).
 */
export default function PdfPageRenderer({ url, title }) {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const canvasRefs = useRef([]);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;

    const renderPdf = async () => {
      try {
        setLoading(true);
        setError(null);

        const pdf = await pdfjsLib.getDocument(url).promise;
        const totalPages = pdf.numPages;
        const renderedPages = [];

        for (let i = 1; i <= totalPages; i++) {
          const page = await pdf.getPage(i);
          // Render at 2x scale for print quality
          const scale = 2;
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');

          await page.render({ canvasContext: ctx, viewport }).promise;

          const dataUrl = canvas.toDataURL('image/png');
          renderedPages.push(dataUrl);
        }

        if (!cancelled) {
          setPages(renderedPages);
          setLoading(false);
        }
      } catch (err) {
        console.error('PDF rendering failed:', err);
        if (!cancelled) {
          setError('Failed to render PDF document.');
          setLoading(false);
        }
      }
    };

    renderPdf();
    return () => { cancelled = true; };
  }, [url]);

  if (loading) {
    return (
      <div style={{
        padding: '3rem',
        textAlign: 'center',
        color: '#64748b',
        fontSize: '0.875rem',
        border: '1px dashed #cbd5e1',
        borderRadius: '8px',
        background: '#f8fafc'
      }}>
        Rendering PDF pages for print preview…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: '#ef4444',
        fontSize: '0.875rem',
        border: '1px dashed #fca5a5',
        borderRadius: '8px',
        background: '#fef2f2'
      }}>
        {error}
      </div>
    );
  }

  return (
    <div>
      {pages.map((dataUrl, idx) => (
        <div key={idx} style={{
          marginBottom: idx < pages.length - 1 ? '0' : '0',
          pageBreakAfter: idx < pages.length - 1 ? 'always' : 'auto',
          textAlign: 'center'
        }}>
          <img
            src={dataUrl}
            alt={`${title || 'PDF'} - Page ${idx + 1}`}
            style={{
              width: '100%',
              maxWidth: '100%',
              height: 'auto',
              objectFit: 'contain',
              display: 'block'
            }}
          />
        </div>
      ))}
    </div>
  );
}
