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
            // Configure audio session for iOS compatibility
            try audioSession.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker, .allowBluetooth, .mixWithOthers])
            try audioSession.setActive(true)
            
            // Add audio session notification observers
            NotificationCenter.default.addObserver(self,
                selector: #selector(handleInterruption),
                name: AVAudioSession.interruptionNotification,
                object: nil)
            NotificationCenter.default.addObserver(self,
                selector: #selector(handleRouteChange),
                name: AVAudioSession.routeChangeNotification,
                object: nil)
        } catch {
            print("Failed to set up audio session: \(error.localizedDescription)")
        }
    }
    
    @objc private func handleInterruption(notification: Notification) {
        guard let userInfo = notification.userInfo,
              let typeValue = userInfo[AVAudioSessionInterruptionTypeKey] as? UInt,
              let type = AVAudioSession.InterruptionType(rawValue: typeValue) else {
            return
        }
        
        switch type {
        case .began:
            // Interruption began, pause playback
            if isPlaying {
                pausePlayback()
            }
        case .ended:
            // Interruption ended, resume if needed
            guard let optionsValue = userInfo[AVAudioSessionInterruptionOptionKey] as? UInt else { return }
            let options = AVAudioSession.InterruptionOptions(rawValue: optionsValue)
            if options.contains(.shouldResume) {
                playAudio(url: currentAudioURL)
            }
        @unknown default:
            break
        }
    }
    
    @objc private func handleRouteChange(notification: Notification) {
        guard let userInfo = notification.userInfo,
              let reasonValue = userInfo[AVAudioSessionRouteChangeReasonKey] as? UInt,
              let reason = AVAudioSession.RouteChangeReason(rawValue: reasonValue) else {
            return
        }
        
        switch reason {
        case .oldDeviceUnavailable:
            // Audio route changed (e.g., headphones unplugged), pause playback
            if isPlaying {
                pausePlayback()
            }
        default:
            break
        }
    }

    private var currentAudioURL: URL!
    
    func playAudio(url: URL) {
        do {
            // Ensure we have a valid file URL
            let audioFileURL: URL
            if url.isFileURL {
                audioFileURL = url
            } else if let urlString = url.absoluteString.removingPercentEncoding,
                      let fileURL = URL(string: urlString) {
                audioFileURL = fileURL
            } else {
                throw NSError(domain: "AudioEngine", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid audio URL"])
            }
            
            // Ensure audio session is properly configured
            try audioSession.setActive(false)
            try audioSession.setCategory(.playback, mode: .default)
            try audioSession.setActive(true)
            
            // Create and configure audio player with the validated URL
            let player = try AVAudioPlayer(contentsOf: audioFileURL)
            player.delegate = self
            player.prepareToPlay()
            player.volume = 1.0
            
            // Store references
            audioPlayer = player
            currentAudioURL = audioFileURL
            
            // Start playback with enhanced error handling
            if player.play() {
                isPlaying = true
                duration = player.duration
                startUpdatingCurrentTime()
                print("Audio playback started successfully")
            } else {
                throw NSError(domain: "AudioEngine", code: -2, userInfo: [NSLocalizedDescriptionKey: "Failed to start audio playback"])
            }
        } catch {
            print("Audio playback error: \(error.localizedDescription)")
            isPlaying = false
            audioPlayer = nil
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
    
    func startRecording(fileName: String) -> URL? {
        let audioFilename = getDocumentsDirectory().appendingPathComponent("\(fileName).wav")
        
        let settings = [
            AVFormatIDKey: Int(kAudioFormatLinearPCM),
            AVSampleRateKey: 44100,
            AVNumberOfChannelsKey: 2,
            AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue
        ]
        
        do {
            // Ensure proper audio session configuration for recording
            try audioSession.setActive(false)
            try audioSession.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker, .allowBluetooth])
            try audioSession.setActive(true)
            
            audioRecorder = try AVAudioRecorder(url: audioFilename, settings: settings)
            audioRecorder?.delegate = self
            audioRecorder?.isMeteringEnabled = true
            audioRecorder?.prepareToRecord()
            
            if audioRecorder?.record() == true {
                isRecording = true
                startMonitoringAudioLevels()
                print("Recording started successfully")
                return audioFilename
            } else {
                throw NSError(domain: "AudioEngine", code: -3, userInfo: [NSLocalizedDescriptionKey: "Failed to start recording"])
            }
        } catch {
            print("Recording error: \(error.localizedDescription)")
            return nil
        }
    }
    
    func stopRecording() {
        audioRecorder?.stop()
        isRecording = false
        
        // Reset audio session for playback
        do {
            try audioSession.setActive(false)
            try audioSession.setCategory(.playback, mode: .default)
            try audioSession.setActive(true)
        } catch {
            print("Failed to reset audio session after recording: \(error.localizedDescription)")
        }
    }
}

extension AudioEngine: AVAudioRecorderDelegate, AVAudioPlayerDelegate {
    func audioRecorderDidFinishRecording(_ recorder: AVAudioRecorder, successfully flag: Bool) {
        isRecording = false
        if !flag {
            print("Recording finished unsuccessfully")
        } else {
            print("Recording completed successfully")
        }
    }
    
    func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        isPlaying = false
        currentTime = 0
        if !flag {
            print("Playback finished unsuccessfully")
        } else {
            print("Playback completed successfully")
        }
    }
    
    func audioPlayerDecodeErrorDidOccur(_ player: AVAudioPlayer, error: Error?) {
        isPlaying = false
        print("Audio player decode error: \(error?.localizedDescription ?? "unknown error")")
    }
    
    func audioRecorderEncodeErrorDidOccur(_ recorder: AVAudioRecorder, error: Error?) {
        isRecording = false
        print("Audio recorder encode error: \(error?.localizedDescription ?? "unknown error")")
    }
}
