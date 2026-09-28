import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { GlassCard } from '../../shared/ui/GlassCard';
import { Button } from '../../shared/ui/Button';
import { QrCode, ArrowLeft } from 'lucide-react';

export const QrScanPage = () => {
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState('');

  useEffect(() => {
    const scanner = new Html5QrcodeScanner('qr-reader-container', {
      fps: 10,
      qrbox: { width: 250, height: 250 }
    });

    scanner.render(
      (decodedText) => {
        setScanResult(decodedText);
        scanner.clear();
        // If decodedText is a URL like http://.../a/SL-0042 extract code or navigate
        if (decodedText.includes('/a/')) {
          const code = decodedText.split('/a/')[1];
          navigate(`/a/${code}`);
        } else {
          // Assume code or ID
          navigate(`/assets/${decodedText}`);
        }
      },
      (error) => {
        // ignore scan errors
      }
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [navigate]);

  return (
    <div style={{ maxWidth: '550px', margin: '1rem auto' }}>
      <button className="btn-secondary" style={{ marginBottom: '1rem' }} onClick={() => navigate('/assets')}>
        <ArrowLeft size={16} /> Back to Assets
      </button>

      <GlassCard>
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <QrCode size={36} style={{ color: 'var(--color-cream)', marginBottom: '0.4rem' }} />
          <h1 style={{ fontSize: '1.6rem' }}>QR Asset Scanner</h1>
          <p style={{ color: 'var(--color-laurel)', fontSize: '0.875rem' }}>
            Point device camera at any asset QR tag to open asset details instantly
          </p>
        </div>

        <div id="qr-reader-container" style={{ width: '100%', minHeight: '300px' }} />

        {scanResult && (
          <div style={{ marginTop: '1rem', textAlign: 'center', fontWeight: 600 }}>
            Scanned: {scanResult}
          </div>
        )}
      </GlassCard>
    </div>
  );
};
