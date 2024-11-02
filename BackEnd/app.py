from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# ฟังก์ชันคืนค่าตามการจูน
def get_tuning_notes(tuning_type):
    if tuning_type == "standard":
        return ['E', 'A', 'D', 'G', 'B', 'E_high']
    elif tuning_type == "half_step_down":
        return ['Eb', 'Ab', 'Db', 'Gb', 'Bb', 'Eb_high']
    elif tuning_type == "full_step_down":
        return ['D', 'G', 'C', 'F', 'A', 'D_high']
    else:
        return []

@app.route('/get_tuning', methods=['POST'])
def get_tuning():
    data = request.get_json()
    tuning_type = data.get('tuning')
    notes = get_tuning_notes(tuning_type)
    return jsonify({'notes': notes})

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'audio' not in request.files:
        return jsonify({'error': 'not found sound'}), 400
    
    audio_file = request.files['audio']
    if audio_file.filename == '':
        return jsonify({'error': 'not found file'}), 400

    audio_file_path = os.path.join(UPLOAD_FOLDER, audio_file.filename)
    audio_file.save(audio_file_path)

    return jsonify({'message': 'upload success'}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
