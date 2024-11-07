from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

def guitar_tuning_notes(tuning_type):
    if tuning_type == "Guitar_Standard":
        return ['E2', 'A2', 'D3', 'G3', 'B3', 'E4']
    elif tuning_type == "Guitar_Half_step_down":
        return ['Eb2', 'Ab2', 'Db3', 'Gb3', 'Bb3', 'Eb4']
    elif tuning_type == "Guitar_Whole_step_down":
        return ['D2', 'G2', 'C3', 'F3', 'A3', 'D4']
    elif tuning_type == "Guitar_Drop_D":
        return ['D2', 'A2', 'D3', 'G3', 'B3', 'E4']
    elif tuning_type == "Guitar_Drop_C":
        return ['C2', 'G2', 'C3', 'G3', 'C4', 'E4']
    elif tuning_type == "Guitar_Open_C":
        return ['C2', 'G2', 'C3', 'G3', 'C4', 'E4']
    elif tuning_type == "Guitar_Open_D":
        return ['D2', 'A2', 'D3', 'F#3', 'A3', 'D4']
    elif tuning_type == "Guitar_Open_E":
        return ['E2', 'B2', 'E3', 'G#3', 'B3', 'E4']
    elif tuning_type == "Guitar_Open_F":
        return ['C2', 'F2', 'C3', 'F3', 'A3', 'F4']
    elif tuning_type == "Guitar_Open_A":
        return ['E2', 'A2', 'C#3', 'E3', 'A3', 'E4']
    elif tuning_type == "Guitar_Open_B":
        return ['B1', 'F#2', 'B2', 'F#3', 'B3', 'D#4']
    else:
        return []
    
def bass_tuning_notes(tuning_type):
    if tuning_type == "Bass_Standard":
        return ['E1','A1','D2','G2']
    elif tuning_type == "Bass_Half_step_down":
        return ['Eb1', 'Ab1', 'Db2', 'Gb2']
    elif tuning_type == "Bass_Whole_step_down":
        return ['D1', 'G1', 'C2', 'F2']
    elif tuning_type == "Bass_Drop_D":
        return ['D1', 'A1', 'D2', 'G2']
    elif tuning_type == "Bass_Drop_C":
        return ['C1', 'G1', 'C2', 'F2']
    else:
        return []

@app.route('/get_tuning', methods=['POST'])
def get_tuning():
    data = request.get_json()
    tuning_type = data.get('tuning')
    if "Guitar" in tuning_type:
        notes = guitar_tuning_notes(tuning_type)
    elif "Bass" in tuning_type:
        notes = bass_tuning_notes(tuning_type)
    else:
        notes = []
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

@app.route('/get_data1')
def get_data1():
    data = {"message":"American musician who served as the bassist \nfor the heavy metal band Metallica."}
    return jsonify(data)

@app.route('/get_data2')
def get_data2():
    data = {"message":"American singer, songwriter, and guitarist."}
    return jsonify(data)

@app.route('/get_data3')
def get_data3():
    data = {"message":"an American bassist. He was the uncredited \nbassist on most of the Motown Records."}
    return jsonify(data)

@app.route('/get_data4')
def get_data4():
    data = {"message":"an American musician. He was the lead vocalist, guitarist, primary songwriter, and a founding member of the grunge band Nirvana."}
    return jsonify(data)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)