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
    'E': 41.20,
    'A': 55.00,
    'D': 73.42,
    'G': 98.00,
};

const halfStepDownFrequencies = {
    'Eb': 38.89,
    'Ab': 51.91,
    'Db': 69.29,
    'Gb': 96.00,
};

const Drop_DFrequencies = {
    'D': 73.42,
    'A': 55.00,
    'D': 73.42,
    'G': 98.00,
};

const C_G_D_APfrequencies = {
    'C': 32.70,
    'G': 49.00,
    'D': 73.42,
    'A': 110.00,
};

const Open_Dfrequencies = {
    'D': 73.42,
    'A': 55.00,
    'D': 73.42,
    'F#': 92.50,
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
    // กำหนด noteFrequencies ตามประเภทการจูน
    if (selectedType === "standard") {
        noteFrequencies = standardFrequencies;
    } else if (selectedType === "half_step_down") {
        noteFrequencies = halfStepDownFrequencies;
    } else if (selectedType === "C_G_D_A") {
        noteFrequencies = C_G_D_AFrequencies;
    } else if (selectedType === "Drop_D") {
        noteFrequencies = DropDfrequencies;
    } else if (selectedType === "Open_D") {
        noteFrequencies = OpenDFrequencies;
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
