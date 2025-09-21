const express = require('express')
const path = require('path')
const mongoose = require('mongoose')
const cors = require('cors')
const sessionData = require('./model')

const app = express()
const port = 3000

app.use(express.static(path.join(__dirname, 'public')))

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`)
  console.log(`To visit home page: http://localhost:${port}/home`)
})

app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'otp.html'))
})

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/captcha')
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// API endpoint to receive data
app.post('/api/mouse-data', async (req, res) => {
  try {
    const { sessionDuration, 
      xCoordinates, 
      yCoordinates,
      typingSpeed,
      interKeyDelayAvg,
      totalKeystrokes,
      typingSpeedCPM
    } = req.body;
    
    // Validate that we're receiving arrays
    if (!Array.isArray(xCoordinates) || !Array.isArray(yCoordinates)) {
      return res.status(400).json({ error: 'xCoordinates and yCoordinates must be arrays' });
    }

    console.log('Received coordinates:', { 
      xCount: xCoordinates.length, 
      yCount: yCoordinates.length 
    });

    // Save mouse data to MongoDB
    const newMouseData = new sessionData({ 
      sessionDuration,
      xCoordinates, 
      yCoordinates,
      typingSpeed,
      interKeyDelayAvg,
      totalKeystrokes,
      typingSpeedCPM
    });
    
    await newMouseData.save();

    res.status(201).json({ 
      message: 'Mouse data saved successfully!',
      savedCoordinates: {
        xCount: xCoordinates.length,
        yCount: yCoordinates.length
      }
    });
  } catch (error) {
    console.error('Error saving mouse data:', error);
    res.status(500).json({ error: 'Failed to save mouse data.' });
  }
});


