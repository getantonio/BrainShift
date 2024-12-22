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
            // Ensure audio session is active
            try audioSession.setActive(true)
            
            // Create and configure audio player
            let player = try AVAudioPlayer(contentsOf: url)
            player.delegate = self
            player.prepareToPlay()
            
            // Store references
            audioPlayer = player
            currentAudioURL = url
            
            // Start playback
            if player.play() {
                isPlaying = true
                duration = player.duration
                startUpdatingCurrentTime()
            } else {
                print("Failed to start audio playback")
            }
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