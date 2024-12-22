import SwiftUI

struct ContentView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @FetchRequest(
        sortDescriptors: [NSSortDescriptor(keyPath: \Playlist.order, ascending: true)],
        animation: .default)
    private var playlists: FetchedResults<Playlist>
    
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationView {
                PlaylistView()
            }
            .tabItem {
                Image(systemName: "music.note.list")
                Text("Playlists")
            }
            .tag(0)
            
            NavigationView {
                RecordingView()
            }
            .tabItem {
                Image(systemName: "mic")
                Text("Record")
            }
            .tag(1)
            
            NavigationView {
                SettingsView()
            }
            .tabItem {
                Image(systemName: "gear")
                Text("Settings")
            }
            .tag(2)
        }
        .accentColor(.purple)
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
            .environment(\.managedObjectContext, CoreDataManager.shared.viewContext)
    }
}
