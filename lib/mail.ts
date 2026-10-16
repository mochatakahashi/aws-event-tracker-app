import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendNotificationEmail({ to, subject, html, text }: SendMailOptions) {
  const mailOptions = {
    from: `"AWS SBG-APC" <${process.env.GMAIL_USER}>`,
    to: Array.isArray(to) ? to.join(', ') : to,
    cc: process.env.GMAIL_USER,       // Automatically CCs aws.apcofficial@gmail.com
    replyTo: process.env.GMAIL_USER,  // Student replies route directly back to the club Gmail
    subject,
    html,
    ...(text ? { text } : {}),
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
}

export default transporter;
