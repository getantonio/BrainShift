import CoreData
import SwiftUI

class CoreDataManager {
    static let shared = CoreDataManager()
    
    private init() {}
    
    lazy var persistentContainer: NSPersistentContainer = {
        let container = NSPersistentContainer(name: "DataModel")
        container.loadPersistentStores { description, error in
            if let error = error {
                fatalError("Unable to load persistent stores: \(error)")
            }
        }
        container.viewContext.automaticallyMergesChangesFromParent = true
        container.viewContext.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy
        return container
    }()
    
    var viewContext: NSManagedObjectContext {
        persistentContainer.viewContext
    }
    
    func saveContext() {
        let context = persistentContainer.viewContext
        if context.hasChanges {
            do {
                try context.save()
            } catch {
                let error = error as NSError
                fatalError("Unresolved error \(error), \(error.userInfo)")
            }
        }
    }
    
    // MARK: - Playlist Operations
    
    func createPlaylist(name: String) -> Playlist {
        let playlist = Playlist(context: viewContext)
        playlist.id = UUID()
        playlist.name = name
        playlist.createdAt = Date()
        playlist.order = getNextPlaylistOrder()
        saveContext()
        return playlist
    }
    
    func getNextPlaylistOrder() -> Int32 {
        let fetchRequest: NSFetchRequest<Playlist> = Playlist.fetchRequest()
        fetchRequest.sortDescriptors = [NSSortDescriptor(keyPath: \Playlist.order, ascending: false)]
        fetchRequest.fetchLimit = 1
        
        if let lastPlaylist = try? viewContext.fetch(fetchRequest).first {
            return lastPlaylist.order + 1
        }
        return 0
    }
    
    func updatePlaylist(_ playlist: Playlist, newName: String) {
        playlist.name = newName
        saveContext()
    }
    
    func deletePlaylist(_ playlist: Playlist) {
        viewContext.delete(playlist)
        saveContext()
    }
    
    // MARK: - Track Operations
    
    func addTrack(name: String, audioUrl: String, to playlist: Playlist) -> AudioTrack {
        let track = AudioTrack(context: viewContext)
        track.id = UUID()
        track.name = name
        track.audioUrl = audioUrl
        track.createdAt = Date()
        track.playlist = playlist
        saveContext()
        return track
    }
    
    func updateTrack(_ track: AudioTrack, newName: String) {
        track.name = newName
        saveContext()
    }
    
    func moveTrack(_ track: AudioTrack, to playlist: Playlist) {
        track.playlist = playlist
        saveContext()
    }
    
    func deleteTrack(_ track: AudioTrack) {
        // Delete the audio file
        if let audioUrl = track.audioUrl,
           let url = URL(string: audioUrl) {
            try? FileManager.default.removeItem(at: url)
        }
        
        viewContext.delete(track)
        saveContext()
    }
}
