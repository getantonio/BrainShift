import SwiftUI

struct RecordingView: View {
    @StateObject private var audioEngine = AudioEngine.shared
    @State private var recordingName = ""
    @State private var selectedPlaylist: Playlist?
    @State private var showingNamePrompt = false
    @State private var recordingURL: URL?
    
    @Environment(\.managedObjectContext) private var viewContext
    @FetchRequest(
        sortDescriptors: [NSSortDescriptor(keyPath: \Playlist.order, ascending: true)],
        animation: .default)
    private var playlists: FetchedResults<Playlist>
    
    var body: some View {
        VStack(spacing: 20) {
            // Waveform Visualization
            WaveformView(audioLevel: audioEngine.audioLevel)
                .frame(height: 100)
                .padding()
            
            // Recording Controls
            HStack(spacing: 40) {
                Button(action: {
                    if audioEngine.isRecording {
                        stopRecording()
                    } else {
                        startRecording()
                    }
                }) {
                    Image(systemName: audioEngine.isRecording ? "stop.circle.fill" : "mic.circle.fill")
                        .resizable()
                        .frame(width: 60, height: 60)
                        .foregroundColor(audioEngine.isRecording ? .red : .purple)
                }
            }
            .padding()
            
            if !audioEngine.isRecording && recordingURL != nil {
                Button(action: {
                    showingNamePrompt = true
                }) {
                    Text("Save Recording")
                        .font(.headline)
                        .foregroundColor(.white)
                        .padding()
                        .background(Color.purple)
                        .cornerRadius(10)
                }
            }
        }
        .navigationTitle("Record Audio")
        .alert("Name Your Recording", isPresented: $showingNamePrompt) {
            TextField("Recording Name", text: $recordingName)
            Button("Cancel", role: .cancel) { }
            Button("Save") {
                saveRecording()
            }
        } message: {
            Text("Enter a name for your recording")
        }
    }
    
    private func startRecording() {
        recordingURL = audioEngine.startRecording(fileName: UUID().uuidString)
    }
    
    private func stopRecording() {
        audioEngine.stopRecording()
        showingNamePrompt = true
    }
    
    private func saveRecording() {
        guard let url = recordingURL,
              let playlist = selectedPlaylist,
              !recordingName.isEmpty else { return }
        
        let track = CoreDataManager.shared.addTrack(
            name: recordingName,
            audioUrl: url.absoluteString,
            to: playlist
        )
        
        recordingURL = nil
        recordingName = ""
    }
}

struct WaveformView: View {
    let audioLevel: Float
    
    var body: some View {
        GeometryReader { geometry in
            Path { path in
                let width = geometry.size.width
                let height = geometry.size.height
                let midHeight = height / 2
                
                for x in stride(from: 0, to: width, by: 3) {
                    let normalizedX = x / width
                    let amplitude = CGFloat(audioLevel) * midHeight
                    let y = midHeight + sin(normalizedX * .pi * 4) * amplitude
                    
                    if x == 0 {
                        path.move(to: CGPoint(x: x, y: y))
                    } else {
                        path.addLine(to: CGPoint(x: x, y: y))
                    }
                }
            }
            .stroke(Color.purple, lineWidth: 2)
        }
    }
}
