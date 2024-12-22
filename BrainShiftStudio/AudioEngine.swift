import Foundation
import AVFoundation
import Combine

class AudioEngine: ObservableObject {
    static let shared = AudioEngine()
    
    private var audioSession: AVAudioSession
    private var audioEngine: AVAudioEngine?
    private var audioPlayer: AVAudioPlayer?
    private var audioRecorder: AVAudioRecorder?
    private var playerNodes: [String: AVAudioPlayerNode] = [:]
    
    @Published var isRecording = false
    @Published var isPlaying = false
    @Published var currentTime: TimeInterval = 0
    @Published var duration: TimeInterval = 0
    @Published var audioLevel: Float = 0
    
    private init() {
        self.audioSession = AVAudioSession.sharedInstance()
        setupAudioSession()
    }
    
    private func setupAudioSession() {
        do {
            try audioSession.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker, .allowBluetooth])
            try audioSession.setActive(true)
        } catch {
            print("Failed to set up audio session: \(error.localizedDescription)")
        }
    }
    
    func startRecording(fileName: String) -> URL? {
        let audioFilename = getDocumentsDirectory().appendingPathComponent("\(fileName).wav")
        
        let settings = [
            AVFormatIDKey: Int(kAudioFormatLinearPCM),
            AVSampleRateKey: 44100,
            AVNumberOfChannelsKey: 2,
            AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue
        ]
        
        do {
            audioRecorder = try AVAudioRecorder(url: audioFilename, settings: settings)
            audioRecorder?.delegate = self
            audioRecorder?.isMeteringEnabled = true
            audioRecorder?.prepareToRecord()
            audioRecorder?.record()
            isRecording = true
            
            // Start monitoring audio levels
            startMonitoringAudioLevels()
            
            return audioFilename
        } catch {
            print("Could not start recording: \(error.localizedDescription)")
            return nil
        }
    }
    
    func stopRecording() {
        audioRecorder?.stop()
        isRecording = false
    }
    
    func playAudio(url: URL) {
        do {
            audioPlayer = try AVAudioPlayer(contentsOf: url)
            audioPlayer?.delegate = self
            audioPlayer?.prepareToPlay()
            audioPlayer?.play()
            isPlaying = true
            duration = audioPlayer?.duration ?? 0
            
            // Start updating current time
            startUpdatingCurrentTime()
        } catch {
            print("Could not play audio: \(error.localizedDescription)")
        }
    }
    
    func stopPlayback() {
        audioPlayer?.stop()
        isPlaying = false
        currentTime = 0
    }
    
    func pausePlayback() {
        audioPlayer?.pause()
        isPlaying = false
    }
    
    private func startMonitoringAudioLevels() {
        Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] timer in
            guard let self = self, self.isRecording else {
                timer.invalidate()
                return
            }
            
            self.audioRecorder?.updateMeters()
            let averagePower = self.audioRecorder?.averagePower(forChannel: 0) ?? -160
            let normalizedValue = pow(10, averagePower / 20)
            self.audioLevel = Float(normalizedValue)
        }
    }
    
    private func startUpdatingCurrentTime() {
        Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] timer in
            guard let self = self, self.isPlaying else {
                timer.invalidate()
                return
            }
            
            self.currentTime = self.audioPlayer?.currentTime ?? 0
        }
    }
    
    private func getDocumentsDirectory() -> URL {
        FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
    }
}

extension AudioEngine: AVAudioRecorderDelegate, AVAudioPlayerDelegate {
    func audioRecorderDidFinishRecording(_ recorder: AVAudioRecorder, successfully flag: Bool) {
        isRecording = false
        if !flag {
            print("Recording finished unsuccessfully")
        }
    }
    
    func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        isPlaying = false
        currentTime = 0
        if !flag {
            print("Playback finished unsuccessfully")
        }
    }
}
