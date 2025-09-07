import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../services/jam_service.dart';
import '../models/jam_session.dart';
import '../widgets/slides_widget.dart';
import '../widgets/section_sidebar.dart';
import '../core/oslyn_engine.dart';

class SongCardPage extends StatefulWidget {
  final String jamSessionId;
  final String? initialDescription;

  const SongCardPage({
    super.key,
    required this.jamSessionId,
    this.initialDescription,
  });

  @override
  State<SongCardPage> createState() => _SongCardPageState();
}

class _SongCardPageState extends State<SongCardPage> {
  JamSession? jamSession;
  List<Song>? songs;
  bool isLoading = true;
  String? errorMessage;
  late JamService _jamService;
  int _currentPage = 0;
  String _textSize = 'text-lg';
  bool _isLastPage = false;
  int _currentSongIndex = 0;
  bool _showDebug = false;
  String _searchQuery = '';
  List<int> _filteredSongIndices = [];
  bool _showSongPicker = false;
  final FocusNode _focusNode = FocusNode();
  bool _showSidebar = true;
  SidebarPosition _sidebarPosition = SidebarPosition.right;

  @override
  void initState() {
    super.initState();
    _jamService = JamService();
    _loadJamSession();
  }

  @override
  void dispose() {
    _focusNode.dispose();
    super.dispose();
  }

  Future<void> _loadJamSession() async {
    try {
      setState(() {
        isLoading = true;
        errorMessage = null;
      });

      print('🔍 Loading jam session with ID: ${widget.jamSessionId}');
      final session = await _jamService.getJamSession(widget.jamSessionId);

      setState(() {
        jamSession = session;
        isLoading = false;
      });

      if (session != null) {
        print('✅ Jam session loaded successfully!');
        print('📝 Description: ${session.description}');
        print('👥 Admins: ${session.admins.length}');
        print('👥 Members: ${session.members.length}');
        print('👥 Guests: ${session.guests.length}');
        print('🎵 Set List: ${session.setList != null ? "Found" : "Not Found"}');
        
        if (session.setList != null) {
          print('📋 Set List ID: ${session.setList!.setListId}');
          print('📋 Set List Description: ${session.setList!.description}');
          print('🎼 Songs in Set: ${session.setList!.songs?.length ?? 0}');
          
          if (session.setList!.songs != null && session.setList!.songs!.isNotEmpty) {
            print('🎵 First song details:');
            final firstSong = session.setList!.songs!.first;
            print('   - Key: ${firstSong.key}');
            print('   - Song ID: ${firstSong.song.songId}');
            print('   - Title: ${firstSong.song.title}');
            print('   - Artist: ${firstSong.song.artist}');
            print('   - Chord Sheet Length: ${firstSong.song.chordSheet.length}');
            print('   - Chord Sheet Key: ${firstSong.song.chordSheetKey}');
            
            songs = session.setList!.songs!.map((jamSong) => jamSong.song).toList();
            print('✅ Loaded ${songs!.length} songs from set list');
            _filterSongs();
          } else {
            print('⚠️ Set list exists but has no songs');
          }
        } else {
          print('⚠️ No set list found in jam session');
        }
        
        if (session.setList?.songs?.isNotEmpty == true) {
          print('🎵 SetList has ${session.setList!.songs!.length} songs');
          songs = session.setList!.songs!.map((jamSong) => jamSong.song).toList();
          
          if (songs!.isNotEmpty) {
            final firstSong = songs!.first;
            _logSongDebugInfo(firstSong, 'First song from jam session');
          }
        } else if (session.setList?.songs?.isEmpty == true && session.admins.isNotEmpty) {
          print('🔄 Set list is empty, trying to load songs from admin...');
          final adminUserId = session.admins.first.userId;
          if (adminUserId != null) {
            await _loadSongsFromAdmin(adminUserId);
          }
        } else if (session.admins.isNotEmpty) {
          print('🔄 No set list, trying to fetch songs from admin...');
          final adminUserId = session.admins.first.userId;
          if (adminUserId != null) {
            await _loadSongsFromAdmin(adminUserId);
          }
        }
      } else {
        print('❌ Jam session failed to load, trying fallback...');
        await _loadSongsFromAdmin('9e7724c6-fbda-4a0c-874d-3841ae0848c1_usr');
      }
    } catch (e) {
      print('❌ Error loading jam session: $e');
      setState(() {
        errorMessage = 'Failed to load jam session: $e';
        isLoading = false;
      });
      
      print('🔄 Trying to fetch songs directly as fallback...');
      try {
        await _loadSongsFromAdmin('9e7724c6-fbda-4a0c-874d-3841ae0848c1_usr');
      } catch (songError) {
        print('❌ Failed to fetch songs directly: $songError');
      }
    }
  }

