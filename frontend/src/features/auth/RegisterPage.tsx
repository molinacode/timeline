import { FormEvent, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';
import { BasePage } from '../../components/layout/BasePage';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await register(name, email, password);
      setMessage(
        'Registro completado. Revisa tu correo para confirmar la cuenta.'
      );
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.message || 'Error al registrar usuario');
    } finally {
      setLoading(false);
    }
  }

  return (
    <BasePage
      centered
      title="Crear cuenta"
      subtitle="Crea tu cuenta para guardar fuentes, categorías y personalizar tu timeline. Te enviaremos un email de confirmación."
    >
      <div className="app-card app-card--form auth-container">
        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-label">
            Nombre
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="app-input"
            />
        </label>
        <label className="auth-label">
          Correo electrónico
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="app-input"
          />
        </label>
        <label className="auth-label">
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="app-input"
          />
        </label>

        {error && <p className="auth-error">{error}</p>}
        {message && <p className="auth-success">{message}</p>}

        <button type="submit" disabled={loading} className="app-btn-primary">
          {loading ? 'Creando cuenta…' : 'Registrarse'}
        </button>

        <p className="auth-link">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login">Inicia sesión</Link>
        </p>
      </form>
    </div>
    </BasePage>
  );
}
