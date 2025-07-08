// server.js - Complete Updated Backend (AirSense360)

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// === 1. GET Current AQI Data ===
app.get('/api/aqi/current', async (req, res) => {
  try {
    const { location } = req.query;
    if (!location) return res.status(400).json({ error: 'Location is required' });

    console.log(`Fetching current AQI for: ${location}`);
    const aqiData = await callPythonModel('predict_current', { location });

    const response = {
      location: location,
      aqi: aqiData.aqi,
      category: getAQICategory(aqiData.aqi),
      pm25: aqiData.pm25,
      pm10: aqiData.pm10,
      no2: aqiData.no2,
      so2: aqiData.so2,
      co: aqiData.co,
      lastUpdated: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching current AQI:', error.message);
    res.status(500).json({ error: 'Failed to fetch air quality data', details: error.message });
  }
});

// === 2. GET Forecast Data ===
app.get('/api/aqi/forecast', async (req, res) => {
  try {
    const { location, days = 3 } = req.query;
    if (!location) return res.status(400).json({ error: 'Location is required' });

    console.log(`Fetching forecast for: ${location}, days: ${days}`);
    const forecastData = await callPythonModel('predict_forecast', {
      location,
      days: parseInt(days)
    });

    const response = {
      location: location,
      forecast: forecastData.map(item => ({
        time: item.time,
        aqi: item.aqi,
        category: getAQICategory(item.aqi)
      }))
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching forecast:', error.message);
    res.status(500).json({ error: 'Failed to fetch forecast data', details: error.message });
  }
});

// === 3. GET Nearby Regions ===
app.get('/api/aqi/nearby', async (req, res) => {
  try {
    const { location, radius = 50 } = req.query;
    if (!location) return res.status(400).json({ error: 'Location is required' });

    console.log(`Fetching nearby regions for: ${location}, radius: ${radius}`);
    const nearbyData = await callPythonModel('predict_nearby', {
      location,
      radius: parseInt(radius)
    });

    const response = {
      location: location,
      nearbyRegions: nearbyData.map(item => ({
        name: item.name,
        aqi: item.aqi,
        category: getAQICategory(item.aqi),
        distance: item.distance
      }))
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching nearby regions:', error.message);
    res.status(500).json({ error: 'Failed to fetch nearby regions data', details: error.message });
  }
});

// === Helper: Call Python Model ===
async function callPythonModel(action, params) {
  return new Promise((resolve, reject) => {
    // Try multiple Python executables
    const pythonExecutables = ['python3', 'python', 'py'];
    let currentExecutable = 0;

    function tryPython() {
      if (currentExecutable >= pythonExecutables.length) {
        reject(new Error('No Python executable found. Please install Python.'));
        return;
      }

      const pythonExe = pythonExecutables[currentExecutable];
      console.log(`Trying Python executable: ${pythonExe}`);

      const pythonProcess = spawn(pythonExe, [
        path.join(__dirname, 'ml_model.py'),
        action,
        JSON.stringify(params)
      ]);

      let dataString = '';
      let errorString = '';

      pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorString += data.toString();
      });

      pythonProcess.on('error', (error) => {
        console.error(`Python executable ${pythonExe} failed:`, error.message);
        currentExecutable++;
        tryPython();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            console.log(`Python output: ${dataString}`);
            // Clean the output - remove warnings and extra whitespace
            const cleanOutput = dataString.trim().split('\n').pop();
            console.log(`Cleaned output: ${cleanOutput}`);
            const result = JSON.parse(cleanOutput);
            resolve(result);
          } catch (parseError) {
            console.error('JSON Parse Error:', parseError.message);
            console.error('Raw output:', dataString);
            reject(new Error(`Failed to parse Python output: ${dataString}`));
          }
        } else {
          console.error(`Python process exited with code ${code}`);
          console.error(`Error output: ${errorString}`);
          currentExecutable++;
          if (currentExecutable < pythonExecutables.length) {
            tryPython();
          } else {
            reject(new Error(`Python process failed: ${errorString || 'Unknown error'}`));
          }
        }
      });
    }

    tryPython();
  });
}

// === Helper: Get AQI Category ===
function getAQICategory(aqi) {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

// === Test Python Connection ===
app.get('/api/test-python', async (req, res) => {
  try {
    console.log('Testing Python connection...');
    const testData = await callPythonModel('predict_current', { location: 'Test Location' });
    res.json({ 
      success: true, 
      message: 'Python connection successful',
      data: testData 
    });
  } catch (error) {
    console.error('Python test failed:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      suggestion: 'Please ensure Python is installed and numpy is available'
    });
  }
});

// === Health Check Endpoint ===
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// === Start Server ===
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📊 Test Python: http://localhost:${PORT}/api/test-python`);
});

// Export (optional for tests)
module.exports = app;