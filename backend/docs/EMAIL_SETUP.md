# Configuración de email (Nodemailer) – Paso a paso

El backend usa **Nodemailer** para enviar el correo de **verificación de cuenta** al registrarse. Sin configurar SMTP, el registro sigue funcionando y en desarrollo el enlace de verificación se imprime en la consola del backend para que puedas copiarlo y probar.

---

## 1. Variables de entorno

En **`backend/.env`** necesitas (ver también `backend/env.example`):

| Variable      | Descripción                          | Ejemplo                    |
|---------------|--------------------------------------|----------------------------|
| `SMTP_HOST`   | Servidor SMTP                        | `smtp.gmail.com`           |
| `SMTP_PORT`   | Puerto (587 TLS, 465 SSL)            | `587`                      |
| `SMTP_SECURE` | `true` solo si usas puerto 465       | `false`                    |
| `SMTP_USER`   | Usuario / email                      | `tu-email@gmail.com`       |
| `SMTP_PASS`   | Contraseña o contraseña de aplicación| (no subir a Git)          |
| `EMAIL_FROM`  | Remitente (opcional)                 | `TimeLine <noreply@...>`   |

`FRONTEND_URL` ya se usa para montar el enlace de verificación (ej. `http://localhost:5173` en local).

---

## 2. Gmail (recomendado para pruebas)

1. Activa **verificación en dos pasos** en tu cuenta Google:  
   [https://myaccount.google.com/security](https://myaccount.google.com/security)
2. Crea una **contraseña de aplicación**:  
   [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)  
   - Elige “Correo” y “Otro (nombre personalizado)” (ej. “TimeLine”).
   - Copia la contraseña de 16 caracteres.
3. En `backend/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
EMAIL_FROM=TimeLine <tu-email@gmail.com>
```

4. Reinicia el backend. Al registrarte, el correo se enviará a la bandeja del destinatario (y a “Spam” si es la primera vez).

---

## 3. Mailtrap (solo pruebas, no envía a correos reales)

Útil para desarrollo sin enviar correos a usuarios reales.

1. Regístrate en [https://mailtrap.io](https://mailtrap.io).
2. Crea un **Inbox** y entra en **SMTP Settings**.
3. Elige “Nodemailer” y copia host, puerto, user y password.
4. En `backend/.env`:

```env
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=tu-user-de-mailtrap
SMTP_PASS=tu-password-de-mailtrap
EMAIL_FROM=TimeLine <no-reply@timeline.local>
```

5. Los correos aparecerán en el Inbox de Mailtrap; no llegarán a Gmail/Outlook.

---

## 4. Outlook / Hotmail

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@outlook.com
SMTP_PASS=tu-contraseña
```

Si usas 2FA, puede que necesites una contraseña de aplicación en la cuenta de Microsoft.

---

## 5. Comprobar que funciona

1. Backend arrancado con las variables anteriores.
2. En el frontend: **Registrarse** con un email al que puedas acceder (o al Mailtrap Inbox).
3. Revisar:
   - **Con SMTP configurado:** bandeja (y carpeta Spam) o Mailtrap.
   - **Sin SMTP:** en la **consola del backend** debe aparecer el enlace de verificación para copiarlo.

El enlace tiene la forma:  
`http://localhost:5173/verify-email?token=...`  
Abrirlo en el navegador completa la verificación.

---

## 6. Producción

- No uses tu correo personal en producción; usa un servicio (Resend, SendGrid, SES, etc.) o un SMTP de tu dominio.
- Mantén `SMTP_PASS` y datos sensibles solo en variables de entorno del servidor, nunca en el repositorio.
- Ajusta `EMAIL_FROM` al dominio que vayas a usar (mejor aceptación y menos spam).
