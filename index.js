const { spawn } = require('child_process');
const socketIoClient = require('socket.io-client');

// Connect to the WebSocket server running on server.js
const socket = socketIoClient('http://localhost:3000');

// Function to extract latitude and longitude from $GPGGA NMEA sentence
function extractLatLonFromGPGGA(data) {
  const gpggaRegex = /^\$GPGGA,([^,]+),([^,]+),([NS]),([^,]+),([EW])/;
  const match = data.match(gpggaRegex);
  
  if (match) {
    const lat = match[2];
    const latDirection = match[3];
    const lon = match[4];
    const lonDirection = match[5];

    const latDecimal = convertToDecimal(lat, latDirection);
    const lonDecimal = convertToDecimal(lon, lonDirection);

    return { latitude: latDecimal, longitude: lonDecimal };
  }
  return null;
}

// Helper function to convert GPS coordinate to decimal format
function convertToDecimal(coordinate, direction) {
  let degrees, minutes;

  if (direction === 'N' || direction === 'S') {
    degrees = parseInt(coordinate.slice(0, 2), 10);
    minutes = parseFloat(coordinate.slice(2));
  } else if (direction === 'E' || direction === 'W') {
    degrees = parseInt(coordinate.slice(0, 3), 10);
    minutes = parseFloat(coordinate.slice(3));
  } else {
    throw new Error("Invalid direction for GPS coordinates.");
  }

  let decimalCoordinate = degrees + minutes / 60;
  if (direction === 'S' || direction === 'W') {
    decimalCoordinate = -decimalCoordinate;
  }

  return decimalCoordinate;
}

// Start gpspipe to get GPS data
const gpspipe = spawn('gpspipe', ['-r']);

let lastLatLon = null;
let timer;

gpspipe.stdout.on('data', (data) => {
  const lines = data.toString().split('\n');
  lines.forEach((line) => {
    if (line.startsWith('$GPGGA')) {
      const latLon = extractLatLonFromGPGGA(line);
      if (latLon) {
        // Save the latest GPS data
        lastLatLon = latLon;
        
        // Clear any previous timer and set a new one for 5 seconds
        clearTimeout(timer);
        timer = setTimeout(() => {
          if (lastLatLon) {
            console.log('Sending GPS data to server:', lastLatLon);
            socket.emit('gps-update', lastLatLon); // Send the last received GPS data
          }
        }, 5000); // Emit data every 5 seconds
      }
    }
  });
});

gpspipe.stderr.on('data', (data) => {
  console.error(`Error from gpspipe: ${data}`);
});

gpspipe.on('close', (code) => {
  if (code !== 0) {
    console.error(`gpspipe process exited with code ${code}`);
  }
});
