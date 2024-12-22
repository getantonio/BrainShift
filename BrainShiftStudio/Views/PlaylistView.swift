import SwiftUI
import CoreData

struct PlaylistView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @FetchRequest(
        sortDescriptors: [NSSortDescriptor(keyPath: \Playlist.order, ascending: true)],
        animation: .default)
    private var playlists: FetchedResults<Playlist>
    
    @State private var showingNewPlaylistSheet = false
    @State private var newPlaylistName = ""
    @State private var selectedPlaylist: Playlist?
    @State private var showingRenameAlert = false
    @State private var renameText = ""
    
    var body: some View {
        List {
            ForEach(playlists) { playlist in
                PlaylistRow(playlist: playlist)
                    .contextMenu {
                        Button(action: {
                            selectedPlaylist = playlist
                            renameText = playlist.name ?? ""
                            showingRenameAlert = true
                        }) {
                            Label("Rename", systemImage: "pencil")
                        }
                        
                        Button(role: .destructive, action: {
                            deletePlaylist(playlist)
                        }) {
                            Label("Delete", systemImage: "trash")
                        }
                    }
            }
            .onDelete(perform: deletePlaylists)
        }
        .navigationTitle("Playlists")
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: { showingNewPlaylistSheet = true }) {
                    Label("Add Playlist", systemImage: "plus")
                }
            }
        }
        .sheet(isPresented: $showingNewPlaylistSheet) {
            NavigationView {
                Form {
                    Section {
                        TextField("Playlist Name", text: $newPlaylistName)
                    }
                }
                .navigationTitle("New Playlist")
                .navigationBarItems(
                    leading: Button("Cancel") {
                        showingNewPlaylistSheet = false
                        newPlaylistName = ""
                    },
                    trailing: Button("Create") {
                        createNewPlaylist()
                        showingNewPlaylistSheet = false
                        newPlaylistName = ""
                    }
                    .disabled(newPlaylistName.isEmpty)
                )
            }
        }
        .alert("Rename Playlist", isPresented: $showingRenameAlert) {
            TextField("Name", text: $renameText)
            Button("Cancel", role: .cancel) { }
            Button("Save") {
                if let playlist = selectedPlaylist {
                    renamePlaylist(playlist, to: renameText)
                }
            }
        }
    }
    
    private func createNewPlaylist() {
        guard !newPlaylistName.isEmpty else { return }
        _ = CoreDataManager.shared.createPlaylist(name: newPlaylistName)
    }
    
    private func deletePlaylist(_ playlist: Playlist) {
        CoreDataManager.shared.deletePlaylist(playlist)
    }
    
    private func deletePlaylists(at offsets: IndexSet) {
        for index in offsets {
            let playlist = playlists[index]
            CoreDataManager.shared.deletePlaylist(playlist)
        }
    }
    
    private func renamePlaylist(_ playlist: Playlist, to newName: String) {
        guard !newName.isEmpty else { return }
        
        do {
            // Try to update the playlist
            try CoreDataManager.shared.updatePlaylist(playlist, newName: newName)
            
            // Refresh the view context to ensure UI updates
            viewContext.refresh(playlist, mergeChanges: true)
            
            // Show success message
            let successMessage = "Playlist renamed successfully"
            #if os(iOS)
            let generator = UINotificationFeedbackGenerator()
            generator.notificationOccurred(.success)
            #endif
        } catch {
            // Show error message
            print("Failed to rename playlist: \(error.localizedDescription)")
            #if os(iOS)
            let generator = UINotificationFeedbackGenerator()
            generator.notificationOccurred(.error)
            #endif
            
            // Reset the name in UI
            DispatchQueue.main.async {
                self.renameText = playlist.name ?? ""
            }
        }
    }
}

struct PlaylistRow: View {
    @ObservedObject var playlist: Playlist
    @StateObject private var audioEngine = AudioEngine.shared
    
    var body: some View {
        NavigationLink(destination: PlaylistDetailView(playlist: playlist)) {
            VStack(alignment: .leading) {
                Text(playlist.name ?? "Untitled Playlist")
                    .font(.headline)
                Text("\(playlist.tracks?.count ?? 0) tracks")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
        }
    }
}

struct PlaylistDetailView: View {
    @ObservedObject var playlist: Playlist
    @StateObject private var audioEngine = AudioEngine.shared
    
    var sortedTracks: [AudioTrack] {
        let tracks = playlist.tracks?.allObjects as? [AudioTrack] ?? []
        return tracks.sorted { ($0.createdAt ?? Date()) < ($1.createdAt ?? Date()) }
    }
    
    var body: some View {
        List {
            ForEach(sortedTracks) { track in
                AudioTrackRow(track: track)
            }
            .onDelete(perform: deleteTracks)
        }
        .navigationTitle(playlist.name ?? "")
    }
    
    private func deleteTracks(at offsets: IndexSet) {
        let tracks = sortedTracks
        for index in offsets {
            if let track = tracks[safe: index] {
                CoreDataManager.shared.deleteTrack(track)
            }
        }
    }
}

struct AudioTrackRow: View {
    @ObservedObject var track: AudioTrack
    @StateObject private var audioEngine = AudioEngine.shared
    @State private var isPlaying = false
    
    var body: some View {
        HStack {
            Button(action: {
                if isPlaying {
                    audioEngine.stopPlayback()
                    isPlaying = false
                } else {
                    if let url = URL(string: track.audioUrl ?? "") {
                        audioEngine.playAudio(url: url)
                        isPlaying = true
                    }
                }
            }) {
                Image(systemName: isPlaying ? "stop.fill" : "play.fill")
                    .foregroundColor(isPlaying ? .red : .accentColor)
            }
            .buttonStyle(BorderlessButtonStyle())
            
            VStack(alignment: .leading) {
                Text(track.name ?? "Untitled")
                    .font(.headline)
                if let date = track.createdAt {
                    Text(date, style: .date)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .onDisappear {
            if isPlaying {
                audioEngine.stopPlayback()
                isPlaying = false
            }
        }
    }
}

extension Collection {
    /// Returns the element at the specified index if it is within bounds, otherwise nil.
    subscript(safe index: Index) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}