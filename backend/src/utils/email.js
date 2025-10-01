import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  // 1) Create a transporter using environment variables
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  // 2) Define the email options
  const mailOptions = {
    from: process.env.MAIL_FROM,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  // 3) Send the email
  await transporter.sendMail(mailOptions);
};

export default sendEmail;