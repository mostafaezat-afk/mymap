from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
# Force threading mode for Windows compatibility
socketio = SocketIO(app, async_mode='threading')

# Store active drivers (demo purpose, in-memory)
drivers = {}
# Store active ride requests
ride_requests = {}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/driver')
def driver():
    return render_template('driver.html')

@app.route('/passenger')
def passenger():
    return render_template('passenger.html')

@app.route('/admin')
def admin():
    return render_template('admin.html')

@socketio.on('connect')
def handle_connect():
    print('Client connected')
    # Send current state to the new client
    emit('update_map', drivers)
    # If it's an admin (or we just broadcast requests to everyone for MVP simplicity), send requests too.
    # Ideally, we should partition based on roles, but for now sending everything is fine.
    emit('initial_requests', ride_requests)

@socketio.on('driver_location')
def handle_driver_location(data):
    # data = {'id': 'driver_id', 'lat': ..., 'lng': ..., 'status': ..., 'type': 'tuktuk|moto|tricycle'}
    drivers[data['id']] = data
    emit('update_map', drivers, broadcast=True)

import math

def calculate_distance(lat1, lon1, lat2, lon2):
    # Haversine formula to calculate distance in km
    R = 6371  # Radius of earth in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) * math.sin(dlat / 2) + \
        math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * \
        math.sin(dlon / 2) * math.sin(dlon / 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    d = R * c
    return d

def calculate_fare(distance_km):
    base_fare = 10  # Base fare in EGP
    per_km_rate = 5 # EGP per Km
    min_fare = 15   # Minimum fare
    
    fare = base_fare + (distance_km * per_km_rate)
    return max(fare, min_fare)

@socketio.on('request_ride')
def handle_request_ride(data):
    # data = {'passenger_id': '...', 'name': '...', 'phone': '...', 'lat': ..., 'lng': ...}
    
    # Calculate approximate distance to a central point or nearby drivers (Simplified: just request logic)
    # Ideally, we calculate distance from User to Driver, but for fare estimate we need Destination.
    # Since we don't have destination input yet, we will just use a base estimation logic or wait for input.
    # Let's assume for MVP step 2.5: User Inputs Destination (Optional) or we just show "Estimated Price Range".
    # User asked for "Pricing Policy".
    # Let's add a placeholder distance for demo or calculate logic if destination is provided.
    
    # Update: User just wants pricing. We need destination for accurate pricing.
    # For now, let's assume a standard ride or add destination input later.
    # Let's stick to the prompt: "add inputs for Name and Phone".
    
    request_id = data['passenger_id']
    ride_requests[request_id] = data
    print(f"New ride request from {data.get('name', request_id)}")
    
    # Broadcast to all drivers with user details
    emit('new_ride_request', data, broadcast=True)

@socketio.on('chat_message')
def handle_chat_message(data):
    # data = {'sender_id': '...', 'receiver_id': '...', 'message': '...'}
    # Emit to specific receiver (broadcasting for simplicity in this MVP without room management)
    print(f"Chat: {data['sender_id']} -> {data['receiver_id']}: {data['message']}")
    emit('chat_message_received', data, broadcast=True)

@socketio.on('accept_ride')
def handle_accept_ride(data):
    # data = {'driver_id': '...', 'driver_name': '...', 'driver_phone': '...', 'passenger_id': '...'}
    req_id = data['passenger_id']
    driver_id = data['driver_id']
    
    if req_id in ride_requests:
        # Notify passenger with driver details
        emit('ride_accepted', {
            'passenger_id': req_id,
            'driver_id': driver_id,
            'driver_name': data.get('driver_name', 'السائق'),
            'driver_phone': data.get('driver_phone', '')
        }, broadcast=True)
        del ride_requests[req_id]
        print(f"Ride accepted by {driver_id}")

@socketio.on('sos_signal')
def handle_sos(data):
    print(f"SOS RECEIVED from {data['id']} ({data['type']})")
    # In real app: SMS to admin, notify police API, etc.
    # For MVP: Broadcast to admin (or everyone)
    emit('sos_alert', data, broadcast=True)

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

if __name__ == '__main__':
    # Local development with HTTPS (adhoc)
    # For production, Gunicorn handles the server, so this block ignores it.
    socketio.run(app, debug=True, host='0.0.0.0', port=5000, allow_unsafe_werkzeug=True, ssl_context='adhoc')