  Future<void> _loadSongsFromAdmin(String adminUserId) async {
    try {
      print('Trying to fetch songs from admin: $adminUserId');
      final adminSongs = await _jamService.getSongs(adminUserId, limit: 10);
      
      if (mounted) {
        setState(() {
          songs = adminSongs;
          _filterSongs();
        });
      }
      
      if (adminSongs.isNotEmpty) {
        print('Found ${adminSongs.length} songs from admin');
        print('First song: ${adminSongs.first.title} - ${adminSongs.first.artist}');
        print('Chord sheet preview: ${adminSongs.first.chordSheet.substring(0, 100)}...');
        
        _logSongDebugInfo(adminSongs.first, 'First song from admin');
      }
    } catch (e) {
      print('Error loading songs from admin: $e');
    }
  }

  void _filterSongs() {
    if (jamSession?.setList?.songs == null) {
      _filteredSongIndices = [];
      return;
    }
    
    if (_searchQuery.isEmpty) {
      _filteredSongIndices = List.generate(jamSession!.setList!.songs!.length, (index) => index);
      } else {
      _filteredSongIndices = [];
      for (int i = 0; i < jamSession!.setList!.songs!.length; i++) {
        final song = jamSession!.setList!.songs![i].song;
        if (song.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
            song.artist.toLowerCase().contains(_searchQuery.toLowerCase()) ||
            (song.album?.toLowerCase().contains(_searchQuery.toLowerCase()) ?? false)) {
          _filteredSongIndices.add(i);
        }
      }
    }
  }

  void _logSongDebugInfo(Song song, String source) {
    print('🔍 $source - Song: ${song.title} - Artist: ${song.artist}');
    print('   - Chord Sheet Length: ${song.chordSheet.length}');
    print('   - Chord Sheet Key: ${song.chordSheetKey}');
    print('   - Raw Chord Sheet (First 500 chars):');
    print('     ${song.chordSheet.substring(0, song.chordSheet.length > 500 ? 500 : song.chordSheet.length)}...');
  }

  int? _getTotalPages() {
    if (jamSession?.setList?.songs?.isNotEmpty == true) {
      final selectedSong = jamSession!.setList!.songs![_currentSongIndex];
      final chordSheet = selectedSong.song.chordSheet;
      final chordSheetKey = selectedSong.song.chordSheetKey;
      if (chordSheet.isNotEmpty) {
        try {
          final oslynSlides = OslynEngine.chordSheetToSlides(chordSheet, chordSheetKey);
          return oslynSlides.pages.length;
        } catch (e) {
          print('Error getting total pages: $e');
        }
      }
    } else if (songs?.isNotEmpty == true) {
      final selectedSong = songs![_currentSongIndex];
      final chordSheet = selectedSong.chordSheet;
      final chordSheetKey = selectedSong.chordSheetKey;
      if (chordSheet.isNotEmpty) {
        try {
          final oslynSlides = OslynEngine.chordSheetToSlides(chordSheet, chordSheetKey);
          return oslynSlides.pages.length;
        } catch (e) {
          print('Error getting total pages: $e');
        }
      }
    }
    return null;
  }

