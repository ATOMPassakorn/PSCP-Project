let audioContext;
        let analyser;
        let microphone;
        let mediaRecorder;
        let audioChunks = [];

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
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                audioChunks = [];
                const audioUrl = URL.createObjectURL(audioBlob);
                document.getElementById('note').textContent = 'กำลังอัปโหลด...';

                const formData = new FormData();
                formData.append('audio', audioBlob, 'audio.wav');

                const response = await fetch('http://127.0.0.1:5000/upload', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();
                document.getElementById('note').textContent = result.message;
            };

            mediaRecorder.start();
            document.getElementById('startButton').textContent = 'Stop Tuning';
            analyze();
        }

        function analyze() {
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            function getPitch() {
                analyser.getByteFrequencyData(dataArray);
                const pitchData = getPitchFromData(dataArray);
                const pitch = pitchData.note;
                const frequency = pitchData.frequency;

                document.getElementById('note').textContent = pitch ? pitch : 'ไม่สามารถตรวจจับได้';

                const selectedNote = document.getElementById('noteSelect').value;
                const targetFrequency = noteFrequencies[selectedNote];
                if (pitch && Math.abs(frequency - targetFrequency) < 5) {
                    document.getElementById('status').textContent = 'ตรงกัน!';
                } else {
                    document.getElementById('status').textContent = 'ปรับเสียงให้ตรง!';
                }
                
                requestAnimationFrame(getPitch);
            }
            getPitch();
        }

        const noteFrequencies = {
            'E4': 329.63,
            'A4': 440.00,
            'D5': 587.33,
            'G5': 783.99,
            'B5': 987.77,
        };

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