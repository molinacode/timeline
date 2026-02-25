import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

let transporter = null

function isEmailConfigured() {
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  return !!(host && user && pass)
}

function getTransporter() {
  if (transporter) return transporter
  if (!isEmailConfigured()) return null

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  return transporter
}

/**
 * Envía el email de verificación de cuenta.
 * Si SMTP no está configurado, en desarrollo imprime el enlace en consola para poder probar.
 */
export async function sendVerificationEmail(to, token) {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  const verifyUrl = `${baseUrl}/verify-email?token=${encodeURIComponent(token)}`

  const t = getTransporter()
  if (t) {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'no-reply@timeline.local',
      to,
      subject: 'Confirma tu cuenta en TimeLine',
      text: `Hola,\n\nGracias por registrarte en TimeLine.\n\nHaz clic en el siguiente enlace para confirmar tu correo:\n\n${verifyUrl}\n\nSi no has solicitado esta cuenta, puedes ignorar este mensaje.\n`,
      html: `
        <p>Hola,</p>
        <p>Gracias por registrarte en <strong>TimeLine</strong>.</p>
        <p>Haz clic en el siguiente enlace para confirmar tu correo:</p>
        <p><a href="${verifyUrl}">${verifyUrl}</a></p>
        <p>Si no has solicitado esta cuenta, puedes ignorar este mensaje.</p>
      `,
    }
    await t.sendMail(mailOptions)
    return
  }

  // Sin SMTP configurado: en desarrollo mostrar el enlace en consola para poder probar
  if (process.env.NODE_ENV !== 'production') {
    console.log('--------------------------------------------------')
    console.log('[Email] SMTP no configurado. Enlace de verificación (copiar en el navegador):')
    console.log(verifyUrl)
    console.log('--------------------------------------------------')
  }
}
