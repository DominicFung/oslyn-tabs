import 'package:flutter/material.dart';
import 'dart:ui';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:oslyn_flutter_app/services/auth_service.dart';
import 'package:oslyn_flutter_app/services/jam_service.dart';
import 'package:oslyn_flutter_app/pages/song_card_page.dart';
import '../utils/security_validator.dart';
import '../utils/font_utils.dart';
import '../widgets/qr_scanner_widget.dart';
import '../widgets/pin_input_widget.dart';
import '../widgets/user_account_widget.dart';
import '../widgets/positioning_test.dart';
import '../models/jam_session.dart';

class MainPage extends StatefulWidget {
  const MainPage({Key? key}) : super(key: key);

  @override
  _MainPageState createState() => _MainPageState();
}

class _MainPageState extends State<MainPage> {
  final TextEditingController _jamIdController = TextEditingController();
  final TextEditingController _userIdController = TextEditingController();
  final FocusNode _jamIdFocusNode = FocusNode();
  final FocusNode _userIdFocusNode = FocusNode();
  final AuthService _authService = AuthService();
  final JamService _jamService = JamService();
  bool _isLoading = false;
  List<JamSession> _userJamSessions = [];
  String? _currentUserId;
  bool _isAuthenticated = false;

  @override
  void initState() {
    super.initState();
    print('🔧 MainPage initState() called');
    _initializeAuth();
  }

  Future<void> _initializeAuth() async {
    print('🔍 ===== AUTH INITIALIZATION DEBUG START =====');
    await _authService.initialize();
    
    // Check if user is already authenticated
    final userId = _authService.currentUserId;
    print('🔍 Auth service initialized, user ID: "$userId"');
    print('🔍 User ID is null: ${userId == null}');
    print('🔍 User ID is empty: ${userId?.isEmpty ?? true}');
    
    if (userId != null && userId.isNotEmpty) {
      print('✅ User already authenticated from previous session');
      setState(() {
        _currentUserId = userId;
        _isAuthenticated = true;
      });
      
      print('✅ State restored - _currentUserId: "$_currentUserId"');
      print('✅ State restored - _isAuthenticated: $_isAuthenticated');
      
      // Load user's jam sessions
      await _loadUserJamSessions();
    } else {
      print('ℹ️ No previous authentication found - user needs to sign in');
    }
  }

