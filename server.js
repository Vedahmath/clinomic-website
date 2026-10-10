const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

// Clean URL for placement page (before static so /placement is not treated as the image folder)
app.get('/placement', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'placement.html'));
});

app.use(express.static('public'));
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

console.log('MONGODB_URI:', process.env.MONGODB_URI);
// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB Atlas connected!'))
  .catch(err => console.error('MongoDB connection error:', err));

// Nodemailer Transporter for Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Helper function to send email notification to admin
async function sendEnrollmentNotification(data) {
  const recipient = process.env.NOTIFICATION_EMAIL || 'nmdonni@gmail.com';
  const sender = process.env.EMAIL_USER || 'no-reply@clinomickar.in';

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('EMAIL_USER or EMAIL_PASS not set in environment. Skipping email notification.');
    return;
  }

  const { firstName, lastName, phone, email, course, hearAbout, message, refFriend } = data;
  const fullName = `${firstName} ${lastName}`.trim();
  const dateStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const mailOptions = {
    from: `"Clinomic Website" <${sender}>`,
    to: recipient,
    subject: `New Candidate Enrollment: ${fullName} - ${course || 'Clinical Research'}`,
    text: `
New Candidate Enrollment Received!

Candidate Details:
- Name: ${fullName}
- Phone: ${phone}
- Email: ${email}
- Course Applied: ${course || 'N/A'}
- How they heard about us: ${hearAbout || 'N/A'}
- Message: ${message || 'None'}
- Friend References: ${refFriend || 'None'}
- Received: ${dateStr} (IST)

This submission is stored in MongoDB Atlas.
    `.trim(),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
        <div style="background: linear-gradient(135deg, #003d78, #00b894); color: white; padding: 24px; text-align: center;">
          <h2 style="margin: 0; font-size: 22px;">New Candidate Enrollment</h2>
          <p style="margin: 6px 0 0; opacity: 0.9; font-size: 14px;">Clinomic Center for Clinical Research</p>
        </div>
        <div style="padding: 24px; background-color: #ffffff;">
          <p style="font-size: 15px; color: #333; margin-top: 0;">A new candidate has registered through the website enrollment form:</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
            <tr style="border-bottom: 1px solid #f0f0f0;">
              <td style="padding: 10px 0; color: #666; font-weight: bold; width: 38%;">Full Name:</td>
              <td style="padding: 10px 0; color: #111; font-weight: 600;">${fullName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f0f0f0;">
              <td style="padding: 10px 0; color: #666; font-weight: bold;">Phone Number:</td>
              <td style="padding: 10px 0; color: #111;"><a href="tel:${phone}" style="color: #003d78; text-decoration: none; font-weight: 600;">${phone}</a></td>
            </tr>
            <tr style="border-bottom: 1px solid #f0f0f0;">
              <td style="padding: 10px 0; color: #666; font-weight: bold;">Email ID:</td>
              <td style="padding: 10px 0; color: #111;"><a href="mailto:${email}" style="color: #003d78; text-decoration: none;">${email}</a></td>
            </tr>
            <tr style="border-bottom: 1px solid #f0f0f0;">
              <td style="padding: 10px 0; color: #666; font-weight: bold;">Course Applied:</td>
              <td style="padding: 10px 0; color: #00b894; font-weight: 600;">${course || 'N/A'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f0f0f0;">
              <td style="padding: 10px 0; color: #666; font-weight: bold;">Heard About Us:</td>
              <td style="padding: 10px 0; color: #111;">${hearAbout || 'N/A'}</td>
            </tr>
            ${message ? `
            <tr style="border-bottom: 1px solid #f0f0f0;">
              <td style="padding: 10px 0; color: #666; font-weight: bold; vertical-align: top;">Message:</td>
              <td style="padding: 10px 0; color: #333; line-height: 1.4;">${message}</td>
            </tr>` : ''}
            ${refFriend ? `
            <tr style="border-bottom: 1px solid #f0f0f0;">
              <td style="padding: 10px 0; color: #666; font-weight: bold; vertical-align: top;">Friend Reference:</td>
              <td style="padding: 10px 0; color: #333; line-height: 1.4;">${refFriend}</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 10px 0; color: #666; font-weight: bold;">Received On:</td>
              <td style="padding: 10px 0; color: #888; font-size: 13px;">${dateStr} (IST)</td>
            </tr>
          </table>
        </div>
        <div style="background-color: #f8f9fa; padding: 14px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #e0e0e0;">
          This notification was automatically sent from the <a href="https://www.clinomickar.in" style="color: #003d78; text-decoration: none;">Clinomic Website</a>.
        </div>
      </div>
    `
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`Enrollment notification sent to ${recipient}:`, info.messageId);
}

// MongoDB schema/model
const enrollSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  course: { type: String, required: true },
  applyingFor: { type: String },
  message: { type: String, default: '' },
  hearAbout: { type: String, required: true },
  heardAboutUs: { type: String },
  refFriend: { type: String, default: '' },
  otherDetails: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});
const Enrollment = mongoose.model('Enrollment', enrollSchema);

// API endpoint to handle enrollments
app.post('/api/enroll', async (req, res) => {
  try {
    console.log("Received body:", req.body);

    const { firstName, lastName, phone, email, course, hearAbout, message, refFriend } = req.body;

    // Required field checks
    if (!firstName || !lastName || !phone || !email || !course || !hearAbout) {
      return res.json({ success: false, message: "All required fields must be provided." });
    }

    // Name must be letters
    const nameRegex = /^[A-Za-z\s\-]+$/;
    if (!nameRegex.test(firstName)) {
      return res.json({ success: false, message: "First name must contain only letters." });
    }
    if (!nameRegex.test(lastName)) {
      return res.json({ success: false, message: "Last name must contain only letters." });
    }

    // Phone: exactly 10 digits
    const phoneStr = String(phone).trim();
    if (!/^\d{10}$/.test(phoneStr)) {
      return res.json({ success: false, message: "Phone number must be exactly 10 digits." });
    }

    // Email: basic valid email check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.json({ success: false, message: "Please provide a valid email address." });
    }

    // Save to MongoDB
    const enrollment = new Enrollment({
      firstName,
      lastName,
      phone: phoneStr,
      email,
      course,
      applyingFor: course,
      message: message || '',
      hearAbout,
      heardAboutUs: hearAbout,
      refFriend: refFriend || ''
    });
    await enrollment.save();
    console.log(`Candidate ${firstName} ${lastName} saved to MongoDB successfully.`);

    // Trigger email notification asynchronously (without blocking or failing the request if email service fails)
    sendEnrollmentNotification({
      firstName,
      lastName,
      phone: phoneStr,
      email,
      course,
      hearAbout,
      message,
      refFriend
    }).catch(mailErr => {
      console.error("Failed to send enrollment email notification:", mailErr.message);
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Error in /api/enroll:", err);
    res.json({ success: false, message: err.message });
  }
});

const subscriberSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true }
});
const Subscriber = mongoose.model('Subscriber', subscriberSchema);

// Newsletter subscribe endpoint
app.post('/api/subscribe', async (req, res) => {
  console.log('Request received at /api/subscribe:', req.body);

  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    // Check if email exists
    const existing = await Subscriber.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Already subscribed!' });
    }

    // Save new subscriber
    const subscriber = new Subscriber({ email });
    await subscriber.save();
    console.log('New subscriber saved:', email);
    res.status(200).json({ message: 'Thank you for subscribing!' });
  } catch (err) {
    console.error('Error saving subscriber:', err);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

// Start server
const PORT = process.env.PORT || 5500;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
