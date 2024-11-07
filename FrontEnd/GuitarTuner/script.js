let audioContext;
let analyser;
let microphone;
let mediaRecorder;
let audioChunks = [];
let isAnalyzing = false;
let matchSound = new Audio('../GuitarTuner/effect/ding.wav');
let PlayedSound = false;

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
            const response = await fetch('https://guitar-salmon.onrender.com/upload', {
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
        if (pitch && Math.abs(frequency - targetFrequency) <= 10) {
            document.getElementById('status').textContent = 'ตรงกัน!';
            if (!PlayedSound) {
                matchSound.play();
                PlayedSound = true;
            }
        } else {
            document.getElementById('status').textContent = frequency < targetFrequency ? 'ปรับขึ้น!' : 'ปรับลง!';
            PlayedSound = false;
        }

        updateNeedle(frequency, targetFrequency);
        requestAnimationFrame(getPitch);
    }
    getPitch();
}

const Guitar_StandardFrequencies = {
    'E2': 82.41,
    'A2': 110.00,
    'D3': 146.83,
    'G3': 196.00,
    'B3': 246.94,
    'E4': 329.63,
};

const Guitar_HalfStepDownFrequencies = {
    'Eb2': 77.78,
    'Ab2': 103.83,
    'Db3': 138.59,
    'Gb3': 185.00,
    'Bb3': 233.08,
    'Eb4': 311.13,
};

const Guitar_WholeStepDownFrequencies = {
    'D2': 73.42,
    'G2': 98.00,
    'C3': 130.81,
    'F3': 174.61,
    'A3': 220.00,
    'D4': 293.66,
};

const Guitar_DropDfrequencies = {
    'D2': 73.42,
    'A2': 110.00,
    'D3': 146.83,
    'G3': 196.00,
    'B3': 246.94,
    'E4': 329.63,
};

const Guitar_DropCfrequencies = {
    'C2': 65.41,
    'G2': 98.00,
    'C3': 130.81,
    'F3': 174.61,
    'A3': 220.00,
    'D4': 293.66,
};

const Guitar_OpenCfrequencies = {
    'C2': 65.41,
    'G2': 98.00,
    'C3': 130.81,
    'G3': 196.00,
    'C4': 261.63,
    'E4': 329.63,
};

const Guitar_OpenDFrequencies = {
    'D2': 73.42,
    'A2': 110.00,
    'D3': 146.83,
    'F#3': 185.00,
    'A3': 220.00,
    'D4': 293.66,
};

const Guitar_OpenEFrequencies = {
    'E2': 82.41,
    'B2': 123.47,
    'E3': 164.81,
    'G#3': 207.65,
    'B3': 246.94,
    'E4': 329.63,
};

const Guitar_OpenFFrequencies = {
    'C2': 65.41,
    'F2': 87.31,
    'C3': 130.81,
    'F3': 174.61,
    'A3': 220.00,
    'F4': 349.23,
};

const Guitar_OpenAFrequencies = {
    'E2': 82.41,
    'A2': 110.00,
    'C#3': 138.59,
    'E3': 164.81,
    'A3': 220.00,
    'E4': 329.63,
};

const Guitar_OpenBFrequencies = {
    'B1': 61.74,
    'F#2': 92.50,
    'B2': 123.47,
    'F#3': 185.00,
    'B3': 246.94,
    'D#4': 311.13,
};

let noteFrequencies = Guitar_StandardFrequencies;

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
    if (selectedType === "Guitar_Standard") {
        noteFrequencies = Guitar_StandardFrequencies;
    } else if (selectedType === "Guitar_Half_step_down") {
        noteFrequencies = Guitar_HalfStepDownFrequencies;
    } else if (selectedType === "Guitar_Whole_step_down") {
        noteFrequencies = Guitar_WholeStepDownFrequencies;
    } else if (selectedType === "Guitar_Drop_D") {
        noteFrequencies = Guitar_DropDfrequencies;
    } else if (selectedType === "Guitar_Drop_C") {
        noteFrequencies = Guitar_DropCfrequencies;
    } else if (selectedType === "Guitar_Open_C") {
        noteFrequencies = Guitar_OpenCfrequencies;
    } else if (selectedType === "Guitar_Open_D") {
        noteFrequencies = Guitar_OpenDFrequencies;
    } else if (selectedType === "Guitar_Open_E") {
        noteFrequencies = Guitar_OpenEFrequencies;
    } else if (selectedType === "Guitar_Open_F") {
        noteFrequencies = Guitar_OpenFFrequencies;
    } else if (selectedType === "Guitar_Open_A") {
        noteFrequencies = Guitar_OpenAFrequencies;
    } else if (selectedType === "Guitar_Open_B") {
        noteFrequencies = Guitar_OpenBFrequencies;
    }
    const response = await fetch('https://guitar-salmon.onrender.com/get_tuning', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tuning: selectedType })
    });
    const data = await response.json();
    const notes = data.notes;
    const noteSelect = document.getElementById('noteSelect');
    noteSelect.innerHTML = '';

    notes.forEach(note => {
        const option = document.createElement('option');
        option.value = note;
        option.textContent = `${note} (${noteFrequencies[note]} Hz)`;
        noteSelect.appendChild(option);
    });
    document.getElementById('currentNote').textContent = notes[0];
}