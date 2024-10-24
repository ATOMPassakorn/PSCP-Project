from flask import Flask, request, jsonify
import os

app = Flask(__name__)
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
    app.run(debug=True)

