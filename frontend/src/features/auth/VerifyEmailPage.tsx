import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BasePage } from '@/components/layout/BasePage';
import { apiUrl } from '@/config/api';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Falta el token de verificación.');
      return;
    }

    (async () => {
      try {
        setStatus('loading');
        const res = await fetch(
          apiUrl(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.message || 'Error al verificar el correo');
        }
        setStatus('success');
        setMessage(
          data.message || 'Correo verificado correctamente. Ya puedes iniciar sesión.'
        );
        setTimeout(() => navigate('/login'), 3000);
      } catch (e: any) {
        setStatus('error');
        setMessage(e.message || 'Error al verificar el correo');
      }
    })();
  }, [token, navigate]);

  return (
    <BasePage centered title="Verificación de correo">
      <div className="app-card app-card--form">
        {status === 'loading' && (
          <p className="app-page-subtitle app-page-subtitle--tight">
            Verificando tu dirección de correo electrónico…
          </p>
        )}
        {status === 'success' && (
          <p className="auth-success app-message-inline">
            {message} Serás redirigido a la pantalla de inicio de sesión.
          </p>
        )}
        {status === 'error' && (
          <p className="auth-error app-message-inline">
            {message}
          </p>
        )}
      </div>
    </BasePage>
  );
}
