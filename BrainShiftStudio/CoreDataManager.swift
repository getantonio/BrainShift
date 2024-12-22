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
    
    func updatePlaylist(_ playlist: Playlist, newName: String) throws {
        // Create a background context for the update
        let backgroundContext = persistentContainer.newBackgroundContext()
        backgroundContext.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy
        
        return try backgroundContext.performAndWait {
            // Fetch the playlist in the background context
            guard let playlistID = playlist.id,
                  let playlistInContext = try? backgroundContext.existingObject(with: playlist.objectID) as? Playlist else {
                throw NSError(domain: "CoreDataManager",
                            code: -1,
                            userInfo: [NSLocalizedDescriptionKey: "Could not locate playlist"])
            }
            
            // Update the playlist in the background context
            playlistInContext.name = newName
            
            // Save the background context
            do {
                try backgroundContext.save()
                
                // Refresh the view context
                viewContext.performAndWait {
                    viewContext.refreshAllObjects()
                }
                
                // Verify the update
                guard let verifiedPlaylist = try? fetchPlaylist(byID: playlistID),
                      verifiedPlaylist.name == newName else {
                    throw NSError(domain: "CoreDataManager",
                                code: -2,
                                userInfo: [NSLocalizedDescriptionKey: "Failed to verify playlist update"])
                }
                
                print("Playlist successfully updated to: \(newName)")
                
            } catch {
                backgroundContext.rollback()
                print("Failed to update playlist: \(error.localizedDescription)")
                throw error
            }
        }
    }
    
    // Helper method to fetch playlist by ID
    private func fetchPlaylist(byID id: UUID?) -> Playlist? {
        guard let id = id else { return nil }
        
        let fetchRequest: NSFetchRequest<Playlist> = Playlist.fetchRequest()
        fetchRequest.predicate = NSPredicate(format: "id == %@", id as CVarArg)
        fetchRequest.fetchLimit = 1
        
        return try? viewContext.fetch(fetchRequest).first
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