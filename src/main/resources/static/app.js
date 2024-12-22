class AudioManager {
    constructor() {
        this.audioContext = null;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.visualizerCanvas = document.getElementById('visualizer');
        this.visualizerCtx = this.visualizerCanvas.getContext('2d');
        this.recordButton = document.getElementById('recordButton');
        this.stopButton = document.getElementById('stopButton');

        this.initializeAudio();
        this.setupEventListeners();
    }

    async initializeAudio() {
        try {
            // Initialize audio context with iOS compatibility
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();

            // Request microphone permissions
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.setupAudioNodes(stream);
        } catch (error) {
            console.error('Error initializing audio:', error);
            alert('Unable to access microphone. Please ensure you have granted permission.');
        }
    }

    setupAudioNodes(stream) {
        // Create media recorder with enhanced iOS compatibility
        this.mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'audio/webm;codecs=opus'
        });

        // Set up audio analysis for visualization
        const source = this.audioContext.createMediaStreamSource(stream);
        const analyser = this.audioContext.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);

        this.mediaRecorder.ondataavailable = (event) => {
            this.audioChunks.push(event.data);
        };

        this.mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm;codecs=opus' });
            const audioUrl = URL.createObjectURL(audioBlob);
            this.saveRecording(audioUrl);
            this.audioChunks = [];
        };

        // Start visualization
        this.drawVisualizer(analyser);
    }

    setupEventListeners() {
        this.recordButton.addEventListener('click', () => this.startRecording());
        this.stopButton.addEventListener('click', () => this.stopRecording());

        // Handle iOS audio session initialization
        document.addEventListener('touchstart', () => {
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
        }, { once: true });
    }

    startRecording() {
        if (!this.mediaRecorder) return;
        this.mediaRecorder.start();
        this.isRecording = true;
        this.recordButton.disabled = true;
        this.stopButton.disabled = false;
    }

    stopRecording() {
        if (!this.mediaRecorder) return;
        this.mediaRecorder.stop();
        this.isRecording = false;
        this.recordButton.disabled = false;
        this.stopButton.disabled = true;
    }

    async saveRecording(audioUrl) {
        const name = prompt('Enter a name for your recording:');
        if (!name) return;

        try {
            const response = await fetch('/api/recordings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    audioUrl,
                })
            });

            if (!response.ok) throw new Error('Failed to save recording');

            this.loadPlaylists(); // Refresh playlists
        } catch (error) {
            console.error('Error saving recording:', error);
            alert('Failed to save recording. Please try again.');
        }
    }

    drawVisualizer(analyser) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const width = this.visualizerCanvas.width;
        const height = this.visualizerCanvas.height;
        const barWidth = width / bufferLength * 2.5;
        let barHeight;
        let x = 0;

        const draw = () => {
            requestAnimationFrame(draw);
            x = 0;
            analyser.getByteFrequencyData(dataArray);

            this.visualizerCtx.fillStyle = '#1a1a1a';
            this.visualizerCtx.fillRect(0, 0, width, height);

            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] / 2;
                const r = barHeight + 25;
                const g = 250;
                const b = 50;

                this.visualizerCtx.fillStyle = `rgb(${r},${g},${b})`;
                this.visualizerCtx.fillRect(x, height - barHeight, barWidth, barHeight);
                x += barWidth + 1;
            }
        };

        draw();
    }
}

// Initialize audio manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new AudioManager();
});
