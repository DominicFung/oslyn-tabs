import 'dart:ui';
import 'package:flutter/material.dart';
import '../services/jam_service.dart';
import '../models/jam_session.dart';

class UserAccountInterface extends StatefulWidget {
  final VoidCallback? onClose;
  final String userId;

  const UserAccountInterface({
    Key? key,
    this.onClose,
    required this.userId,
  }) : super(key: key);

  @override
  State<UserAccountInterface> createState() => _UserAccountInterfaceState();
}

class _UserAccountInterfaceState extends State<UserAccountInterface>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final JamService _jamService = JamService();
  
  // User input state
  final TextEditingController _userIdController = TextEditingController();
  String? _currentUserId;
  bool _isLoading = false;
  
  // Data state
  User? _currentUser;
  List<Band> _userBands = [];
  List<JamSession> _userJamSessions = [];
  
  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadUserData(widget.userId);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _userIdController.dispose();
    super.dispose();
  }

  Future<void> _loadUserData(String userId) async {
    setState(() {
      _isLoading = true;
    });

    try {
      // Load user information
      final user = await _jamService.getUserById(userId);
      print('🔍 ACCOUNT DEBUG: User data loaded: ${user?.username} (${user?.userId})');
      print('🔍 ACCOUNT DEBUG: User bandMemberships: ${user?.bandMemberships?.length ?? 0}');
      if (user?.bandMemberships != null) {
        for (int i = 0; i < user!.bandMemberships!.length; i++) {
          final membership = user.bandMemberships![i];
          print('🔍 ACCOUNT DEBUG: Membership $i: Band ${membership.bandId}, Role ${membership.role}');
        }
      }
      
      // Load user's bands
      final bands = await _jamService.getBands(userId);
      print('🔍 ACCOUNT DEBUG: Loaded ${bands.length} bands');
      for (int i = 0; i < bands.length; i++) {
        final band = bands[i];
        print('🔍 ACCOUNT DEBUG: Band $i: ${band.name} (${band.bandId})');
        print('🔍 ACCOUNT DEBUG:   - Owner: ${band.owner?.username}(${band.owner?.userId})');
        print('🔍 ACCOUNT DEBUG:   - Admins: ${band.admins?.map((a) => '${a.username}(${a.userId})').join(', ')}');
        print('🔍 ACCOUNT DEBUG:   - Members: ${band.members?.map((m) => '${m.username}(${m.userId})').join(', ')}');
        print('🔍 ACCOUNT DEBUG:   - Is user owner? ${band.owner?.userId == userId}');
        print('🔍 ACCOUNT DEBUG:   - Is user admin? ${band.admins?.any((admin) => admin.userId == userId)}');
        print('🔍 ACCOUNT DEBUG:   - Is user owner or admin? ${band.owner?.userId == userId || (band.admins?.any((admin) => admin.userId == userId) ?? false)}');
      }
      
      // Load user's jam sessions (use getUserJamSessions instead of getPublicJamSessions)
      final jamSessions = await _jamService.getUserJamSessions(userId);
      print('🔍 ACCOUNT DEBUG: Loaded ${jamSessions.length} jam sessions');
      for (int i = 0; i < jamSessions.length; i++) {
        final session = jamSessions[i];
        print('🔍 ACCOUNT DEBUG: Jam Session $i: ${session.description} (${session.jamSessionId})');
        print('🔍 ACCOUNT DEBUG:   - BandId: ${session.bandId}');
        print('🔍 ACCOUNT DEBUG:   - Admins: ${session.admins.map((a) => '${a.username}(${a.userId})').join(', ')}');
      }

      setState(() {
        _currentUser = user;
        _userBands = bands;
        _userJamSessions = jamSessions;
        _currentUserId = userId;
        _isLoading = false;
      });
    } catch (e) {
      print('❌ ACCOUNT DEBUG: Error loading user data: $e');
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.transparent,
        borderRadius: BorderRadius.all(Radius.circular(12)),
      ),
      child: Column(
        children: [
          // Header with Apple liquid glass style
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                const Icon(
                  Icons.person,
                  color: Colors.white,
                  size: 20,
                ),
                const SizedBox(width: 8),
                const Text(
                  'Account',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
                const Spacer(),
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.2),
                      width: 1,
                    ),
                  ),
                  child: IconButton(
                    onPressed: widget.onClose,
                    icon: const Icon(
                      Icons.close,
                      color: Colors.white,
                      size: 16,
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          const Divider(height: 1),
          
          // Apple liquid glass style tabs
          _buildTabBar(),
          
          // Tab Content
          _buildTabContent(),
        ],
      ),
    );
  }


  Widget _buildTabBar() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.2),
          width: 1,
        ),
      ),
      child: TabBar(
        controller: _tabController,
        labelColor: Colors.white,
        unselectedLabelColor: Colors.white.withValues(alpha: 0.7),
        indicator: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.2),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: Colors.white.withValues(alpha: 0.3),
            width: 1,
          ),
        ),
        indicatorSize: TabBarIndicatorSize.tab,
        dividerColor: Colors.transparent,
        tabs: const [
          Tab(
            child: Padding(
              padding: EdgeInsets.symmetric(vertical: 8),
              child: Text(
                'User Details',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
          Tab(
            child: Padding(
              padding: EdgeInsets.symmetric(vertical: 8),
              child: Text(
                'Jam Sessions',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
          Tab(
            child: Padding(
              padding: EdgeInsets.symmetric(vertical: 8),
              child: Text(
                'Bands',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabContent() {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: Colors.white.withValues(alpha: 0.2),
            width: 1,
          ),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: TabBarView(
            controller: _tabController,
            children: [
              _buildUserDetailsTab(),
              _buildJamSessionsTab(),
              _buildBandsTab(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildJamSessionsTab() {
    if (_isLoading) {
      return Center(
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.2),
              width: 1,
            ),
          ),
          child: const CircularProgressIndicator(
            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
          ),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Jam Sessions (${_userJamSessions.length})',
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 16),
          Expanded(
            child: _userJamSessions.isEmpty
                ? Center(
                    child: Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: Colors.white.withValues(alpha: 0.2),
                          width: 1,
                        ),
                      ),
                      child: const Text(
                        'No jam sessions found',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                        ),
                      ),
                    ),
                  )
                : ListView.builder(
                    itemCount: _userJamSessions.length,
                    itemBuilder: (context, index) {
                      final session = _userJamSessions[index];
                      // Find the band name for this jam session
                      final bandName = _getBandNameForSession(session);
                      return Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.2),
                            width: 1,
                          ),
                        ),
                        child: ListTile(
                          contentPadding: const EdgeInsets.all(12),
                          title: Text(
                            _generateSessionName(session),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          subtitle: Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                if (bandName != null)
                                  Text(
                                    'Band: $bandName',
                                    style: TextStyle(
                                      color: Colors.white.withValues(alpha: 0.8),
                                      fontSize: 12,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                Text(
                                  'ID: ${session.jamSessionId}',
                                  style: TextStyle(
                                    color: Colors.white.withValues(alpha: 0.7),
                                    fontSize: 10,
                                    fontFamily: 'monospace',
                                  ),
                                ),
                                const SizedBox(height: 4),
                                // Creation date
                                if (session.startDate != null) ...[
                                  Row(
                                    children: [
                                      Icon(
                                        Icons.schedule,
                                        size: 12,
                                        color: Colors.blue[300],
                                      ),
                                      const SizedBox(width: 4),
                                      Text(
                                        'Created ${_formatRelativeDate(DateTime.fromMillisecondsSinceEpoch(session.startDate!))}',
                                        style: TextStyle(
                                          color: Colors.blue[300],
                                          fontSize: 10,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                                // Last updated (if available)
                                if (session.endDate != null) ...[
                                  const SizedBox(height: 2),
                                  Row(
                                    children: [
                                      Icon(
                                        Icons.update,
                                        size: 12,
                                        color: Colors.orange[300],
                                      ),
                                      const SizedBox(width: 4),
                                      Text(
                                        'Updated ${_formatRelativeDate(DateTime.fromMillisecondsSinceEpoch(session.endDate!))}',
                                        style: TextStyle(
                                          color: Colors.orange[300],
                                          fontSize: 10,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ],
                            ),
                          ),
                          trailing: Column(
                            mainAxisSize: MainAxisSize.min,
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              // Policy indicator
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: session.policy == 'PUBLIC' 
                                      ? Colors.green.withValues(alpha: 0.3)
                                      : Colors.orange.withValues(alpha: 0.3),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                    color: session.policy == 'PUBLIC' 
                                        ? Colors.green.withValues(alpha: 0.5)
                                        : Colors.orange.withValues(alpha: 0.5),
                                    width: 1,
                                  ),
                                ),
                                child: Text(
                                  session.policy ?? 'UNKNOWN',
                                  style: TextStyle(
                                    color: session.policy == 'PUBLIC' 
                                        ? Colors.green[300]
                                        : Colors.orange[300],
                                    fontSize: 8,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 4),
                              // Song count
                              if (session.setList?.songsList != null) ...[
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: Colors.purple.withValues(alpha: 0.3),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(
                                      color: Colors.purple.withValues(alpha: 0.5),
                                      width: 1,
                                    ),
                                  ),
                                  child: Text(
                                    '${session.setList!.songsList!.length} songs',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 8,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  String? _getBandNameForSession(JamSession session) {
    if (session.bandId == null) return null;
    
    final band = _userBands.firstWhere(
      (b) => b.bandId == session.bandId,
      orElse: () => Band(
        bandId: session.bandId!,
        name: 'Unknown Band',
        description: null,
        isPublic: null,
        members: null,
        admins: null,
      ),
    );
    
    return band.name;
  }

  Widget _buildBandsTab() {
    if (_isLoading) {
      return Center(
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.2),
              width: 1,
            ),
          ),
          child: const CircularProgressIndicator(
            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
          ),
        ),
      );
    }

    // Separate bands into owned, admin, and member bands using band.userRole
    final ownedBands = <Band>[];
    final adminBands = <Band>[];
    final memberBands = <Band>[];
    
    print('🔍 ROLE DEBUG: Processing ${_userBands.length} bands using band.userRole');
    for (final band in _userBands) {
      final role = band.userRole;
      print('🔍 ROLE DEBUG: Band ${band.name} (${band.bandId}) -> Role: ${role ?? 'NOT_FOUND'}');
      if (role == 'OWNER') {
        ownedBands.add(band);
        print('🔍 ROLE DEBUG: Added to ownedBands');
      } else if (role == 'ADMIN') {
        adminBands.add(band);
        print('🔍 ROLE DEBUG: Added to adminBands');
      } else if (role == 'MEMBER') {
        memberBands.add(band);
        print('🔍 ROLE DEBUG: Added to memberBands');
      } else {
        print('🔍 ROLE DEBUG: No matching role found, band not categorized');
      }
    }
    
    print('🔍 ROLE DEBUG: Final counts - Owned: ${ownedBands.length}, Admin: ${adminBands.length}, Member: ${memberBands.length}');

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Owner of bands section
          if (ownedBands.isNotEmpty) ...[
            Text(
              'Owner of ${ownedBands.length} band${ownedBands.length == 1 ? '' : 's'}',
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 12),
            ...ownedBands.map((band) => _buildBandItem(band, role: 'Owner')),
            const SizedBox(height: 24),
          ],
          
          // Admin of bands section
          if (adminBands.isNotEmpty) ...[
            Text(
              'Admin of ${adminBands.length} band${adminBands.length == 1 ? '' : 's'}',
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 12),
            ...adminBands.map((band) => _buildBandItem(band, role: 'Admin')),
            const SizedBox(height: 24),
          ],
          
          // Member of bands section
          if (memberBands.isNotEmpty) ...[
            Text(
              'Member of ${memberBands.length} band${memberBands.length == 1 ? '' : 's'}',
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 12),
            ...memberBands.map((band) => _buildBandItem(band, role: 'Member')),
            const SizedBox(height: 16),
          ],
          
          // No bands message
          if (_userBands.isEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: Colors.white.withValues(alpha: 0.2),
                  width: 1,
                ),
              ),
              child: const Text(
                'No bands found',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                ),
                textAlign: TextAlign.center,
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildBandItem(Band band, {required String role}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.2),
          width: 1,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header row with band name and role
            Row(
              children: [
                Expanded(
                  child: Text(
                    band.name,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: role == 'Owner'
                        ? Colors.blue.withValues(alpha: 0.3)
                        : role == 'Admin'
                            ? Colors.purple.withValues(alpha: 0.3)
                            : Colors.grey.withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: role == 'Owner'
                          ? Colors.blue.withValues(alpha: 0.5)
                          : role == 'Admin'
                              ? Colors.purple.withValues(alpha: 0.5)
                              : Colors.grey.withValues(alpha: 0.5),
                      width: 1,
                    ),
                  ),
                  child: Text(
                    role,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 8),
            
            // Description
            Text(
              band.description ?? 'No description',
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.7),
                fontSize: 13,
              ),
            ),
            
            const SizedBox(height: 12),
            
            // Footer row with member count and privacy status
            Row(
              children: [
                Text(
                  '${band.members?.length ?? 0} members',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.8),
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: band.isPublic == true 
                        ? Colors.green.withValues(alpha: 0.3)
                        : Colors.orange.withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: band.isPublic == true 
                          ? Colors.green.withValues(alpha: 0.5)
                          : Colors.orange.withValues(alpha: 0.5),
                      width: 1,
                    ),
                  ),
                  child: Text(
                    band.isPublic == true ? 'Public' : 'Private',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ],
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
    return "Jam Session";
  }


  Widget _buildUserDetailsTab() {
    if (_currentUser == null) {
      return Center(
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.2),
              width: 1,
            ),
          ),
          child: const Text(
            'No user data available',
            style: TextStyle(
              color: Colors.white,
              fontSize: 14,
            ),
          ),
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'User Details',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: Colors.white.withValues(alpha: 0.2),
                width: 1,
              ),
            ),
            child: Column(
              children: [
                _buildDetailRow('User ID', _currentUser!.userId ?? 'N/A'),
                _buildDetailRow('Username', _currentUser!.username ?? 'N/A'),
                _buildDetailRow('Email', _currentUser!.email ?? 'N/A'),
                _buildDetailRow('First Name', _currentUser!.firstName ?? 'N/A'),
                _buildDetailRow('Last Name', _currentUser!.lastName ?? 'N/A'),
                _buildDetailRow('Role', _currentUser!.role ?? 'N/A'),
                _buildDetailRow('Member Since', _formatDate(_currentUser!.createDate)),
                _buildDetailRow('Bands Count', '${_currentUser!.bandMemberships?.length ?? 0}'),
                _buildDetailRow('Is Activated', _currentUser!.isActivated == true ? 'Yes' : 'No'),
              ],
            ),
          ),
          if (_currentUser!.bandMemberships != null && _currentUser!.bandMemberships!.isNotEmpty) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: Colors.white.withValues(alpha: 0.2),
                  width: 1,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Band IDs:',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 8),
                  ..._currentUser!.bandMemberships!.map((membership) => Padding(
                    padding: const EdgeInsets.only(left: 12, bottom: 6),
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(
                          color: Colors.white.withValues(alpha: 0.2),
                          width: 1,
                        ),
                      ),
                      child: Text(
                        '${membership.bandId} (${membership.role})',
                        style: TextStyle(
                          fontSize: 10,
                          fontFamily: 'monospace',
                          color: Colors.white.withValues(alpha: 0.8),
                        ),
                      ),
                    ),
                  )),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              '$label:',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                color: Colors.white.withValues(alpha: 0.8),
                fontSize: 12,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 12,
                color: Colors.white,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(int? timestamp) {
    if (timestamp == null) return 'N/A';
    final date = DateTime.fromMillisecondsSinceEpoch(timestamp);
    return '${date.day}/${date.month}/${date.year}';
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
}
