import 'package:flutter/material.dart';
import '../services/jam_service.dart';
import '../services/auth_service.dart';
import '../models/jam_session.dart';

class BandTestPage extends StatefulWidget {
  const BandTestPage({Key? key}) : super(key: key);

  @override
  State<BandTestPage> createState() => _BandTestPageState();
}

class _BandTestPageState extends State<BandTestPage> {
  final JamService _jamService = JamService();
  final AuthService _authService = AuthService();
  String? _userId;
  String? _selectedBandId;
  List<Song> _songs = [];
  List<Band> _bands = [];
  User? _user;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadUserAndBands();
  }

  Future<void> _loadUserAndBands() async {
    setState(() => _isLoading = true);
    try {
      // Get user ID from auth service
      _userId = _authService.currentUserId;
      
      if (_userId == null) {
        throw Exception('User not authenticated. Please sign in first.');
      }
      
      // Load user with band information
      _user = await _jamService.getUserById(_userId!);
      
      // Load user's bands
      _bands = await _jamService.getBands(_userId!);
      
      // Load all accessible songs
      _songs = await _jamService.getSongs(_userId!);
      
      if (_bands.isNotEmpty) {
        _selectedBandId = _bands.first.bandId;
      }
    } catch (e) {
      print('Error loading data: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading data: $e')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _loadSongsForBand(String? bandId) async {
    if (_userId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('User not authenticated')),
      );
      return;
    }
    
    setState(() => _isLoading = true);
    try {
      _songs = await _jamService.getSongs(_userId!, bandId: bandId);
      setState(() => _selectedBandId = bandId);
    } catch (e) {
      print('Error loading songs: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading songs: $e')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _createTestBand() async {
    if (_userId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('User not authenticated')),
      );
      return;
    }
    
    try {
      final band = await _jamService.createBand(
        name: 'Test Band ${DateTime.now().millisecondsSinceEpoch}',
        description: 'A test band created from the app',
        isPublic: false,
        userId: _userId!,
      );
      
      if (band != null) {
        setState(() {
          _bands.add(band);
          _selectedBandId = band.bandId;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Band created successfully!')),
        );
      }
    } catch (e) {
      print('Error creating band: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error creating band: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Band Access Control Test'),
        backgroundColor: Colors.blue,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // User Information
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'User: ${_user?.username ?? 'Unknown'}',
                            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 8),
                          Text('Email: ${_user?.email ?? 'Unknown'}'),
                          Text('Bands: ${_user?.bandMemberships?.length ?? 0}'),
                          if (_user?.bandMemberships != null)
                            Text('Band Memberships: ${_user!.bandMemberships!.map((m) => '${m.bandId} (${m.role})').join(', ')}'),
                        ],
                      ),
                    ),
                  ),
                  
                  const SizedBox(height: 16),
                  
                  // Band Selection
                  Row(
                    children: [
                      const Text('Select Band:', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      const SizedBox(width: 16),
                      Expanded(
                        child: DropdownButton<String>(
                          value: _selectedBandId,
                          hint: const Text('All Bands'),
                          isExpanded: true,
                          items: [
                            const DropdownMenuItem<String>(
                              value: null,
                              child: Text('All Bands'),
                            ),
                            ..._bands.map((band) => DropdownMenuItem<String>(
                              value: band.bandId,
                              child: Text(band.name),
                            )),
                          ],
                          onChanged: (String? value) {
                            _loadSongsForBand(value);
                          },
                        ),
                      ),
                      const SizedBox(width: 16),
                      ElevatedButton(
                        onPressed: _createTestBand,
                        child: const Text('Create Band'),
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 16),
                  
                  // Bands List
                  Text(
                    'Your Bands (${_bands.length}):',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Expanded(
                    flex: 1,
                    child: ListView.builder(
                      itemCount: _bands.length,
                      itemBuilder: (context, index) {
                        final band = _bands[index];
                        return Card(
                          child: ListTile(
                            title: Text(band.name),
                            subtitle: Text(band.description ?? 'No description'),
                            trailing: Text('${band.members?.length ?? 0} members'),
                            onTap: () => _loadSongsForBand(band.bandId),
                          ),
                        );
                      },
                    ),
                  ),
                  
                  const SizedBox(height: 16),
                  
                  // Songs List
                  Text(
                    'Songs (${_songs.length}):',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Expanded(
                    flex: 2,
                    child: ListView.builder(
                      itemCount: _songs.length,
                      itemBuilder: (context, index) {
                        final song = _songs[index];
                        return Card(
                          child: ListTile(
                            title: Text(song.title),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Artist: ${song.artist}'),
                                if (song.bandIds != null && song.bandIds!.isNotEmpty)
                                  Text('Bands: ${song.bandIds!.join(', ')}'),
                                if (song.primaryBandId != null)
                                  Text('Primary Band: ${song.primaryBandId}'),
                              ],
                            ),
                            trailing: song.isApproved
                                ? const Icon(Icons.check_circle, color: Colors.green)
                                : const Icon(Icons.pending, color: Colors.orange),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
