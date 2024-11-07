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

const Bass_StandardFrequencies = {
    'E1': 41.20,
    'A1': 55.00,
    'D2': 73.42,
    'G2': 98.00,
};

const Bass_HalfStepDownFrequencies = {
    'Eb1': 38.89,
    'Ab1': 51.91,
    'Db2': 69.30,
    'Gb2': 92.50,
};

const Bass_WholeStepDownFrequencies = {
    'D1': 36.71,
    'G1': 49.00,
    'C2': 65.41,
    'F2': 87.31
};

const Bass_Drop_DFrequencies = {
    'D1': 36.71,
    'A1': 55.00,
    'D2': 73.42,
    'G2': 98.00,
};

const Bass_Drop_Cfrequencies = {
    'C1': 32.70,
    'G1': 49.00,
    'C2': 65.41,
    'F2': 87.31,
};

let noteFrequencies = Bass_StandardFrequencies;

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
    if (selectedType === "Bass_Standard") {
        noteFrequencies = Bass_StandardFrequencies;
    } else if (selectedType === "Bass_Half_step_down") {
        noteFrequencies = Bass_HalfStepDownFrequencies;
    } else if (selectedType === "Bass_Whole_step_down") {
            noteFrequencies = Bass_WholeStepDownFrequencies;
    } else if (selectedType === "Bass_Drop_D") {
        noteFrequencies = Bass_Drop_DFrequencies;
    } else if (selectedType === "Bass_Drop_C") {
        noteFrequencies = Bass_Drop_Cfrequencies;
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