  void _previousPage() {
    if (_currentPage > 0) {
      setState(() {
        _currentPage--;
        // Update last page status
        _isLastPage = false; // We're going back, so we're definitely not on the last page
      });
      // Ensure focus is maintained after state update
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _focusNode.requestFocus();
      });
    }
  }

  void _nextPage() {
    // Use cached total pages to avoid recalculation
    final totalPages = _getTotalPages();
    
    // Only advance if we're not at the last page
    if (totalPages != null && _currentPage < totalPages - 1) {
      setState(() {
        _currentPage++;
        _isLastPage = _currentPage >= totalPages - 1;
      });
      // Ensure focus is maintained after state update
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _focusNode.requestFocus();
      });
    }
  }

  void _onSectionSelected(int pageIndex) {
    setState(() {
      _currentPage = pageIndex;
      // Update last page status
      final totalPages = _getTotalPages();
      _isLastPage = totalPages != null && _currentPage >= totalPages - 1;
    });
    // Ensure focus is maintained after state update
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _focusNode.requestFocus();
    });
  }

  KeyEventResult _handleSectionShortcut(KeyDownEvent event) {
    // Get current song data for section lookup
    String? chordSheet;
    String? chordSheetKey;
    
    if (jamSession?.setList?.songs?.isNotEmpty == true) {
      final selectedSong = jamSession!.setList!.songs![_currentSongIndex];
      chordSheet = selectedSong.song.chordSheet;
      chordSheetKey = selectedSong.song.chordSheetKey;
    } else if (songs?.isNotEmpty == true) {
      final selectedSong = songs![_currentSongIndex];
      chordSheet = selectedSong.chordSheet;
      chordSheetKey = selectedSong.chordSheetKey;
    }

    if (chordSheet == null || chordSheetKey == null) {
      return KeyEventResult.ignored;
    }

    try {
      final oslynSlides = OslynEngine.chordSheetToSlides(chordSheet, chordSheetKey);
      final sections = <String, List<int>>{};
      
      // Build section map
      for (int pageIndex = 0; pageIndex < oslynSlides.pages.length; pageIndex++) {
        final page = oslynSlides.pages[pageIndex];
        if (page.lines.isNotEmpty) {
          final sectionName = page.lines.first.section;
          sections.putIfAbsent(sectionName, () => []).add(pageIndex);
        }
      }

      // Handle number keys (1-9) for verses
      final keyLabel = event.logicalKey.keyLabel;
        
      // Check for number keys (1-9)
      if (keyLabel.length == 1 && keyLabel.codeUnitAt(0) >= 49 && keyLabel.codeUnitAt(0) <= 57) {
        final verseNumber = int.parse(keyLabel);
        final verseKey = 'Verse $verseNumber';
        final versePages = sections[verseKey];
        
        if (versePages != null && versePages.isNotEmpty) {
          _onSectionSelected(versePages.first);
          return KeyEventResult.handled;
        }
      }
      
      // Check for letter keys
      switch (keyLabel.toLowerCase()) {
        case 'c':
          // Find first chorus
          final chorusPages = sections['Chorus'];
          if (chorusPages != null && chorusPages.isNotEmpty) {
            _onSectionSelected(chorusPages.first);
            return KeyEventResult.handled;
          }
          break;
        case 'b':
          // Find first bridge
          final bridgePages = sections['Bridge'];
          if (bridgePages != null && bridgePages.isNotEmpty) {
            _onSectionSelected(bridgePages.first);
            return KeyEventResult.handled;
          }
          break;
        case 'i':
          // Find intro
          final introPages = sections['Intro'];
          if (introPages != null && introPages.isNotEmpty) {
            _onSectionSelected(introPages.first);
            return KeyEventResult.handled;
          }
          break;
        case 'o':
          // Find outro
          final outroPages = sections['Outro'];
          if (outroPages != null && outroPages.isNotEmpty) {
            _onSectionSelected(outroPages.first);
            return KeyEventResult.handled;
          }
          break;
        case 'p':
          // Find pre-chorus
          final preChorusPages = sections['Pre-Chorus'];
          if (preChorusPages != null && preChorusPages.isNotEmpty) {
            _onSectionSelected(preChorusPages.first);
            return KeyEventResult.handled;
          }
          break;
      }
    } catch (e) {
      print('Error handling section shortcut: $e');
    }

    return KeyEventResult.ignored;
  }

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Color(0xFFE0B9BE),
            Color(0xFFC7A2DB),
            Color(0xFFBD9DFA),
          ],
          stops: [0.0, 0.55, 1.0],
        ),
      ),
      child: Focus(
        focusNode: _focusNode,
        autofocus: true,
        canRequestFocus: true,
        onKeyEvent: (node, event) {
          if (event is KeyDownEvent) {
            if (event.logicalKey == LogicalKeyboardKey.arrowLeft) {
              _previousPage();
              return KeyEventResult.handled;
            } else if (event.logicalKey == LogicalKeyboardKey.arrowRight) {
              _nextPage();
              return KeyEventResult.handled;
            } else {
              // Handle section shortcuts
              final result = _handleSectionShortcut(event);
              if (result == KeyEventResult.handled) {
                return result;
              }
            }
          }
          return KeyEventResult.ignored;
        },
        child: Scaffold(
          backgroundColor: Colors.transparent,
      appBar: AppBar(
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        title: Text(jamSession?.description ?? 'Jam Session'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadJamSession,
          ),
          IconButton(
            icon: Icon(_showSidebar ? Icons.view_list : Icons.view_list_outlined),
            onPressed: () {
              setState(() {
                _showSidebar = !_showSidebar;
              });
            },
            tooltip: 'Toggle Section Sidebar',
          ),
          PopupMenuButton<SidebarPosition>(
            onSelected: (position) {
              setState(() {
                _sidebarPosition = position;
              });
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: SidebarPosition.left,
                child: Row(
                  children: [
                    Icon(Icons.arrow_back, size: 16),
                    SizedBox(width: 8),
                    Text('Left'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: SidebarPosition.right,
                child: Row(
                  children: [
                    Icon(Icons.arrow_forward, size: 16),
                    SizedBox(width: 8),
                    Text('Right'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: SidebarPosition.bottom,
                child: Row(
                  children: [
                    Icon(Icons.keyboard_arrow_down, size: 16),
                    SizedBox(width: 8),
                    Text('Bottom'),
                  ],
                ),
              ),
            ],
            child: const Icon(Icons.more_vert),
            tooltip: 'Sidebar Position',
          ),
          IconButton(
            icon: Icon(_showDebug ? Icons.bug_report : Icons.bug_report_outlined),
            onPressed: () {
              setState(() {
                _showDebug = !_showDebug;
              });
            },
            tooltip: 'Toggle Debug Panel',
          ),
          PopupMenuButton<String>(
            onSelected: (value) {
              setState(() {
                _textSize = value;
              });
            },
            itemBuilder: (context) => [
              const PopupMenuItem(value: 'text-xs', child: Text('Extra Small')),
              const PopupMenuItem(value: 'text-sm', child: Text('Small')),
              const PopupMenuItem(value: 'text-base', child: Text('Base')),
              const PopupMenuItem(value: 'text-lg', child: Text('Large')),
              const PopupMenuItem(value: 'text-xl', child: Text('Extra Large')),
              const PopupMenuItem(value: 'text-2xl', child: Text('2XL')),
              const PopupMenuItem(value: 'text-3xl', child: Text('3XL')),
              const PopupMenuItem(value: 'text-4xl', child: Text('4XL')),
              const PopupMenuItem(value: 'text-5xl', child: Text('5XL')),
            ],
            child: const Icon(Icons.text_fields),
          ),
        ],
      ),
      body: _buildBodyWithSidebar(),
        ),
      ),
    );
  }

  Widget _buildBody() {
    if (isLoading) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Loading jam session...'),
          ],
        ),
      );
    }

    if (errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: Theme.of(context).colorScheme.error,
            ),
            const SizedBox(height: 16),
            Text(
              errorMessage!,
              textAlign: TextAlign.center,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadJamSession,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (jamSession == null) {
      return const Center(
        child: Text('Jam session not found'),
      );
    }

    return _buildSongDisplay();
  }

  Widget _buildBodyWithSidebar() {
    final body = _buildBody();
    
    if (!_showSidebar) {
      return body;
    }

    // Get current song data for sidebar
    String? chordSheet;
    String? chordSheetKey;
    
    if (jamSession?.setList?.songs?.isNotEmpty == true) {
      final selectedSong = jamSession!.setList!.songs![_currentSongIndex];
      chordSheet = selectedSong.song.chordSheet;
      chordSheetKey = selectedSong.song.chordSheetKey;
    } else if (songs?.isNotEmpty == true) {
      final selectedSong = songs![_currentSongIndex];
      chordSheet = selectedSong.chordSheet;
      chordSheetKey = selectedSong.chordSheetKey;
    }

    if (chordSheet == null || chordSheetKey == null) {
      return body;
    }

    final sidebar = SectionSidebar(
      chordSheet: chordSheet,
      chordSheetKey: chordSheetKey,
      currentPage: _currentPage,
      onSectionSelected: _onSectionSelected,
      position: _sidebarPosition,
      isVisible: _showSidebar,
    );

    switch (_sidebarPosition) {
      case SidebarPosition.left:
        return Row(
          children: [
            sidebar,
            Expanded(child: body),
          ],
        );
      case SidebarPosition.right:
        return Row(
          children: [
            Expanded(child: body),
            sidebar,
          ],
        );
      case SidebarPosition.bottom:
        return Column(
          children: [
            Expanded(child: body),
            sidebar,
          ],
        );
    }
  }

  Widget _buildSongDisplay() {
    Song? songToDisplay;
    String? chordSheet;
    String? chordSheetKey;
    
    if (jamSession?.setList?.songs?.isNotEmpty == true) {
      final selectedSong = jamSession!.setList!.songs![_currentSongIndex];
      songToDisplay = selectedSong.song;
      chordSheet = songToDisplay.chordSheet;
      chordSheetKey = songToDisplay.chordSheetKey;
      print('Using song from jam session set list: ${songToDisplay.title} (index: $_currentSongIndex)');
    } else if (songs?.isNotEmpty == true) {
      final selectedSong = songs![_currentSongIndex];
      songToDisplay = selectedSong;
      chordSheet = songToDisplay.chordSheet;
      chordSheetKey = songToDisplay.chordSheetKey;
      print('Using song from admin songs: ${songToDisplay.title} (index: $_currentSongIndex)');
    }

    if (songToDisplay != null && chordSheet != null && chordSheetKey != null) {
      final realTitle = songToDisplay.title;
      final realArtist = songToDisplay.artist;
      final realAlbum = songToDisplay.album;
      final realAlbumCover = songToDisplay.albumCover;

      return GestureDetector(
        onTap: () {
          if (_showSongPicker) {
            setState(() {
              _showSongPicker = false;
              _searchQuery = '';
              _filterSongs();
            });
          } else {
            // Ensure focus is regained when tapping on the screen
            _focusNode.requestFocus();
          }
        },
        child: Column(
          children: [
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                children: [
                  Container(
                    width: 90,
                    height: 90,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Color(0xFFE0B9BE),
                          Color(0xFFC7A2DB),
                          Color(0xFFBD9DFA),
                        ],
                        stops: [0.0, 0.55, 1.0],
                      ),
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: Color(0xFF667eea).withValues(alpha: 0.3),
                          blurRadius: 15,
                          offset: const Offset(0, 5),
                        ),
                      ],
                    ),
                    child: realAlbumCover != null && realAlbumCover.isNotEmpty
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(16),
                            child: Image.network(
                              realAlbumCover,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) =>
                                  Icon(
                                Icons.music_note_rounded,
                                size: 45,
                                color: Colors.white.withValues(alpha: 0.8),
                              ),
                            ),
                          )
                        : Icon(
                            Icons.music_note_rounded,
                            size: 45,
                            color: Colors.white.withValues(alpha: 0.8),
                          ),
                  ),
                  
                  const SizedBox(width: 24),
                  
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          realTitle,
                          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 0.5,
                            shadows: [
                              Shadow(
                                offset: const Offset(0, 2),
                                blurRadius: 4,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          realArtist,
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: Colors.white.withValues(alpha: 0.9),
                            letterSpacing: 0.3,
                          ),
                        ),
                        if (realAlbum != null && realAlbum.isNotEmpty) ...[
                          const SizedBox(height: 6),
                          Text(
                            realAlbum,
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: Colors.white.withValues(alpha: 0.7),
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                        ],
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                Colors.white.withValues(alpha: 0.9),
                                Colors.white.withValues(alpha: 0.7),
                              ],
                            ),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: Colors.white.withValues(alpha: 0.6),
                              width: 1,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.1),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Text(
                            'Key: $chordSheetKey',
                            style: TextStyle(
                              color: Color(0xFF4A5568),
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  const SizedBox(width: 12),
                  
                  Stack(
                    children: [
                    Container(
                        width: 260,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Color(0xFFC8A2C8),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: Color(0xFFC8A2C8),
                          width: 1,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Color(0xFFa8edea).withValues(alpha: 0.2),
                            blurRadius: 15,
                            offset: const Offset(0, 5),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(
                                Icons.queue_music_rounded,
                                color: Colors.white,
                                size: 20,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'Next Song:',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 14,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                      if (jamSession?.setList?.songs != null && jamSession!.setList!.songs!.isNotEmpty)
                        Text(
                          _currentSongIndex < jamSession!.setList!.songs!.length - 1
                            ? jamSession!.setList!.songs![_currentSongIndex + 1].song.title
                            : 'No next song',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.9),
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                          overflow: TextOverflow.ellipsis,
                          maxLines: 1,
                        )
                      else
                        Text(
                          'No songs in set',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.7),
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                          const SizedBox(height: 8),
                          if (jamSession?.setList?.songs != null && jamSession!.setList!.songs!.isNotEmpty)
                              InkWell(
                                onTap: () {
                                  setState(() {
                                    _showSongPicker = true;
                                    _searchQuery = '';
                                    _filterSongs();
                                  });
                                },
                                borderRadius: BorderRadius.circular(12),
                                child: Container(
                              width: double.infinity,
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                              decoration: BoxDecoration(
                                color: Color(0xFFD4C5E8),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: Color(0xFFD4C5E8),
                                  width: 1,
                                ),
                              ),
                                  child: Row(
                                    children: [
                                      Icon(
                                        Icons.keyboard_arrow_down_rounded,
                                        color: Colors.white,
                                        size: 18,
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Text(
                                          'Select the next song',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            const SizedBox(height: 4),
                            Text(
                              '${jamSession?.setList?.songs?.length ?? 0} songs in set',
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.7),
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                      if (_showSongPicker && jamSession?.setList?.songs != null && jamSession!.setList!.songs!.isNotEmpty)
                        Positioned(
                          top: 0,
                          left: 0,
                          right: 0,
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(16),
                                    child: Container(
                                      decoration: BoxDecoration(
                                color: Color(0xFFC79CC6),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: Color(0xFFC79CC6),
                                  width: 1,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.3),
                                    blurRadius: 20,
                                    offset: const Offset(0, 10),
                                  ),
                                ],
                              ),
                              child: Column(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    child: TextField(
                                      style: TextStyle(
                                          color: Colors.white,
                                        fontSize: 12,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      decoration: InputDecoration(
                                        hintText: 'Search songs...',
                                        hintStyle: TextStyle(
                                          color: Colors.white.withValues(alpha: 0.7),
                                          fontSize: 12,
                                        ),
                                        prefixIcon: Icon(
                                          Icons.search,
                                          color: Colors.white.withValues(alpha: 0.7),
                                          size: 16,
                                        ),
                                        suffixIcon: _searchQuery.isNotEmpty
                                            ? IconButton(
                                                icon: Icon(
                                                  Icons.clear,
                                                  color: Colors.white.withValues(alpha: 0.7),
                                                  size: 16,
                                                ),
                                                onPressed: () {
                                    setState(() {
                                                    _searchQuery = '';
                                                    _filterSongs();
                                                  });
                                                },
                                              )
                                            : null,
                                        border: InputBorder.none,
                                        contentPadding: EdgeInsets.symmetric(horizontal: 4, vertical: 8),
                                      ),
                                      onChanged: (value) {
                                        setState(() {
                                          _searchQuery = value;
                                          _filterSongs();
                                        });
                                      },
                                    ),
                                  ),
                                  Container(
                                    height: 1,
                                    color: Colors.white.withValues(alpha: 0.3),
                                    margin: const EdgeInsets.symmetric(horizontal: 8),
                                  ),
                                  Container(
                                    constraints: BoxConstraints(maxHeight: 200),
                                    child: _filteredSongIndices.isEmpty
                                        ? Container(
                                            padding: const EdgeInsets.all(16),
                                            child: Text(
                                              _searchQuery.isEmpty ? 'No songs available' : 'No songs found',
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.7),
                              fontSize: 12,
                                              ),
                                            ),
                                          )
                                        : GridView.builder(
                                            shrinkWrap: true,
                                            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                                              crossAxisCount: 2,
                                              childAspectRatio: 4.2,
                                              crossAxisSpacing: 4,
                                              mainAxisSpacing: 1,
                                            ),
                                            itemCount: _filteredSongIndices.length,
                                            itemBuilder: (context, listIndex) {
                                              final songIndex = _filteredSongIndices[listIndex];
                                              final song = jamSession!.setList!.songs![songIndex].song;
                                              final isSelected = songIndex == _currentSongIndex;

                                              return Container(
                                                margin: const EdgeInsets.symmetric(horizontal: 1, vertical: 0),
                                                decoration: BoxDecoration(
                                                  color: isSelected
                                                      ? Colors.white.withValues(alpha: 0.3)
                                                      : Colors.transparent,
                                                  borderRadius: BorderRadius.circular(8),
                                                ),
                                                child: InkWell(
                                                  onTap: () {
                                                    setState(() {
                                                      _currentSongIndex = songIndex;
                                                      _currentPage = 0;
                                                      _searchQuery = '';
                                                      _showSongPicker = false;
                                                      _filterSongs();
                                                    });
                                                  },
                                                  borderRadius: BorderRadius.circular(8),
                                                  child: Padding(
                                                    padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                                    child: Column(
                                                      crossAxisAlignment: CrossAxisAlignment.start,
                                                      mainAxisAlignment: MainAxisAlignment.center,
                                                      children: [
                                                        Text(
                                                          song.title,
                                                          style: TextStyle(
                                                            color: Colors.white,
                                                            fontSize: 9,
                                                            fontWeight: FontWeight.w600,
                                                          ),
                                                          maxLines: 1,
                                                          overflow: TextOverflow.ellipsis,
                                                        ),
                                                        const SizedBox(height: 1),
                                                        Text(
                                                          song.artist,
                                                          style: TextStyle(
                                                            color: Colors.white.withValues(alpha: 0.8),
                                                            fontSize: 7,
                                                            fontWeight: FontWeight.w400,
                                                          ),
                                                          maxLines: 1,
                                                          overflow: TextOverflow.ellipsis,
                                                        ),
                                                      ],
                                                    ),
                                                  ),
                                                ),
                                              );
                                            },
                                          ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                    ],
                    ),
                ],
              ),
            ),

            Expanded(
              child: Container(
                margin: const EdgeInsets.fromLTRB(16, 16, 16, 8), // Reduced bottom margin
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(20),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: SlidesWidget(
                    chordSheet: chordSheet,
                    chordSheetKey: chordSheetKey,
                    textSize: _textSize,
                    page: _currentPage,
                    setPage: (page) {
                      setState(() {
                        _currentPage = page;
                      });
                    },
                    setLastPage: (isLast) {
                      setState(() {
                        _isLastPage = isLast;
                      });
                    },
                  ),
                ),
              ),
            ),

            if (_showDebug)
              Container(
                margin: const EdgeInsets.all(16),
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      Color(0xFF4facfe).withValues(alpha: 0.15),
                      Color(0xFF00f2fe).withValues(alpha: 0.1),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: Color(0xFF4facfe).withValues(alpha: 0.3),
                    width: 1,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Color(0xFF4facfe).withValues(alpha: 0.2),
                      blurRadius: 15,
                      offset: const Offset(0, 5),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          Icons.code,
                          color: Color(0xFF4facfe),
                          size: 20,
                        ),
                        const SizedBox(width: 8),
                        const Text(
                          'Chord Sheet Debug',
                          style: TextStyle(
                            color: Color(0xFF4facfe),
                            fontWeight: FontWeight.w600,
                            fontSize: 16,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                                  Text(
                      'Key: $chordSheetKey',
                      style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontSize: 12),
                    ),
                    const SizedBox(height: 8),
                                  Text(
                      'Raw sheet length: ${chordSheet.length} characters',
                      style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontSize: 12),
                            ),
                            const SizedBox(height: 8),
                            Text(
                      'Raw sheet preview:',
                      style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontSize: 12),
                    ),
                                    SelectableText(
                      chordSheet.substring(0, chordSheet.length > 500 ? 500 : chordSheet.length) + '...',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.7),
                                        fontFamily: 'monospace',
                        fontSize: 10,
                      ),
                    ),
                                  ],
                                ),
                              ),

                            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              child: Center(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(
                      onPressed: _previousPage,
                      icon: Icon(
                        Icons.arrow_back_ios,
                        color: _currentPage > 0 ? Colors.white : Colors.white.withValues(alpha: 0.3),
                      ),
                    ),
                    Text(
                      '${_currentPage + 1}${_getTotalPages() != null ? ' / ${_getTotalPages()}' : ''}',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    IconButton(
                      onPressed: _isLastPage ? null : _nextPage,
                      icon: Icon(
                        Icons.arrow_forward_ios,
                        color: _isLastPage ? Colors.white.withValues(alpha: 0.3) : Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        );
    }

    return _buildFallbackDisplay();
  }

  Widget _buildFallbackDisplay() {
    const sampleChordSheet = '''
[Verse]
C                    F
Amazing grace, how sweet the sound
G                    C
That saved a wretch like me
F                    G
I once was lost, but now I'm found
C                    G
Was blind, but now I see

[Chorus]
C                    F
'Twas grace that taught my heart to fear
G                    C
And grace my fears relieved
F                    G
How precious did that grace appear
C                    G
The hour I first believed
''';

    return GestureDetector(
      onTap: () {
        if (_showSongPicker) {
          setState(() {
            _showSongPicker = false;
            _searchQuery = '';
            _filterSongs();
          });
        } else {
          // Ensure focus is regained when tapping on the screen
          _focusNode.requestFocus();
        }
      },
      child: Column(
        children: [
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 16),
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              children: [
                Container(
                  width: 90,
                  height: 90,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Color(0xFFE0B9BE),
                        Color(0xFFC7A2DB),
                        Color(0xFFBD9DFA),
                      ],
                      stops: [0.0, 0.55, 1.0],
                    ),
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: Color(0xFF667eea).withValues(alpha: 0.3),
                        blurRadius: 15,
                        offset: const Offset(0, 5),
                      ),
                    ],
                  ),
                  child: Icon(
                    Icons.music_note_rounded,
                    size: 45,
                    color: Colors.white.withValues(alpha: 0.8),
                  ),
                ),
                
                const SizedBox(width: 24),
                
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Amazing Grace',
                        style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 0.5,
                          shadows: [
                            Shadow(
                              offset: const Offset(0, 2),
                              blurRadius: 4,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'Traditional',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: Colors.white.withValues(alpha: 0.9),
                          letterSpacing: 0.3,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              Colors.white.withValues(alpha: 0.9),
                              Colors.white.withValues(alpha: 0.7),
                            ],
                          ),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.6),
                            width: 1,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.1),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Text(
                          'Key: C',
                          style: TextStyle(
                            color: Color(0xFF4A5568),
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(width: 12),
                
                Stack(
                  children: [
                Container(
                      width: 260,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Color(0xFFC8A2C8),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: Color(0xFFC8A2C8),
                      width: 1,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Color(0xFFa8edea).withValues(alpha: 0.2),
                        blurRadius: 15,
                        offset: const Offset(0, 5),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(
                            Icons.queue_music_rounded,
                            color: Colors.white,
                            size: 20,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'Next Song:',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w600,
                              fontSize: 14,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                        Text(
                          'No songs in set',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.7),
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      const SizedBox(height: 8),
                          InkWell(
                            onTap: () {
                              setState(() {
                                _showSongPicker = true;
                                _searchQuery = '';
                                _filterSongs();
                              });
                            },
                            borderRadius: BorderRadius.circular(12),
                            child: Container(
                          width: double.infinity,
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: Color(0xFFC79CC6),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: Color(0xFFC79CC6),
                              width: 1,
                            ),
                          ),
                              child: Row(
                                children: [
                                  Icon(
                                    Icons.keyboard_arrow_down_rounded,
                              color: Colors.white,
                                    size: 18,
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                  child: Text(
                                      'Select the next song',
                                      style: TextStyle(
                                      color: Colors.white,
                                        fontSize: 12,
                                      fontWeight: FontWeight.w500,
                                    ),
                                    ),
                                  ),
                                ],
                              ),
                          ),
                        ),
                      const SizedBox(height: 4),
                      Text(
                            '0 songs in set',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.7),
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
                    if (_showSongPicker)
                      Positioned(
                        top: 0,
                        left: 0,
                        right: 0,
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(16),
                          child: Container(
              decoration: BoxDecoration(
                              color: Color(0xFFC79CC6),
                              borderRadius: BorderRadius.circular(16),
                border: Border.all(
                                color: Color(0xFFC79CC6),
                  width: 1,
                ),
                boxShadow: [
                  BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.3),
                                  blurRadius: 20,
                                  offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Column(
                children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  child: TextField(
                        style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w500,
                                    ),
                                    decoration: InputDecoration(
                                      hintText: 'Search songs...',
                                      hintStyle: TextStyle(
                                        color: Colors.white.withValues(alpha: 0.7),
                                        fontSize: 12,
                                      ),
                                      prefixIcon: Icon(
                                        Icons.search,
                                        color: Colors.white.withValues(alpha: 0.7),
                                        size: 16,
                                      ),
                                      suffixIcon: _searchQuery.isNotEmpty
                                          ? IconButton(
                                              icon: Icon(
                                                Icons.clear,
                                                color: Colors.white.withValues(alpha: 0.7),
                                                size: 16,
                                              ),
                                              onPressed: () {
                                                setState(() {
                                                  _searchQuery = '';
                                                  _filterSongs();
                                                });
                                              },
                                            )
                                          : null,
                                      border: InputBorder.none,
                                      contentPadding: EdgeInsets.symmetric(horizontal: 4, vertical: 8),
                                    ),
                                    onChanged: (value) {
                                      setState(() {
                                        _searchQuery = value;
                                        _filterSongs();
                                      });
                                    },
                                  ),
                                ),
                                Container(
                                  height: 1,
                                  color: Colors.white.withValues(alpha: 0.3),
                                  margin: const EdgeInsets.symmetric(horizontal: 8),
                                ),
                  Container(
                                  constraints: BoxConstraints(maxHeight: 200),
                                  child: Container(
                                    padding: const EdgeInsets.all(16),
                                    child: Text(
                                      'No songs available',
                                      style: TextStyle(
                                        color: Colors.white.withValues(alpha: 0.7),
                                        fontSize: 12,
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                  ],
                  ),
                ],
              ),
            ),

          Expanded(
            child: Container(
              margin: const EdgeInsets.fromLTRB(16, 16, 16, 8), // Reduced bottom margin
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: SlidesWidget(
                  chordSheet: sampleChordSheet,
                  chordSheetKey: 'C',
                  textSize: _textSize,
                  page: _currentPage,
                  setPage: (page) {
                    setState(() {
                      _currentPage = page;
                    });
                  },
                  setLastPage: (isLast) {
                    setState(() {
                      _isLastPage = isLast;
                    });
                  },
                ),
              ),
            ),
          ),

          Container(
            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            child: Center(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                  IconButton(
                    onPressed: _previousPage,
                    icon: Icon(
                      Icons.arrow_back_ios,
                      color: _currentPage > 0 ? Colors.white : Colors.white.withValues(alpha: 0.3),
                    ),
                  ),
                  Text(
                    '${_currentPage + 1}${_getTotalPages() != null ? ' / ${_getTotalPages()}' : ''}',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  IconButton(
                    onPressed: _isLastPage ? null : _nextPage,
                    icon: Icon(
                      Icons.arrow_forward_ios,
                      color: _isLastPage ? Colors.white.withValues(alpha: 0.3) : Colors.white,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
