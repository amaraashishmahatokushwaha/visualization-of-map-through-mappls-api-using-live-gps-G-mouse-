const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Create HTTP server and attach WebSocket server
const server = http.createServer(app);
const io = socketIo(server);

// Use body-parser to parse incoming JSON data
app.use(bodyParser.json());

// Serve static files from the 'public' folder
app.use(express.static('public'));

// Serve the HTML page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// GPS data to broadcast (you can replace this with real GPS data)
let gpsData = {
  latitude: 12.911983666666666,
  longitude: 77.633295
};

// Emit GPS data to all connected clients every 5 seconds
setInterval(() => {
  console.log(`Broadcasting GPS Data: Latitude = ${gpsData.latitude}, Longitude = ${gpsData.longitude}`);
  io.emit('gps-update', gpsData);
}, 5000); // 5000ms = 5 seconds interval

// Receive GPS data via WebSocket and broadcast to connected clients
io.on('connection', (socket) => {
  console.log('Client connected to WebSocket');
  
  // You can receive and log GPS data from a client (if needed)
  socket.on('gps-update', (data) => {
    console.log(`Received GPS Data: Latitude = ${data.latitude}, Longitude = ${data.longitude}`);
    // Optionally, you can broadcast it back to the clients
    io.emit('gps-update', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start the server
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
