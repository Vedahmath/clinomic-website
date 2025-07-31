const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const subscriberSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true }
});
const Subscriber = mongoose.model('Subscriber', subscriberSchema);

async function sendNewsletter() {
  const emails = (await Subscriber.find()).map(sub => sub.email);

  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // your email
      pass: process.env.EMAIL_PASS  // app password, NOT regular password
    }
  });

  let info = await transporter.sendMail({
    from: '"Clinomic Research" <YOUR_EMAIL@gmail.com>',
    to: emails.join(','),
    subject: 'Your Weekly News!',
    text: 'Here is the latest news...',
    html: '<b>Here is the latest news...</b>'
  });

  console.log('Newsletter sent: %s', info.messageId);
  mongoose.disconnect();
}

sendNewsletter().catch(console.error);
