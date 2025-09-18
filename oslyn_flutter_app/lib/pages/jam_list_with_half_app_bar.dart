import 'package:flutter/material.dart';
import '../models/jam_session.dart';
import '../services/jam_service.dart';
import '../pages/song_card_page.dart';
import '../widgets/simple_half_app_bar.dart';
import '../widgets/qr_generator_widget.dart';

class JamListWithHalfAppBarPage extends StatefulWidget {
  const JamListWithHalfAppBarPage({super.key});

  @override
  State<JamListWithHalfAppBarPage> createState() => _JamListWithHalfAppBarPageState();
}

class _JamListWithHalfAppBarPageState extends State<JamListWithHalfAppBarPage> {
  List<JamSession> jamSessions = [];
  bool isLoading = true;
  String? errorMessage;
  late JamService _jamService;

  @override
  void initState() {
    super.initState();
    _jamService = JamService();
    _loadJamSessions();
  }

  Future<void> _loadJamSessions() async {
    try {
      setState(() {
        isLoading = true;
        errorMessage = null;
      });

      print('🔄 Loading jam sessions from AWS...');
      
      final sessions = await _jamService.getPublicJamSessions(limit: 10);

      print('📊 Loaded ${sessions.length} jam sessions from AWS');
      
      if (sessions.isEmpty) {
        print('⚠️  No jam sessions found - this might be normal if none exist yet');
      }

      setState(() {
        jamSessions = sessions;
        isLoading = false;
      });

      print('✅ Jam sessions loaded successfully');
    } catch (e) {
      print('❌ Error loading jam sessions: $e');
      setState(() {
        errorMessage = 'Failed to load jam sessions: $e';
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Color(0xFFE0B9BE), // #E0B9BE 0%
            Color(0xFFC7A2DB), // #C7A2DB 55%
            Color(0xFFBD9DFA), // #BD9DFA 100%
          ],
          stops: [0.0, 0.55, 1.0],
        ),
      ),
      child: Scaffold(
        backgroundColor: Colors.transparent,
        // Using the half app bar instead of positioned buttons
        appBar: RoundedHalfAppBar(
          title: 'Oslyn Tabs',
          backgroundColor: Colors.white.withOpacity(0.9),
          foregroundColor: Colors.black87,
          borderRadius: 16.0,
          actions: [
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: _loadJamSessions,
              tooltip: 'Refresh',
            ),
            PopupMenuButton<String>(
              onSelected: (value) {
                switch (value) {
                  case 'refresh':
                    _loadJamSessions();
                    break;
                  case 'settings':
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Settings - Coming soon!')),
                    );
                    break;
                }
              },
              itemBuilder: (context) => [
                const PopupMenuItem(
                  value: 'refresh',
                  child: Row(
                    children: [
                      Icon(Icons.refresh, size: 20),
                      SizedBox(width: 12),
                      Text('Refresh Jam Sessions'),
                    ],
                  ),
                ),
                const PopupMenuItem(
                  value: 'settings',
                  child: Row(
                    children: [
                      Icon(Icons.settings, size: 20),
                      SizedBox(width: 12),
                      Text('Settings'),
                    ],
                  ),
                ),
              ],
              child: const Icon(Icons.more_vert),
              tooltip: 'More options',
            ),
          ],
        ),
        body: Stack(
          children: [
            _buildBody(),
            
            // Back button (top left) - positioned independently
            Positioned(
              top: 50,
              left: 16,
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.9),
                  borderRadius: BorderRadius.circular(25),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: IconButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                  },
                  icon: const Icon(Icons.arrow_back),
                  tooltip: 'Back',
                ),
              ),
            ),
          ],
        ),
        floatingActionButton: FloatingActionButton(
          onPressed: _createJamSession,
          tooltip: 'Create Jam',
          child: const Icon(Icons.add),
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
            Text('Loading jam sessions from AWS...'),
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
              onPressed: _loadJamSessions,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (jamSessions.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.music_note, size: 64, color: Colors.grey),
            const SizedBox(height: 16),
            Text(
              'No jam sessions found',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              'This could mean:',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 8),
            Text(
              '• No public jam sessions exist yet\n• You need to create the first one\n• There might be a connection issue',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.grey[600],
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadJamSessions,
              child: const Text('Refresh'),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: jamSessions.length,
      itemBuilder: (context, index) {
        final jam = jamSessions[index];
        return _buildJamCard(jam);
      },
    );
  }

  Widget _buildJamCard(JamSession jam) {
    final adminCount = jam.admins.length;
    final currentlyActiveCount = jam.active.length;
    
    // Calculate last used date from active participants' lastPing
    final lastUsedDate = _getLastUsedDate(jam);
    
    // Create a better session name using available data
    final sessionName = _generateSessionName(jam);
    
    // Format the date
    final startDate = jam.startDate != null 
        ? DateTime.fromMillisecondsSinceEpoch(jam.startDate!)
        : null;
    
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () {
          print('🎯 Tapped on jam session: ${jam.jamSessionId}');
          print('📝 Description: ${jam.description}');
          print('🎵 Set List: ${jam.setList != null ? "Found" : "Not Found"}');
          if (jam.setList != null) {
            print('📋 Set List ID: ${jam.setList!.setListId}');
            print('📋 Set List Description: ${jam.setList!.description}');
            print('🎼 Songs in Set: ${jam.setList!.songs?.length ?? 0}');
          }
          
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => SongCardPage(
                jamSessionId: jam.jamSessionId,
                initialDescription: jam.description,
              ),
            ),
          );
        },
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header with session name and status
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.blue.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(
                      Icons.music_note,
                      size: 24,
                      color: Colors.blue,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          sessionName,
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 18,
                          ),
                        ),
                        Text(
                          'Session ID: ${jam.jamSessionId.substring(0, 8)}...',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ),
                  // Status indicator
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.green.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.green.withValues(alpha: 0.3)),
                    ),
                    child: Text(
                      'Active',
                      style: TextStyle(
                        fontSize: 10,
                        color: Colors.green[700],
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  // Song count badge
                  if (jam.setList?.songs != null && jam.setList!.songs!.isNotEmpty) ...[
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.purple.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.purple.withValues(alpha: 0.4)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.music_note,
                            size: 12,
                            color: Colors.purple[700],
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '${jam.setList!.songs!.length}',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: Colors.purple[700],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  // QR Code button
                  const SizedBox(width: 8),
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.green.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.green.withValues(alpha: 0.4)),
                    ),
                    child: IconButton(
                      onPressed: () => _showQRCode(jam),
                      icon: Icon(
                        Icons.qr_code,
                        size: 16,
                        color: Colors.green[700],
                      ),
                      tooltip: 'Generate QR Code',
                      padding: const EdgeInsets.all(4),
                      constraints: const BoxConstraints(
                        minWidth: 32,
                        minHeight: 32,
                      ),
                    ),
                  ),
                ],
              ),
              
              // Compact song preview
              if (jam.setList?.songs != null && jam.setList!.songs!.isNotEmpty) ...[
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.blue.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.blue.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.playlist_play,
                        size: 16,
                        color: Colors.blue[700],
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          '${jam.setList!.songs!.take(3).map((s) => s.song.title).join(' • ')}${jam.setList!.songs!.length > 3 ? ' +${jam.setList!.songs!.length - 3} more' : ''}',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.blue[700],
                            fontWeight: FontWeight.w500,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              
              const SizedBox(height: 16),
              
              // Participant counts
              Row(
                children: [
                  _buildParticipantInfo(
                    icon: Icons.admin_panel_settings,
                    label: 'Admins',
                    count: adminCount,
                    color: Colors.blue,
                  ),
                  const SizedBox(width: 16),
                  _buildParticipantInfo(
                    icon: Icons.radio_button_checked,
                    label: 'Currently Active',
                    count: currentlyActiveCount,
                    color: Colors.purple,
                  ),
                  if (jam.setList?.songs != null && jam.setList!.songs!.isNotEmpty) ...[
                    const SizedBox(width: 16),
                    _buildParticipantInfo(
                      icon: Icons.music_note,
                      label: 'Songs',
                      count: jam.setList!.songs!.length,
                      color: Colors.green,
                    ),
                  ],
                ],
              ),
              
              const SizedBox(height: 16),
              
              // Currently active people section
              if (jam.active.isNotEmpty) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.purple.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.purple.withValues(alpha: 0.3)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(
                            Icons.radio_button_checked,
                            size: 16,
                            color: Colors.purple[700],
                          ),
                          const SizedBox(width: 6),
                          Text(
                            'Currently Active (${jam.active.length})',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: Colors.purple[700],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 4,
                        children: jam.active.map((participant) {
                          final displayName = _getParticipantDisplayName(participant);
                          return Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.purple.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.purple.withValues(alpha: 0.4)),
                            ),
                            child: Text(
                              displayName,
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                                color: Colors.purple[800],
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
              ],
              
              // Additional info row
              Row(
                children: [
                  if (startDate != null) ...[
                    Icon(
                      Icons.schedule,
                      size: 16,
                      color: Colors.grey[600],
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'Started ${_formatRelativeDate(startDate)}',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                  if (lastUsedDate != null) ...[
                    const SizedBox(width: 16),
                    Icon(
                      Icons.access_time,
                      size: 16,
                      color: Colors.grey[600],
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'Last used ${_formatRelativeDate(lastUsedDate)}',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                  if (jam.setList != null) ...[
                    const SizedBox(width: 16),
                    Icon(
                      Icons.playlist_play,
                      size: 16,
                      color: Colors.grey[600],
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${jam.setList!.songs?.length ?? 0} songs in set',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  String _generateSessionName(JamSession jam) {
    // If there's a description, use it
    if (jam.description != null && jam.description!.isNotEmpty) {
      return jam.description!;
    }
    
    // Try to get the set list description (like the web app does)
    if (jam.setList != null && jam.setList!.description != null && jam.setList!.description!.isNotEmpty) {
      return jam.setList!.description!;
    }
    
    // Create a name based on admin information
    if (jam.admins.isNotEmpty) {
      final admin = jam.admins.first;
      final adminName = admin.firstName != null && admin.firstName!.isNotEmpty
          ? admin.firstName!
          : admin.username ?? 'Admin';
      
      // Add date context if available
      if (jam.startDate != null) {
        final startDate = DateTime.fromMillisecondsSinceEpoch(jam.startDate!);
        final now = DateTime.now();
        final difference = now.difference(startDate);
        
        if (difference.inDays == 0) {
          return "$adminName's Jam (Today)";
        } else if (difference.inDays == 1) {
          return "$adminName's Jam (Yesterday)";
        } else if (difference.inDays < 7) {
          return "$adminName's Jam (${difference.inDays} days ago)";
        } else {
          return "$adminName's Jam (${startDate.month}/${startDate.day})";
        }
      } else {
        return "$adminName's Jam Session";
      }
    }
    
    // Fallback: use date-based naming
    if (jam.startDate != null) {
      final startDate = DateTime.fromMillisecondsSinceEpoch(jam.startDate!);
      final now = DateTime.now();
      final difference = now.difference(startDate);
      
      if (difference.inDays == 0) {
        return "Today's Jam Session";
      } else if (difference.inDays == 1) {
        return "Yesterday's Jam Session";
      } else if (difference.inDays < 7) {
        return "${difference.inDays} Day Old Jam";
      } else {
        return "Jam Session (${startDate.month}/${startDate.day})";
      }
    }
    
    // Final fallback
    return "Jam Session ${jam.jamSessionId.substring(0, 8)}...";
  }
  
  Widget _buildParticipantInfo({
    required IconData icon,
    required String label,
    required int count,
    required Color color,
  }) {
    return Expanded(
      child: Column(
        children: [
          Icon(
            icon,
            size: 20,
            color: color,
          ),
          const SizedBox(height: 4),
          Text(
            count.toString(),
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              color: Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }

  String _formatRelativeDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);
    
    if (difference.inDays == 0) {
      return 'today';
    } else if (difference.inDays == 1) {
      return 'yesterday';
    } else if (difference.inDays < 7) {
      return '${difference.inDays} days ago';
    } else {
      return '${date.month}/${date.day}/${date.year}';
    }
  }
  
  String _getUserDisplayName(User user) {
    // Try to get a meaningful display name
    if (user.firstName != null && user.firstName!.isNotEmpty) {
      if (user.lastName != null && user.lastName!.isNotEmpty) {
        return '${user.firstName} ${user.lastName}';
      } else {
        return user.firstName!;
      }
    } else if (user.username != null && user.username!.isNotEmpty) {
      return user.username!;
    } else if (user.email != null && user.email!.isNotEmpty) {
      // Extract username from email if available
      final emailParts = user.email!.split('@');
      return emailParts.isNotEmpty ? emailParts[0] : 'Admin';
    } else {
      return 'Admin';
    }
  }
  
  DateTime? _getLastUsedDate(JamSession jam) {
    // Debug: Print what data we have
    print('🔍 Debug Last Used Date for session ${jam.jamSessionId}:');
    print('   Active participants: ${jam.active.length}');
    print('   Start date: ${jam.startDate}');
    
    // Get the most recent lastPing from active participants
    DateTime? mostRecentPing;
    
    for (final participant in jam.active) {
      print('   Participant: ${participant.username} - lastPing: ${participant.lastPing}');
      if (participant.lastPing != null) {
        final pingDate = DateTime.fromMillisecondsSinceEpoch(participant.lastPing!);
        print('   Ping date: $pingDate');
        if (mostRecentPing == null || pingDate.isAfter(mostRecentPing)) {
          mostRecentPing = pingDate;
        }
      }
    }
    
    // If no lastPing data, fall back to startDate
    if (mostRecentPing == null && jam.startDate != null) {
      mostRecentPing = DateTime.fromMillisecondsSinceEpoch(jam.startDate!);
      print('   Using startDate as fallback: $mostRecentPing');
    }
    
    print('   Final last used date: $mostRecentPing');
    return mostRecentPing;
  }
  
  String _getParticipantDisplayName(Participant participant) {
    // Try to get display name from the participant's user object first
    if (participant.user != null) {
      return _getUserDisplayName(participant.user!);
    }
    
    // Fall back to participant's username
    if (participant.username != null && participant.username!.isNotEmpty) {
      return participant.username!;
    }
    
    // Final fallback
    return 'User';
  }

  void _showQRCode(JamSession jam) {
    showDialog(
      context: context,
      builder: (context) => QRGeneratorWidget(
        jamSessionId: jam.jamSessionId,
        jamSessionDescription: jam.description,
        onClose: () => Navigator.of(context).pop(),
      ),
    );
  }

  Future<void> _createJamSession() async {
    try {
      // For now, create a simple jam session with dummy data
      // In a real app, you'd have a form to collect setListId, etc.
      final jamSession = await _jamService.createJamSession(
        setListId: 'dummy-setlist-id', // This would come from a form
        userId: 'dummy-user-id', // This would come from auth
        policy: 'PUBLIC',
      );
      
      if (jamSession != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Jam session created! ID: ${jamSession.jamSessionId}'),
            action: SnackBarAction(
              label: 'View',
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => SongCardPage(
                      jamSessionId: jamSession.jamSessionId,
                      initialDescription: jamSession.description ?? '',
                    ),
                  ),
                );
              },
            ),
          ),
        );
        
        // Refresh the list
        _loadJamSessions();
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to create jam session: $e')),
      );
    }
  }
}
