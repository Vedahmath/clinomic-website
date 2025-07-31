const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
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

// MongoDB schema/model
const enrollSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    phone: Number,
    email: String,
    applyingFor: String,
    message: String,
    heardAboutUs: String,
    otherDetails: String
});
const Enrollment = mongoose.model('Enrollment', enrollSchema);

// API endpoint to handle enrollments
app.post('/api/enroll', async (req, res) => {
    try {
        console.log("Received body:", req.body); // <--- ADD THIS LINE

        const { firstName, lastName, phone, email, course, hearAbout } = req.body;

        // Required field checks
        if ( !firstName || !lastName || !phone || !email || !course || !hearAbout ) {
            return res.json({ success: false, message: "All fields are required." });
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
         if (!/^\d{10}$/.test(phone)) {
            return res.json({ success: false, message: "Phone number must be exactly 10 digits." });
        }

        // Email: must be valid .com
        if (!/^[\w\.-]+@[\w\.-]+\.com$/.test(email)) {
            return res.json({ success: false, message: "Email must be a valid .com address." });
        }

        // Save to MongoDB
        const enrollment = new Enrollment({
            firstName, lastName, phone, email, course, hearAbout
        });
        await enrollment.save();

        res.json({ success: true });
    } catch (err) {
        console.error("Error in /api/enroll:", err); // <--- ADD THIS LINE
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
