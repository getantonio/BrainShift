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
        this.audioBuffers = new Map(); // Cache for loaded audio buffers
        this.currentSource = null;
        this.gainNode = null;

        // Bind methods
        this.playAudio = this.playAudio.bind(this);
        this.stopAudio = this.stopAudio.bind(this);
        this.loadAudioBuffer = this.loadAudioBuffer.bind(this);

        this.initializeAudio();
        this.setupEventListeners();
    }

    async playAudio(url) {
        try {
            if (!this.audioContext) {
                await this.initializeAudio();
            }

            // Resume audio context if suspended (required for iOS)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            // Stop any currently playing audio
            this.stopAudio();

            // Get or load audio buffer
            let buffer = this.audioBuffers.get(url);
            if (!buffer) {
                buffer = await this.loadAudioBuffer(url);
                this.audioBuffers.set(url, buffer);
            }

            // Create and configure source
            this.currentSource = this.audioContext.createBufferSource();
            this.currentSource.buffer = buffer;

            // Create and configure gain node if not exists
            if (!this.gainNode) {
                this.gainNode = this.audioContext.createGain();
                this.gainNode.connect(this.audioContext.destination);
            }

            // Connect nodes
            this.currentSource.connect(this.gainNode);
            
            // Start playback
            this.currentSource.start(0);
            
            return true;
        } catch (error) {
            console.error('Playback error:', error);
            throw new Error(`Failed to play audio: ${error.message}`);
        }
    }

    stopAudio() {
        if (this.currentSource) {
            try {
                this.currentSource.stop();
            } catch (e) {
                // Ignore errors if source has already stopped
            }
            this.currentSource = null;
        }
    }

    async loadAudioBuffer(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            return await this.audioContext.decodeAudioData(arrayBuffer);
        } catch (error) {
            console.error('Error loading audio:', error);
            throw new Error(`Failed to load audio: ${error.message}`);
        }
    }

    async initializeAudio() {
        try {
            // Initialize audio context with iOS compatibility
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();

            // For iOS, we need to handle the audio context state
            if (this.audioContext.state === 'suspended') {
                const resumeAudio = async () => {
                    await this.audioContext.resume();
                    // Remove the event listener once audio is running
                    document.removeEventListener('touchstart', resumeAudio);
                    document.removeEventListener('mousedown', resumeAudio);
                };

                // Add both touch and mouse events for maximum compatibility
                document.addEventListener('touchstart', resumeAudio, { once: true });
                document.addEventListener('mousedown', resumeAudio, { once: true });
            }

            // Request microphone permissions
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            
            await this.setupAudioNodes(stream);
            
            // Add error handling for audio context state changes
            this.audioContext.onstatechange = () => {
                console.log('Audio context state changed:', this.audioContext.state);
                if (this.audioContext.state === 'interrupted') {
                    this.handleAudioInterruption();
                }
            };

            return true;
        } catch (error) {
            console.error('Error initializing audio:', error);
            throw new Error(`Unable to initialize audio: ${error.message}`);
        }
    }

    async handleAudioInterruption() {
        try {
            if (this.audioContext.state !== 'running') {
                await this.audioContext.resume();
            }
        } catch (error) {
            console.error('Error handling audio interruption:', error);
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
