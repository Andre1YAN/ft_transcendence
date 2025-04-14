import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
})

export async function send2FACodeEmail(to: string, code: string) {
  const info = await transporter.sendMail({
    from: `"42 Pong" <${process.env.MAIL_USER}>`,
    to,
    subject: 'Your 2FA Verification Code',
    text: `Your 2FA verification code is: ${code}`,
    html: `<h2>Your 2FA code:</h2><p><b>${code}</b></p><p>It will expire in 5 minutes.</p>`
  })

  console.log('📧 Email sent:', info.messageId)
}
