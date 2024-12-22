import SwiftUI

struct WaveformView: View {
    let audioLevel: Float
    let color: Color
    
    var body: some View {
        TimelineView(.animation) { timeline in
            Canvas { context, size in
                let width = size.width
                let height = size.height
                let midHeight = height / 2
                let points = 100
                let spacing = width / CGFloat(points)
                
                for i in 0..<points {
                    let x = CGFloat(i) * spacing
                    let progress = CGFloat(i) / CGFloat(points)
                    let frequency = 4.0
                    let amplitude = CGFloat(audioLevel) * midHeight * 0.8
                    let damping = cos(.pi * progress) * 0.5 + 0.5
                    let y = midHeight + sin(progress * .pi * frequency) * amplitude * damping
                    
                    let path = Path { p in
                        p.move(to: CGPoint(x: x, y: midHeight - amplitude * damping))
                        p.addLine(to: CGPoint(x: x, y: midHeight + amplitude * damping))
                    }
                    
                    context.stroke(
                        path,
                        with: .color(color.opacity(0.8)),
                        lineWidth: 2
                    )
                }
            }
        }
    }
}

struct PlaybackWaveformView: View {
    @StateObject private var audioEngine = AudioEngine.shared
    let color: Color
    
    var body: some View {
        WaveformView(audioLevel: audioEngine.audioLevel, color: color)
            .frame(height: 60)
            .overlay(
                Rectangle()
                    .fill(
                        LinearGradient(
                            colors: [color.opacity(0.2), color.opacity(0)],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
            )
    }
}

struct RecordingWaveformView: View {
    @StateObject private var audioEngine = AudioEngine.shared
    
    var body: some View {
        WaveformView(audioLevel: audioEngine.audioLevel, color: .purple)
            .frame(height: 100)
            .overlay(
                Rectangle()
                    .fill(
                        LinearGradient(
                            colors: [.purple.opacity(0.3), .clear],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
            )
            .animation(.easeInOut(duration: 0.1), value: audioEngine.audioLevel)
    }
}

#Preview {
    VStack {
        RecordingWaveformView()
        PlaybackWaveformView(color: .blue)
    }
    .padding()
    .background(Color.black)
}
