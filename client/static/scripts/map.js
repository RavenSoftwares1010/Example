// Get username from localStorage
const username = localStorage.getItem("username");
if (!username) {
    alert("No username found, redirecting to login.");
    window.location.href = "/";
}

// Initialize Leaflet map
const map = L.map('map').setView([0, 0], 13);

// Road-only tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
}).addTo(map);

// Store all markers
const markers = {};

// Store colors per user
const userColors = {};

// Generate random bright color
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Create animated label for markers
function createLabel(name) {
    if (!userColors[name]) {
        userColors[name] = name === username ? '#007bff' : getRandomColor(); // your device = blue
    }
    const color = userColors[name];

    return L.divIcon({
        html: `
  <div style="
      position: relative;
      display: inline-block;
      padding: 6px 12px;
      background: ${color};
      color: white;
      font-weight: bold;
      font-size: 14px;
      text-align: center;
      border-radius: 20px;
      border: 4px solid black;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      white-space: nowrap;
  ">
      ${name}
      <div style="
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 8px solid ${color};
      "></div>
  </div>
`,
        className: '',
        iconSize: [80, 40],
        iconAnchor: [40, 20]
    });
}

// Smoothly move marker to new position
function moveMarkerSmooth(marker, newLatLng, duration = 1000) {
    const start = marker.getLatLng();
    const startTime = Date.now();

    function animate() {
        const now = Date.now();
        const t = Math.min((now - startTime) / duration, 1);
        const lat = start.lat + (newLatLng[0] - start.lat) * t;
        const lng = start.lng + (newLatLng[1] - start.lng) * t;
        marker.setLatLng([lat, lng]);
        if (t < 1) requestAnimationFrame(animate);
    }
    animate();
}

// Fetch all devices and update markers
async function fetchDevices() {
    try {
        const res = await fetch("/device-locations");
        const devices = await res.json();

        devices.forEach(device => {
            const key = device.name;
            const latlng = [device.lat, device.lng];

            if (markers[key]) {
                moveMarkerSmooth(markers[key], latlng, 1000); // smooth 1s
            } else {
                const icon = createLabel(key);
                const marker = L.marker(latlng, { icon }).addTo(map);
                markers[key] = marker;
            }
        });
    } catch (err) {
        console.error("Error fetching devices:", err);
    }
}

// Send your location to server
function updateLocation(lat, lng) {
    fetch("/update-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, lat, lng })
    }).catch(err => console.error("Error updating location:", err));
}

// Watch your geolocation continuously
if (navigator.geolocation) {
    navigator.geolocation.watchPosition(position => {
        const { latitude, longitude } = position.coords;
        map.setView([latitude, longitude], 15); // zoom on your location
        updateLocation(latitude, longitude);
    }, err => console.error("Geolocation error:", err), {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 5000
    });
} else {
    alert("Geolocation not supported by your browser.");
}

// Refresh all device positions every 1 second
setInterval(fetchDevices, 1000);
fetchDevices();
