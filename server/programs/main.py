import os
from flask import Flask, render_template, request, jsonify

# Compute absolute paths relative to this file
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../client"))
TEMPLATES = os.path.join(BASE_DIR, "templates")
STATIC = os.path.join(BASE_DIR, "static")

# Initialize Flask app
app = Flask(
    __name__,
    template_folder=TEMPLATES,
    static_folder=STATIC
)

# Simple in-memory database
DataBase = {}

# ------------------- Routes -------------------

# Login page
@app.route("/", methods=["GET"])
def login():
    return render_template("login.html")

# Register endpoint
@app.route("/register", methods=["POST"])
def register():
    data = request.get_json(force=True, silent=True)
    if not data:
        return jsonify({"status": "failed", "message": "Invalid JSON"}), 400

    username = data.get("username")
    passcode = data.get("passcode")

    if not username or not passcode:
        return jsonify({"status": "failed", "message": "Missing fields"}), 400

    SERVER_PASSCODE = "1234"
    if passcode != SERVER_PASSCODE:
        return jsonify({"status": "failed", "message": "Invalid passcode"}), 403

    # Add user to database
    DataBase[username] = {"authorized": True}

    # Redirect to map page instead of /welcome
    return jsonify({"status": "success", "redirect": "/map"})

# Update user location
@app.route("/update-location", methods=["POST"])
def update_location():
    data = request.get_json(force=True, silent=True)
    if not data or not all(k in data for k in ("username", "lat", "lng")):
        return jsonify({"status": "failed", "message": "Missing fields"}), 400

    username = data["username"]
    lat = data["lat"]
    lng = data["lng"]

    if username in DataBase:
        DataBase[username]["lat"] = lat
        DataBase[username]["lng"] = lng
        return jsonify({"status": "success"})
    return jsonify({"status": "failed", "message": "User not found"}), 404

# Get all device locations
@app.route("/device-locations")
def device_locations():
    devices = [
        {"name": user, "lat": info.get("lat"), "lng": info.get("lng")}
        for user, info in DataBase.items()
        if "lat" in info and "lng" in info
    ]
    return jsonify(devices)

# Map page
@app.route("/map")
def map_page():
    return render_template("map.html")

# ------------------- Main -------------------

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
