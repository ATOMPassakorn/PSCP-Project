let audioContext;
let analyser;
let microphone;
let mediaRecorder;
let audioChunks = [];
let isAnalyzing = false;

async function startTuning() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    microphone = audioContext.createMediaStreamSource(stream);
    microphone.connect(analyser);

    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = event => {
        audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
        isAnalyzing = false;
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        audioChunks = [];
        const audioUrl = URL.createObjectURL(audioBlob);

        const formData = new FormData();
        formData.append('audio', audioBlob, 'audio.wav');

        try {
            const response = await fetch('http://127.0.0.1:5000/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            document.getElementById('note').textContent = '-';
            document.getElementById('status').textContent = '-';
            setTimeout(() => {
                location.reload();
            });
        } catch (error) {
            console.error('Error uploading audio:', error);
            document.getElementById('note').textContent = 'ERROR';
        }
    };

    mediaRecorder.start();
    isAnalyzing = true;
    document.getElementById('startButton').textContent = 'Stop Tuning';
    analyze();
}

function analyze() {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    function getPitch() {
        if (!isAnalyzing) return;
        analyser.getByteFrequencyData(dataArray);
        const pitchData = getPitchFromData(dataArray);
        const pitch = pitchData.note;
        const frequency = pitchData.frequency;

        document.getElementById('note').textContent = pitch ? pitch : 'ไม่สามารถตรวจจับได้';

        const selectedNote = document.getElementById('noteSelect').value;
        const targetFrequency = noteFrequencies[selectedNote];
        if (pitch && Math.abs(frequency - targetFrequency) <= 15) {
            document.getElementById('status').textContent = 'ตรงกัน!';
        } else if (frequency < targetFrequency) {
            document.getElementById('status').textContent = 'ปรับขึ้น!';
        } else {
            document.getElementById('status').textContent = 'ปรับลง!';
        }

        updateNeedle(frequency, targetFrequency);
        requestAnimationFrame(getPitch);
    }
    getPitch();
}

const standardFrequencies = {
    'E': 82.41,
    'A': 110.00,
    'D': 146.83,
    'G': 196.00,
    'B': 246.94,
    'E_high': 329.63,
};

const halfStepDownFrequencies = {
    'Eb': 77.78,
    'Ab': 103.83,
    'Db': 138.59,
    'Gb': 196.00,
    'Bb': 186.94,
    'Eb_high': 369.63,
};

const fullStepDownFrequencies = {
    'D': 73.42,
    'G': 98.00,
    'C': 130.81,
    'F': 174.61,
    'A': 220.00,
    'D_high': 293.66,
};

const DropDfrequencies = {
    'D': 73.42,
    'A': 110.00,
    'D_high': 146.83,
    'G': 196.00,
    'B': 246.94,
    'E_high': 329.63,
};

const OpenGfrequencies = {
    'D': 73.42,
    'G': 98.00,
    'D_high': 146.83,
    'G_high': 196.00,
    'B': 246.94,
    'D_high': 293.66,
};

const OpenDFrequencies = {
    'D': 73.42,
    'A': 110.00,
    'D_high': 146.83,
    'F#': 185.00,
    'B': 246.94,
    'D_high': 293.66,
};

let noteFrequencies = standardFrequencies;

function getPitchFromData(dataArray) {
    let maxIndex = -1;
    let maxValue = -1;

    for (let i = 0; i < dataArray.length; i++) {
        if (dataArray[i] > maxValue) {
            maxValue = dataArray[i];
            maxIndex = i;
        }
    }

    const frequency = maxIndex * audioContext.sampleRate / analyser.fftSize;
    const noteName = frequencyToNoteName(frequency);
    return { note: noteName, frequency };
}

function frequencyToNoteName(frequency) {
    let closestNote = null;
    let closestDiff = Infinity;

    for (const note in noteFrequencies) {
        const diff = Math.abs(noteFrequencies[note] - frequency);
        if (diff < closestDiff) {
            closestDiff = diff;
            closestNote = note;
        }
    }

    return closestNote ? `${closestNote} (${frequency.toFixed(2)} Hz)` : null;
}

function updateNeedle(frequency, targetFrequency) {
    const maxAngle = 90;
    const minAngle = -90;

    if (targetFrequency) {
        const frequencyDiff = frequency - targetFrequency;
        const percentageDiff = (frequencyDiff / targetFrequency) * 100;

        let angle = Math.max(minAngle, Math.min(maxAngle, percentageDiff));
        document.getElementById('needle').style.transform = `rotate(${angle}deg)`;
    }
}

document.getElementById('startButton').onclick = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        document.getElementById('startButton').textContent = 'Start Tuning';
    } else {
        startTuning();
    }
};

document.getElementById('noteSelect').onchange = function() {
    document.getElementById('currentNote').textContent = this.value;
};

document.getElementById('tuningType').onchange = async function() {
    const selectedType = this.value;

    if (selectedType === "standard") {
        noteFrequencies = standardFrequencies;
    } else if (selectedType === "half_step_down") {
        noteFrequencies = halfStepDownFrequencies;
    } else if (selectedType === "full_step_down") {
        noteFrequencies = fullStepDownFrequencies;
    } else if (selectedType === "Drop_D") {
        noteFrequencies = DropDfrequencies;
    } else if (selectedType === "Open_G") {
        noteFrequencies = OpenGfrequencies;
    } else if (selectedType === "Open_D") {
        noteFrequencies = OpenDFrequencies;
    }

    const noteSelect = document.getElementById('noteSelect');
    noteSelect.innerHTML = '';

    let notes;
    if (selectedType === "half_step_down") {
        notes = ['Eb', 'Ab', 'Db', 'Gb', 'Bb', 'Eb_high'];
    } else if (selectedType === "full_step_down") {
        notes = ['D', 'G', 'C', 'F', 'A', 'D_high'];
    } else if (selectedType === "Drop_D") {
        notes = ['D', 'A', 'D_high', 'G', 'B', 'E_high'];
    } else if (selectedType === "Open_G") {
        notes = ['D', 'G', 'D_high', 'G', 'B', 'D_high'];
    } else if (selectedType === "Open_D") {
        notes = ['D', 'A', 'D_high', 'F#', 'B', 'D_high'];
    } else {
        notes = Object.keys(noteFrequencies);
    }

    notes.for


    notes.forEach(note => {
        const option = document.createElement('option');
        option.value = note;
        option.textContent = `${note} (${noteFrequencies[note]} Hz)`;
        noteSelect.appendChild(option);
    });

    document.getElementById('currentNote').textContent = notes[0];
};
c