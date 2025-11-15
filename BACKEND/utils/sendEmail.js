import nodemailer from "nodemailer";


const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || '587',
    secure: false,
    auth: {
      user: process.env.EMAIL_USER || 'hungvtacl50@gmail.com',
      pass: process.env.EMAIL_PASS || 'zkkr qbuq vlie jcli'
    },
  });

  const mailOptions = {
    from: "Nguyen Phuc Hung",
    to: options.email,
    subject: options.subject,
    html: options.html,
  };

  await transporter.sendMail(mailOptions);
};

export default sendEmail;