import 'package:flutter/material.dart';
import '../models/jam_session.dart';

class SongSelectorWidget extends StatefulWidget {
  final List<JamSong> songs;
  final int currentSongIndex;
  final Function(int) onSongSelected;
  final String buttonText;
  final Function(int, int)? onPlayNext;
  final Function(int)? onAddToQueue;

  const SongSelectorWidget({
    super.key,
    required this.songs,
    required this.currentSongIndex,
    required this.onSongSelected,
    this.buttonText = 'Select Song',
    this.onPlayNext,
    this.onAddToQueue,
  });

  @override
  State<SongSelectorWidget> createState() => _SongSelectorWidgetState();
}

class _SongSelectorWidgetState extends State<SongSelectorWidget> {
  String _searchQuery = '';
  List<int> _filteredIndices = [];
  final TextEditingController _searchController = TextEditingController();
  int? _hoveredIndex;

  @override
  void initState() {
    super.initState();
    _filterSongs();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _filterSongs() {
    if (_searchQuery.isEmpty) {
      _filteredIndices = List.generate(widget.songs.length, (index) => index);
    } else {
      _filteredIndices = [];
      for (int i = 0; i < widget.songs.length; i++) {
        final song = widget.songs[i].song;
        if (song.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
            song.artist.toLowerCase().contains(_searchQuery.toLowerCase()) ||
            (song.album?.toLowerCase().contains(_searchQuery.toLowerCase()) ?? false)) {
          _filteredIndices.add(i);
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => _showSongPicker(context),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: const Color(0xFFC79CC6),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: const Color(0xFFC79CC6),
            width: 1,
          ),
        ),
        child: Row(
          children: [
            const Icon(
              Icons.keyboard_arrow_down_rounded,
              color: Colors.white,
              size: 18,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                widget.buttonText,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showSongPicker(BuildContext context) {
    // Reset search when opening
    _searchQuery = '';
    _searchController.clear();
    _filterSongs();
    
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (BuildContext context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Container(
              height: MediaQuery.of(context).size.height * 0.8,
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(20),
                  topRight: Radius.circular(20),
                ),
              ),
              child: Column(
                children: [
                  // Handle bar
                  Container(
                    width: 40,
                    height: 4,
                    margin: const EdgeInsets.symmetric(vertical: 12),
                    decoration: BoxDecoration(
                      color: Colors.grey[300],
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  
                  // Title and close button
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.library_music,
                          color: Color(0xFF4A5568),
                          size: 20,
                        ),
                        const SizedBox(width: 8),
                        const Text(
                          'Up Next',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF4A5568),
                          ),
                        ),
                        const Spacer(),
                        IconButton(
                          onPressed: () => Navigator.pop(context),
                          icon: const Icon(
                            Icons.close,
                            color: Color(0xFF4A5568),
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  // Search bar
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.grey[100],
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: Colors.grey[300]!,
                          width: 1,
                        ),
                      ),
                      child: TextField(
                        controller: _searchController,
                        decoration: InputDecoration(
                          hintText: 'Search all songs...',
                          hintStyle: TextStyle(
                            color: Colors.grey[600],
                            fontSize: 14,
                          ),
                          prefixIcon: Icon(
                            Icons.search,
                            color: Colors.grey[600],
                            size: 18,
                          ),
                          suffixIcon: _searchQuery.isNotEmpty
                              ? IconButton(
                                  icon: Icon(
                                    Icons.clear,
                                    color: Colors.grey[600],
                                    size: 16,
                                  ),
                                  onPressed: () {
                                    setModalState(() {
                                      _searchQuery = '';
                                      _searchController.clear();
                                      _filterSongs();
                                    });
                                  },
                                )
                              : null,
                          border: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 4, vertical: 12),
                        ),
                        onChanged: (value) {
                          setModalState(() {
                            _searchQuery = value;
                            _filterSongs();
                          });
                        },
                      ),
                    ),
                  ),
                  
                  const Divider(height: 1),
                  
                  // Songs list
                  Expanded(
                    child: _filteredIndices.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.search_off,
                                  size: 48,
                                  color: Colors.grey[400],
                                ),
                                const SizedBox(height: 16),
                                Text(
                                  'No songs found',
                                  style: TextStyle(
                                    fontSize: 16,
                                    color: Colors.grey[600],
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'Try adjusting your search terms',
                                  style: TextStyle(
                                    fontSize: 14,
                                    color: Colors.grey[500],
                                  ),
                                ),
                              ],
                            ),
                          )
                        : ListView.builder(
                            itemCount: _filteredIndices.length,
                            itemBuilder: (context, index) {
                              final songIndex = _filteredIndices[index];
                              final jamSong = widget.songs[songIndex];
                              final song = jamSong.song;
                              final isSelected = songIndex == widget.currentSongIndex;
                              
                              final isHovered = _hoveredIndex == index;
                              
                              return MouseRegion(
                                onEnter: (_) {
                                  setModalState(() {
                                    _hoveredIndex = index;
                                  });
                                },
                                onExit: (_) {
                                  setModalState(() {
                                    _hoveredIndex = null;
                                  });
                                },
                                child: Container(
                                  decoration: BoxDecoration(
                                    color: isHovered && !isSelected 
                                        ? Colors.grey[200] 
                                        : Colors.transparent,
                                    borderRadius: BorderRadius.circular(8),
                                    boxShadow: isHovered && !isSelected
                                        ? [
                                            BoxShadow(
                                              color: Colors.black.withOpacity(0.05),
                                              blurRadius: 4,
                                              offset: const Offset(0, 2),
                                            ),
                                          ]
                                        : null,
                                  ),
                                  margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                  child: ListTile(
                                    leading: Container(
                                      width: 40,
                                      height: 40,
                                      decoration: BoxDecoration(
                                        color: isSelected 
                                            ? const Color(0xFF4A5568) 
                                            : isHovered
                                                ? Colors.grey[300]
                                                : Colors.grey[200],
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Icon(
                                        Icons.music_note,
                                        color: isSelected 
                                            ? Colors.white 
                                            : isHovered
                                                ? Colors.grey[700]
                                                : Colors.grey[600],
                                        size: 20,
                                      ),
                                    ),
                                    title: Text(
                                      song.title,
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: isSelected ? FontWeight.w600 : (isHovered ? FontWeight.w500 : FontWeight.w400),
                                        color: isSelected 
                                            ? const Color(0xFF4A5568) 
                                            : isHovered
                                                ? Colors.black
                                                : Colors.black87,
                                      ),
                                    ),
                                    subtitle: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          song.artist,
                                          style: TextStyle(
                                            fontSize: 14,
                                            color: isHovered 
                                                ? Colors.grey[700] 
                                                : Colors.grey[600],
                                          ),
                                        ),
                                        if (song.album?.isNotEmpty == true) ...[
                                          const SizedBox(height: 2),
                                          Text(
                                            song.album!,
                                            style: TextStyle(
                                              fontSize: 12,
                                              color: isHovered 
                                                  ? Colors.grey[600] 
                                                  : Colors.grey[500],
                                              fontStyle: FontStyle.italic,
                                            ),
                                          ),
                                        ],
                                      ],
                                    ),
                                    trailing: PopupMenuButton<String>(
                                      padding: EdgeInsets.zero,
                                      icon: Icon(
                                        Icons.more_vert,
                                        size: 18,
                                        color: const Color(0xFF606060),
                                      ),
                                      itemBuilder: (context) => [
                                        PopupMenuItem(
                                          value: 'play_next',
                                          child: Row(
                                            children: const [
                                              Icon(Icons.playlist_play, size: 20),
                                              SizedBox(width: 12),
                                              Text('Play next'),
                                            ],
                                          ),
                                        ),
                                        PopupMenuItem(
                                          value: 'add_queue',
                                          child: Row(
                                            children: const [
                                              Icon(Icons.queue_music, size: 20),
                                              SizedBox(width: 12),
                                              Text('Add to queue'),
                                            ],
                                          ),
                                        ),
                                      ],
                                      onSelected: (value) {
                                        if (value == 'play_next') {
                                          widget.onPlayNext?.call(songIndex, widget.currentSongIndex);
                                        } else if (value == 'add_queue') {
                                          widget.onAddToQueue?.call(songIndex);
                                        }
                                      },
                                    ),
                                    onTap: () {
                                      widget.onSongSelected(songIndex);
                                      Navigator.pop(context);
                                    },
                                  ),
                                ),
                              );
                            },
                          ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }
}
