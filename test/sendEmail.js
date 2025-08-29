import nodemailer from "nodemailer";

// Load environment variables (optional if you put them in .env)
const EMAIL_HOST = "smtp.gmail.com";
const EMAIL_USER = "american.spikers.league@gmail.com";
const EMAIL_PASS = "zbmfibkhwhtjuupq";

async function sendEmail() {
  // 1. Create transporter
  const transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: 587, // Gmail SSL
    secure: false,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  // 2. Define email options
  const mailOptions = {
    from: `"ASL Squads" <${EMAIL_USER}>`,
    to: "mdsamsuzzoha5222@gmail.com", // 👈 change to recipient
    subject: "Test Email from Node.js",
    text: "Hello! This is a plain text email.",
    html: "<h1>Hello!</h1><p>This is an HTML email sent with Node.js 🚀</p>",
  };

  // 3. Send email
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.messageId);
  } catch (err) {
    console.error("❌ Error sending email:", err);
  }
}

// Run the function
sendEmail();