  Future<void> _authenticateUser(String userId) async {
    if (userId.trim().isEmpty) return;
    
    setState(() {
      _isLoading = true;
    });

    try {
      print('🔍 ===== USER AUTHENTICATION DEBUG START =====');
      print('🔍 Input user ID: "$userId"');
      print('🔍 Trimmed user ID: "${userId.trim()}"');
      print('🔍 User ID length: ${userId.trim().length}');
      print('🔍 User ID is empty: ${userId.trim().isEmpty}');
      
      // Test the user ID by trying to fetch user data
      print('🔍 Calling getUserById with userId: "${userId.trim()}"');
      final user = await _jamService.getUserById(userId.trim());
      print('🔍 getUserById result: ${user != null ? "USER FOUND" : "USER NOT FOUND"}');
      
      if (user != null) {
        print('✅ User authentication successful');
        print('✅ Setting _currentUserId to: "${userId.trim()}"');
        print('✅ Setting _isAuthenticated to: true');
        
        // Update AuthService with the user ID so it's available globally
        print('🔍 Updating AuthService with user ID: "${userId.trim()}"');
        _authService.setUserInfo(userId.trim(), user.email, user.username);
        
        // Save to SharedPreferences so it persists
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('user_id', userId.trim());
        await prefs.setString('user_email', user.email ?? '');
        await prefs.setString('user_name', user.username ?? '');
        await prefs.setBool('user_has_logged_in_before', true);
        
        print('✅ AuthService updated with user information');
        print('🔍 AuthService currentUserId: ${_authService.currentUserId}');
        
        setState(() {
          print('🔍 Setting _currentUserId to: "${userId.trim()}"');
          _currentUserId = userId.trim();
          _isAuthenticated = true;
          _isLoading = false;
        });
        
        print('✅ State updated successfully');
        print('🔍 Current _currentUserId after setState: "$_currentUserId"');
        print('🔍 Current _isAuthenticated after setState: $_isAuthenticated');
        
        // Verify the user ID is properly set
        if (_currentUserId != null && _currentUserId!.isNotEmpty) {
          print('✅ User ID is properly set and ready for jam session access');
          print('✅ Manual authentication completed successfully');
        } else {
          print('❌ User ID is still null or empty after authentication!');
        }
        
        // Load user's jam sessions after successful authentication
        print('🔍 Calling _loadUserJamSessions()...');
        _loadUserJamSessions();
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Welcome, ${user.firstName ?? user.username ?? 'User'}!'),
            backgroundColor: Colors.green,
          ),
        );
      } else {
        setState(() {
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('User not found. Please check your User ID.'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Authentication failed: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _logout() async {
    print('🔍 ===== LOGOUT CALLED =====');
    print('🔍 Current user ID before logout: "$_currentUserId"');
    print('🔍 Current authentication status: $_isAuthenticated');
    
    // Sign out from auth service
    await _authService.signOut();
    
    setState(() {
      _currentUserId = null;
      _isAuthenticated = false;
      _userJamSessions.clear();
    });
    
    print('🔍 User ID after logout: "$_currentUserId"');
    print('🔍 Authentication status after logout: $_isAuthenticated');
    _userIdController.clear();
    
    _showSnackBar('Successfully signed out!');
  }

  Future<void> _loadUserJamSessions() async {
    print('🔍 ===== LOAD USER JAM SESSIONS DEBUG START =====');
    print('🔍 Is authenticated: $_isAuthenticated');
    print('🔍 Current user ID: "$_currentUserId"');
    print('🔍 Current user ID is null: ${_currentUserId == null}');
    print('🔍 Current user ID is empty: ${_currentUserId?.isEmpty ?? true}');
    
    if (!_isAuthenticated || _currentUserId == null) {
      print('❌ Cannot load user jam sessions - not authenticated or no user ID');
      return;
    }
    
    setState(() {
      // Loading jam sessions
    });

    try {
      print('🔍 Calling getUserJamSessions with userId: "$_currentUserId"');
      
      // First test the resolver with a minimal query
      await _jamService.testGetUserJamSessionsResolver(_currentUserId!);
      
      final sessions = await _jamService.getUserJamSessions(_currentUserId!);
      print('🔍 getUserJamSessions returned ${sessions.length} sessions');
      
      if (sessions.isNotEmpty) {
        print('📊 Jam sessions found:');
        for (int i = 0; i < sessions.length; i++) {
          final session = sessions[i];
          print('   ${i + 1}. ${session.jamSessionId} - ${session.description ?? 'No description'}');
        }
      } else {
        print('⚠️ No jam sessions found for user');
      }
      
      setState(() {
        _userJamSessions = sessions;
      });
      print('✅ Successfully loaded ${sessions.length} jam sessions');
    } catch (e) {
      print('❌ Error loading user jam sessions: $e');
      print('❌ Error stack trace: ${StackTrace.current}');
      setState(() {
        // Error loading jam sessions
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    print('🔧 MainPage build() called - _isLoading: $_isLoading, _isAuthenticated: $_isAuthenticated');
    final welcomeMessage = _isAuthenticated ? 'Welcome back!' : '';
    
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Container(
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
        child: SafeArea(
          child: Padding(
            padding: EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Top Bar with User Account
                if (_isAuthenticated) _buildTopBar(),
                
                // Welcome Message for Authenticated Users
                if (_isAuthenticated && welcomeMessage.isNotEmpty) ...[
                  _buildWelcomeBanner(welcomeMessage),
                  SizedBox(height: 20),
                ],
                
                // User Authentication Section
                if (!_isAuthenticated) ...[
                  _buildAuthenticationForm(),
                  SizedBox(height: 40),
                ],
                
                // Main Content Row - Logo on left, options on right
                LayoutBuilder(
                  builder: (context, constraints) {
                    // Make layout responsive based on screen width
                    final isWideScreen = constraints.maxWidth > 600;
                    final logoFlex = isWideScreen ? 2 : 1;
                    final optionsFlex = isWideScreen ? 3 : 2;
                    
                    return Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Left Side - Logo and Title
                        Expanded(
                          flex: logoFlex,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.center,
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                'Oslyn Tabs',
                                style: FontUtils.sfPro(
                                  fontSize: isWideScreen ? 64 : 48,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                  isDisplay: true,
                                ).copyWith(letterSpacing: 2),
                                textAlign: TextAlign.center,
                              ),
                              SizedBox(height: 10),
                              Text(
                                'Music Jam Sessions',
                                style: FontUtils.sfPro(
                                  fontSize: isWideScreen ? 18 : 16,
                                  color: Colors.white70,
                                  fontWeight: FontWeight.w300,
                                ),
                                textAlign: TextAlign.center,
                              ),
                              SizedBox(height: isWideScreen ? 20 : 16),
                              // Help text for sign in
                              if (!_isAuthenticated)
                                Text(
                                  'Sign in to create jam sessions and manage songs',
                                  style: TextStyle(
                                    fontFamily: '.SF Pro Text',
                                    color: Colors.white60,
                                    fontSize: isWideScreen ? 14 : 12,
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                              SizedBox(height: isWideScreen ? 12 : 8),
                              // Small Sign in with Google widget
                              if (!_isAuthenticated)
                                _buildSmallGoogleSignIn(isWideScreen),
                              SizedBox(height: isWideScreen ? 20 : 16),
                            ],
                          ),
                        ),
                        
                        SizedBox(width: isWideScreen ? 40 : 20),
                        
                        // Right Side - Two Options Stacked
                        Expanded(
                          flex: optionsFlex,
                          child: Padding(
                            padding: EdgeInsets.only(right: isWideScreen ? 40 : 20),
                            child: Column(
                              children: [
                                // Option 1: Enter Jam Session
                                _buildMainOption(
                                  title: 'Enter Jam Session',
                                  subtitle: 'Start jamming right away',
                                  icon: Icons.music_note,
                                  color: Color(0xFF007AFF),
                                  onTap: () {
                                    print('🔘 Enter Jam Session button tapped!');
                                    _showEnterJamOptions();
                                  },
                                  isCompact: !isWideScreen,
                                ),
                                
                                SizedBox(height: isWideScreen ? 20 : 16),
                                
                // Option 2: Quick Join Options
            _buildQuickJoinOptions(isWideScreen),
            
            SizedBox(height: isWideScreen ? 20 : 16),
            
            // Debug Test Button (only in debug mode)
            if (_isAuthenticated)
              _buildDebugTestButton(isWideScreen),
                              ],
                            ),
                          ),
                        ),
                      ],
                    );
                  },
                ),
                
                SizedBox(height: 20),
                
                // Welcome message for authenticated users
                if (_isAuthenticated)
                  Text(
                    'Welcome back! You can manage songs and access all jam sessions.',
                    style: TextStyle(
                      fontFamily: '.SF Pro Text',
                      color: Colors.white60,
                      fontSize: 14,
                    ),
                    textAlign: TextAlign.center,
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMainOption({
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
    bool isCompact = false,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(isCompact ? 12 : 16),
      child: Container(
        width: double.infinity,
        padding: EdgeInsets.all(isCompact ? 16 : 24),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.15),
          borderRadius: BorderRadius.circular(isCompact ? 12 : 16),
          border: Border.all(color: Colors.white.withOpacity(0.3), width: 1.5),
        ),
        child: Row(
          children: [
            Container(
              width: isCompact ? 50 : 60,
              height: isCompact ? 50 : 60,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                borderRadius: BorderRadius.circular(isCompact ? 25 : 30),
                border: Border.all(color: Colors.white.withOpacity(0.4), width: 2),
              ),
              child: Icon(
                icon,
                color: Colors.white,
                size: isCompact ? 24 : 30,
              ),
            ),
            SizedBox(width: isCompact ? 16 : 20),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontFamily: '.SF Pro Display',
                      fontSize: isCompact ? 16 : 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                      letterSpacing: 0.3,
                    ),
                  ),
                  SizedBox(height: isCompact ? 4 : 6),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontFamily: '.SF Pro Text',
                      fontSize: isCompact ? 12 : 14,
                      color: Colors.white.withOpacity(0.8),
                      fontWeight: FontWeight.w400,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.arrow_forward_ios,
              color: Colors.white.withOpacity(0.7),
              size: isCompact ? 16 : 18,
            ),
          ],
        ),
      ),
    );
  }

  void _showEnterJamOptions() {
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (context) {
        final screenSize = MediaQuery.of(context).size;
        final isSmallScreen = screenSize.width < 400 || screenSize.height < 600;
        final isVerySmallScreen = screenSize.width < 350 || screenSize.height < 500;
        
        return Dialog(
          backgroundColor: Colors.transparent,
          child: Container(
            constraints: BoxConstraints(
              maxWidth: isVerySmallScreen ? screenSize.width * 0.95 : 400,
              maxHeight: screenSize.height * 0.8,
            ),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.1),
              borderRadius: BorderRadius.circular(isSmallScreen ? 20 : 30),
              border: Border.all(color: Colors.white.withOpacity(0.2), width: 1.5),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(isSmallScreen ? 20 : 30),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                child: Padding(
                  padding: EdgeInsets.all(isSmallScreen ? 20 : 32),
                  child: SingleChildScrollView(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // Header
                        Row(
                          children: [
                            Container(
                              width: isSmallScreen ? 50 : 60,
                              height: isSmallScreen ? 50 : 60,
                              decoration: BoxDecoration(
                                color: Color(0xFF007AFF),
                                borderRadius: BorderRadius.circular(isSmallScreen ? 25 : 30),
                              ),
                              child: Icon(
                                Icons.music_note,
                                color: Colors.white,
                                size: isSmallScreen ? 25 : 30,
                              ),
                            ),
                            SizedBox(width: isSmallScreen ? 16 : 20),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Enter Jam Session',
                                    style: TextStyle(
                                      fontFamily: '.SF Pro Display',
                                      fontSize: isSmallScreen ? 22 : 28,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                  if (!isVerySmallScreen)
                                    Text(
                                      'Choose how you want to join',
                                      style: TextStyle(
                                        fontFamily: '.SF Pro Text',
                                        fontSize: isSmallScreen ? 14 : 16,
                                        color: Colors.white.withOpacity(0.8),
                                        fontWeight: FontWeight.w400,
                                      ),
                                    ),
                                ],
                              ),
                            ),
                            Container(
                              width: isSmallScreen ? 36 : 40,
                              height: isSmallScreen ? 36 : 40,
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(isSmallScreen ? 18 : 20),
                                border: Border.all(color: Colors.white.withOpacity(0.3), width: 1),
                              ),
                              child: IconButton(
                                onPressed: () => Navigator.pop(context),
                                icon: Icon(Icons.close, color: Colors.white, size: isSmallScreen ? 18 : 20),
                                padding: EdgeInsets.zero,
                              ),
                            ),
                          ],
                        ),
                        
                        SizedBox(height: isSmallScreen ? 24 : 40),
                        
                        // Jam ID Input Section
                        Text(
                          'Enter Jam Session ID',
                          style: TextStyle(
                            fontFamily: '.SF Pro Text',
                            fontSize: isSmallScreen ? 18 : 20,
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                          ),
                        ),
                        SizedBox(height: isSmallScreen ? 12 : 16),
                        TextField(
                          controller: _jamIdController,
                          focusNode: _jamIdFocusNode,
                          onSubmitted: (value) {
                            if (!_isLoading) {
                              _joinJamSession();
                            }
                          },
                          decoration: InputDecoration(
                            hintText: isVerySmallScreen 
                              ? 'Enter Jam ID'
                              : 'Enter Jam Session ID (e.g., abc123def)',
                            hintStyle: TextStyle(
                              fontFamily: '.SF Pro Text',
                              color: Colors.white.withOpacity(0.6),
                              fontSize: isSmallScreen ? 14 : 16,
                            ),
                            filled: true,
                            fillColor: Colors.white.withOpacity(0.15),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(isSmallScreen ? 12 : 16),
                              borderSide: BorderSide.none,
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(isSmallScreen ? 12 : 16),
                              borderSide: BorderSide(color: Colors.white.withOpacity(0.3), width: 1.5),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(isSmallScreen ? 12 : 16),
                              borderSide: BorderSide(color: Color(0xFF007AFF), width: 2),
                            ),
                            contentPadding: EdgeInsets.symmetric(
                              horizontal: isSmallScreen ? 16 : 24,
                              vertical: isSmallScreen ? 16 : 20,
                            ),
                          ),
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontFamily: '.SF Pro Text',
                            fontSize: isSmallScreen ? 14 : 16,
                            color: Colors.white,
                          ),
                        ),
                        SizedBox(height: isSmallScreen ? 16 : 24),
                        
                        // Join Button
                        SizedBox(
                          width: double.infinity,
                          height: isSmallScreen ? 48 : 56,
                          child: ElevatedButton(
                            onPressed: _isLoading ? null : _joinJamSession,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Color(0xFF007AFF),
                              padding: EdgeInsets.symmetric(vertical: isSmallScreen ? 14 : 18),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(isSmallScreen ? 12 : 16),
                              ),
                              elevation: 8,
                              shadowColor: Color(0xFF007AFF).withOpacity(0.4),
                            ),
                            child: _isLoading
                                ? Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      SizedBox(
                                        height: isSmallScreen ? 20 : 24,
                                        width: isSmallScreen ? 20 : 24,
                                        child: CircularProgressIndicator(
                                          color: Colors.white,
                                          strokeWidth: 2.5,
                                        ),
                                      ),
                                      SizedBox(width: isSmallScreen ? 12 : 16),
                                      Text(
                                        'Validating...',
                                        style: TextStyle(
                                          fontFamily: '.SF Pro Text',
                                          color: Colors.white,
                                          fontSize: isSmallScreen ? 16 : 18,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ],
                                  )
                                : Text(
                                    'Join Jam',
                                    style: TextStyle(
                                      fontFamily: '.SF Pro Text',
                                      color: Colors.white,
                                      fontSize: isSmallScreen ? 16 : 20,
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                          ),
                        ),
                        
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  void _joinJamSession() async {
    final jamId = _jamIdController.text.trim();
    
    // 1. Basic empty check
    if (jamId.isEmpty) {
      _showSnackBar('Please enter a Jam Session ID');
      return;
    }
    
    setState(() {
      _isLoading = true;
    });
    
    try {
      // 2. Rate limiting check
      final rateLimitOk = await SecurityValidator.checkRateLimit();
      if (!rateLimitOk) {
        _showSnackBar('Too many attempts. Please wait a few minutes before trying again.');
        return;
      }
      
      // 3. Security validation and sanitization
      print('🔒 Performing security validation for jam ID: ${SecurityValidator.sanitizeForLogging(jamId)}');
      final validationResult = SecurityValidator.validateJamId(jamId);
      
      if (!validationResult.isValid) {
        print('❌ Security validation failed: ${validationResult.errorMessage}');
        _showSnackBar(validationResult.errorMessage ?? 'Invalid jam session ID format');
        return;
      }
      
      final sanitizedInput = validationResult.sanitizedInput!;
      print('🔍 Validating jam session: ${SecurityValidator.sanitizeForLogging(sanitizedInput)}');
      
      // 4. Check if input is a PIN (6 characters) or jam session ID (UUID)
      print('🔍 ===== JAM SESSION VALIDATION DEBUG START =====');
      print('🔍 Sanitized input: "$sanitizedInput"');
      print('🔍 Input length: ${sanitizedInput.length}');
      print('🔍 Current user ID: "$_currentUserId"');
      print('🔍 Current user ID is null: ${_currentUserId == null}');
      print('🔍 Current user ID is empty: ${_currentUserId?.isEmpty ?? true}');
      
      JamSession? jamSession;
      String? actualJamSessionId;
      
      if (sanitizedInput.length == 6) {
        // It's a PIN - look up the jam session by PIN
        print('🔑 Input is a PIN (6 characters), looking up jam session by PIN...');
        print('🔑 PIN: "$sanitizedInput"');
        print('🔑 Current user ID when using PIN: "$_currentUserId"');
        print('🔑 User authenticated: $_isAuthenticated');
        jamSession = await _jamService.getJamSessionByPin(sanitizedInput);
        print('🔑 PIN lookup result: ${jamSession != null ? "FOUND" : "NOT FOUND"}');
        if (jamSession != null) {
          actualJamSessionId = jamSession.jamSessionId;
          print('🔑 Actual jam session ID from PIN: "$actualJamSessionId"');
        }
      } else {
        // It's a jam session ID - look up directly with user authentication
        print('🆔 ===== JAM SESSION ID LOOKUP DEBUG START =====');
        print('🆔 Input is a jam session ID (not 6 characters), looking up directly...');
        print('🆔 Jam session ID: "$sanitizedInput"');
        print('🆔 Current user ID: "$_currentUserId"');
        print('🆔 User ID type: ${_currentUserId.runtimeType}');
        print('🆔 User ID is null: ${_currentUserId == null}');
        print('🆔 User ID is empty: ${_currentUserId?.isEmpty ?? true}');
        print('🆔 User ID equals "null": ${_currentUserId == "null"}');
        print('🆔 User authenticated: $_isAuthenticated');
        print('🆔 User jam sessions count: ${_userJamSessions.length}');
        
        // Check if user is properly authenticated
        if (!_isAuthenticated || _currentUserId == null) {
          print('❌ User not authenticated - cannot access private jam sessions');
          print('❌ Please authenticate first by entering your User ID or signing in with Google');
          _showSnackBar('Please authenticate first to access jam sessions.');
          return;
        }
        
        // Get the user ID - convert "null" string to actual null
        String? userIdToUse = _currentUserId;
        if (userIdToUse == "null" || userIdToUse == null || userIdToUse.isEmpty) {
          userIdToUse = null;
          print('🔄 [DEBUG] userIdToUse is null, empty, or "null" string - setting to null');
        }
        
        if (userIdToUse == null) {
          print('❌ No valid user ID available for jam session access');
          print('❌ This should not happen if user is properly authenticated');
          _showSnackBar('Authentication error. Please sign in again.');
          return;
        }
        
        print('✅ Using user ID for jam session access: "$userIdToUse"');
        print('📤 Calling getJamSession with userId: "$userIdToUse"');
        print('🔍 Double-checking _currentUserId before API call: "$_currentUserId"');
        print('🔍 Double-checking _isAuthenticated before API call: $_isAuthenticated');
        
        // Debug: Run comprehensive access test
        print('🔍 Running debug access test...');
        await _jamService.debugJamSessionAccess(sanitizedInput, userIdToUse);
        
        jamSession = await _jamService.getJamSession(sanitizedInput, userId: userIdToUse);
        print('🆔 Jam session ID lookup result: ${jamSession != null ? "FOUND" : "NOT FOUND"}');
        actualJamSessionId = sanitizedInput;
      }
      
      if (jamSession != null && actualJamSessionId != null) {
        print('✅ Jam session found: ${jamSession.jamSessionId}');
        print('📝 Description: ${jamSession.description ?? 'No description'}');
        print('👥 Admins: ${jamSession.admins.length}');
        print('👥 Active: ${jamSession.active.length}');
        
        // Close the modal first
        Navigator.pop(context);
        
        // Navigate to the jam session
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => SongCardPage(
              jamSessionId: actualJamSessionId!,
              initialDescription: jamSession?.description ?? '',
            ),
          ),
        );
        
        _showSnackBar('Successfully joined jam session!');
      } else {
        print('❌ Jam session not found: ${SecurityValidator.sanitizeForLogging(sanitizedInput)}');
        _showSnackBar('Jam session not found. Please check the ID or PIN and try again.');
      }
    } catch (e) {
      print('❌ Error validating jam session: $e');
      _showSnackBar('Error joining jam session. Please try again.');
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _signInWithGoogle() async {
    setState(() {
      _isLoading = true;
    });
    
    try {
      print('🔍 ===== GOOGLE SIGN-IN DEBUG START =====');
      print('🔍 Starting Google Sign-In process...');
      
      final success = await _authService.signInWithGoogle();
      print('🔍 Google Sign-In result: $success');
      
      if (success) {
        // Get the user ID from the auth service
        final userId = _authService.currentUserId;
        print('🔍 Google Sign-In successful, user ID: "$userId"');
        print('🔍 User ID is null: ${userId == null}');
        print('🔍 User ID is empty: ${userId?.isEmpty ?? true}');
        
        if (userId != null && userId.isNotEmpty) {
          print('✅ Setting _currentUserId from Google Sign-In: "$userId"');
          setState(() {
            _currentUserId = userId;
            _isAuthenticated = true;
          });
          
          print('✅ State updated - _currentUserId: "$_currentUserId"');
          print('✅ State updated - _isAuthenticated: $_isAuthenticated');
          
          _showSnackBar('Successfully signed in!');
          // Load jam sessions for the newly signed-in user
          await _loadUserJamSessions();
        } else {
          print('❌ Google Sign-In succeeded but user ID is null or empty');
          _showSnackBar('Sign in failed: No user ID received.');
        }
      } else {
        print('❌ Google Sign-In failed');
        _showSnackBar('Sign in failed. Please try again.');
      }
    } catch (e) {
      print('❌ Error during Google Sign-In: $e');
      _showSnackBar('Error signing in: $e');
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _openQRScanner() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => QRScannerWidget(
          onQRCodeScanned: _handleQRCodeScanned,
          onClose: () => Navigator.pop(context),
        ),
      ),
    );
  }

  void _showPinInput() {
    showDialog(
      context: context,
      builder: (context) => PinInputWidget(
        onPinEntered: _handleQRCodeScanned,
        onClose: () => Navigator.of(context).pop(),
      ),
    );
  }

  void _handleQRCodeScanned(String qrData) {
    print('📱 QR Code received: ${qrData.length > 20 ? '${qrData.substring(0, 20)}...' : qrData}');
    
    // Extract jam session ID from QR data
    String jamId = _extractJamIdFromQR(qrData);
    
    if (jamId.isNotEmpty) {
      // Close the QR scanner
      Navigator.pop(context);
      
      // Set the jam ID in the text field
      _jamIdController.text = jamId;
      
      // Automatically join the jam session
      _joinJamSession();
    } else {
      _showSnackBar('Invalid QR code format');
    }
  }

  String _extractJamIdFromQR(String qrData) {
    // If it's a direct jam session ID (supports both UUID and PIN formats)
    if (qrData.length >= 3 && qrData.length <= 50 && 
        RegExp(r'^[a-zA-Z0-9\-_]+$').hasMatch(qrData)) {
      return qrData;
    }
    
    // If it's a URL, try to extract the jam session ID
    try {
      final uri = Uri.parse(qrData);
      
      // Check query parameters
      String? jamId = uri.queryParameters['jamId'] ?? 
                     uri.queryParameters['sessionId'] ??
                     uri.queryParameters['id'];
      
      if (jamId != null && jamId.isNotEmpty) {
        return jamId;
      }
      
      // Check path segments
      for (String segment in uri.pathSegments) {
        if (segment.length >= 3 && RegExp(r'^[a-zA-Z0-9\-_]+$').hasMatch(segment)) {
          return segment;
        }
      }
    } catch (e) {
      print('Error parsing QR URL: $e');
    }
    
    return '';
  }

  void _showSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Color(0xFF7B2CBF),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
        ),
      ),
    );
  }

  Widget _buildAuthenticationForm() {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: Colors.white.withOpacity(0.2),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          Text(
            'Enter Your User ID',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w600,
              color: Colors.white,
              letterSpacing: 0.5,
            ),
          ),
          SizedBox(height: 24),
          Container(
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.1),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: Colors.white.withOpacity(0.2),
                width: 1,
              ),
            ),
            child: TextField(
              controller: _userIdController,
              focusNode: _userIdFocusNode,
              style: TextStyle(
                color: Colors.white,
                fontSize: 16,
              ),
              decoration: InputDecoration(
                labelText: 'User ID',
                labelStyle: TextStyle(
                  color: Colors.white.withOpacity(0.8),
                  fontSize: 16,
                ),
                hintText: 'e.g., your-user-id_usr',
                hintStyle: TextStyle(
                  color: Colors.white.withOpacity(0.6),
                  fontSize: 14,
                ),
                border: InputBorder.none,
                contentPadding: EdgeInsets.all(20),
                prefixIcon: Icon(
                  Icons.person,
                  color: Colors.white.withOpacity(0.8),
                ),
              ),
              onSubmitted: (value) {
                if (value.trim().isNotEmpty) {
                  _authenticateUser(value);
                }
              },
            ),
          ),
          SizedBox(height: 24),
          Container(
            width: double.infinity,
            height: 56,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Colors.purple.withOpacity(0.8),
                  Colors.purple.withOpacity(0.6),
                ],
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: Colors.white.withOpacity(0.2),
                width: 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.purple.withOpacity(0.3),
                  blurRadius: 15,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                borderRadius: BorderRadius.circular(16),
                onTap: _isLoading ? null : () {
                  final userId = _userIdController.text.trim();
                  if (userId.isNotEmpty) {
                    _authenticateUser(userId);
                  }
                },
                child: Center(
                  child: _isLoading
                      ? SizedBox(
                          height: 24,
                          width: 24,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : Text(
                          'Sign In',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 0.5,
                          ),
                        ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTopBar() {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.symmetric(vertical: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // App Title
          Text(
            'Oslyn Tabs',
            style: TextStyle(
              fontFamily: '.SF Pro Display',
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.white,
              letterSpacing: 1,
            ),
          ),
          // User Info and Logout
          Row(
            children: [
              // Current User Info
              Container(
                padding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: Colors.white.withOpacity(0.3),
                    width: 1,
                  ),
                ),
                child: Text(
                  'User: ${_currentUserId?.substring(0, 8) ?? 'Unknown'}...',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              SizedBox(width: 12),
              // User Account
              UserAccountWidget(
                onTap: _showUserAccountMenu,
                size: 40,
              ),
              SizedBox(width: 12),
              // Logout Button
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: Colors.red.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: Colors.red.withOpacity(0.3),
                    width: 1,
                  ),
                ),
                child: IconButton(
                  onPressed: _logout,
                  icon: Icon(
                    Icons.logout,
                    color: Colors.white,
                    size: 20,
                  ),
                  tooltip: 'Logout',
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildWelcomeBanner(String message) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.2),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Icon(
            Icons.waving_hand,
            color: Colors.white,
            size: 24,
          ),
          SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: TextStyle(
                fontFamily: '.SF Pro Text',
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }



  void _showUserAccountMenu() {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        child: UserAccountMenu(
          onSignOut: () {
            Navigator.pop(context);
            _signOut();
          },
          onClose: () => Navigator.pop(context),
        ),
      ),
    );
  }

  void _signOut() async {
    await _authService.signOut();
    setState(() {}); // Refresh the UI
    _showSnackBar('Signed out successfully');
  }


  Widget _buildSmallGoogleSignIn(bool isWideScreen) {
    return InkWell(
      onTap: _signInWithGoogle,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.white.withOpacity(0.2), width: 1),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.login,
              color: Colors.white,
              size: 16,
            ),
            SizedBox(width: 8),
            Text(
              'Sign in with Google',
              style: TextStyle(
                fontFamily: '.SF Pro Text',
                fontSize: isWideScreen ? 14 : 12,
                color: Colors.white,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickJoinOptions(bool isWideScreen) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(isWideScreen ? 20 : 16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.15),
        borderRadius: BorderRadius.circular(isWideScreen ? 16 : 12),
        border: Border.all(color: Colors.white.withOpacity(0.3), width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Container(
                width: isWideScreen ? 40 : 32,
                height: isWideScreen ? 40 : 32,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(isWideScreen ? 20 : 16),
                  border: Border.all(color: Colors.white.withOpacity(0.4), width: 2),
                ),
                child: Icon(
                  Icons.qr_code_scanner,
                  color: Colors.white,
                  size: isWideScreen ? 20 : 16,
                ),
              ),
              SizedBox(width: isWideScreen ? 12 : 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Quick Join Options',
                      style: TextStyle(
                        fontFamily: '.SF Pro Display',
                        fontSize: isWideScreen ? 16 : 14,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                        letterSpacing: 0.3,
                      ),
                    ),
                    Text(
                      'Scan QR or enter PIN',
                      style: TextStyle(
                        fontFamily: '.SF Pro Text',
                        fontSize: isWideScreen ? 12 : 10,
                        color: Colors.white.withOpacity(0.8),
                        fontWeight: FontWeight.w400,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          
          SizedBox(height: isWideScreen ? 16 : 12),
          
          // Quick Join Buttons
          Row(
            children: [
              Expanded(
                child: SizedBox(
                  height: isWideScreen ? 48 : 40,
                  child: ElevatedButton.icon(
                    onPressed: _isLoading ? null : () {
                      print('🔘 Scan QR button tapped!');
                      _openQRScanner();
                    },
                    icon: Icon(Icons.qr_code_scanner, color: Colors.white, size: isWideScreen ? 20 : 16),
                    label: Text(
                      'Scan QR',
                      style: TextStyle(
                        fontFamily: '.SF Pro Text',
                        color: Colors.white,
                        fontSize: isWideScreen ? 14 : 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Color(0xFF34C759),
                      padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 4,
                    ),
                  ),
                ),
              ),
              SizedBox(width: 12),
              Expanded(
                child: SizedBox(
                  height: isWideScreen ? 48 : 40,
                  child: ElevatedButton.icon(
                    onPressed: _isLoading ? null : () {
                      print('🔘 Enter PIN button tapped!');
                      _showPinInput();
                    },
                    icon: Icon(Icons.pin, color: Colors.white, size: isWideScreen ? 20 : 16),
                    label: Text(
                      'Enter PIN',
                      style: TextStyle(
                        fontFamily: '.SF Pro Text',
                        color: Colors.white,
                        fontSize: isWideScreen ? 14 : 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Color(0xFF5856D6),
                      padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 4,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDebugTestButton(bool isWideScreen) {
    return InkWell(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => const PositioningTestWidget(),
          ),
        );
      },
      borderRadius: BorderRadius.circular(isWideScreen ? 12 : 10),
      child: Container(
        width: double.infinity,
        padding: EdgeInsets.all(isWideScreen ? 16 : 12),
        decoration: BoxDecoration(
          color: Colors.orange.withOpacity(0.2),
          borderRadius: BorderRadius.circular(isWideScreen ? 12 : 10),
          border: Border.all(color: Colors.orange.withOpacity(0.4), width: 1.5),
        ),
        child: Row(
          children: [
            Container(
              width: isWideScreen ? 40 : 32,
              height: isWideScreen ? 40 : 32,
              decoration: BoxDecoration(
                color: Colors.orange.withOpacity(0.3),
                borderRadius: BorderRadius.circular(isWideScreen ? 20 : 16),
                border: Border.all(color: Colors.orange.withOpacity(0.5), width: 1),
              ),
              child: Icon(
                Icons.bug_report,
                color: Colors.orange[700],
                size: isWideScreen ? 20 : 16,
              ),
            ),
            SizedBox(width: isWideScreen ? 12 : 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Debug Chord Positioning',
                    style: TextStyle(
                      fontFamily: '.SF Pro Display',
                      fontSize: isWideScreen ? 14 : 12,
                      fontWeight: FontWeight.bold,
                      color: Colors.orange[700],
                      letterSpacing: 0.3,
                    ),
                  ),
                  Text(
                    'Test positioning system',
                    style: TextStyle(
                      fontFamily: '.SF Pro Text',
                      fontSize: isWideScreen ? 10 : 8,
                      color: Colors.orange[600],
                      fontWeight: FontWeight.w400,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.arrow_forward_ios,
              color: Colors.orange[600],
              size: isWideScreen ? 14 : 12,
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _jamIdController.dispose();
    _jamIdFocusNode.dispose();
    super.dispose();
  }
}

