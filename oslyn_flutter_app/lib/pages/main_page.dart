import 'package:flutter/material.dart';
import 'dart:ui';
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
  final FocusNode _jamIdFocusNode = FocusNode();
  final AuthService _authService = AuthService();
  final JamService _jamService = JamService();
  bool _isLoading = false;
  List<JamSession> _userJamSessions = [];
  bool _isLoadingJamSessions = false;

  @override
  void initState() {
    super.initState();
    _authService.initialize();
    _loadUserJamSessions();
  }

  Future<void> _loadUserJamSessions() async {
    if (!_authService.isAuthenticated()) return;
    
    setState(() {
      _isLoadingJamSessions = true;
    });

    try {
      final sessions = await _jamService.getPublicJamSessions(limit: 10);
      setState(() {
        _userJamSessions = sessions;
        _isLoadingJamSessions = false;
      });
    } catch (e) {
      print('Error loading jam sessions: $e');
      setState(() {
        _isLoadingJamSessions = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isAuthenticated = _authService.isAuthenticated();
    final welcomeMessage = _authService.getWelcomeMessage();
    
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
                if (isAuthenticated) _buildTopBar(),
                
                // Welcome Message for Authenticated Users
                if (isAuthenticated && welcomeMessage.isNotEmpty) ...[
                  _buildWelcomeBanner(welcomeMessage),
                  SizedBox(height: 20),
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
                              if (!isAuthenticated)
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
                              if (!isAuthenticated)
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
                                  onTap: _showEnterJamOptions,
                                  isCompact: !isWideScreen,
                                ),
                                
                                SizedBox(height: isWideScreen ? 20 : 16),
                                
                // Option 2: Quick Join Options
            _buildQuickJoinOptions(isWideScreen),
            
            SizedBox(height: isWideScreen ? 20 : 16),
            
            // Debug Test Button (only in debug mode)
            if (isAuthenticated)
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
                if (isAuthenticated)
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
      JamSession? jamSession;
      String? actualJamSessionId;
      
      if (sanitizedInput.length == 6) {
        // It's a PIN - look up the jam session by PIN
        print('🔑 Input is a PIN, looking up jam session...');
        jamSession = await _jamService.getJamSessionByPin(sanitizedInput);
        if (jamSession != null) {
          actualJamSessionId = jamSession.jamSessionId;
        }
      } else {
        // It's a jam session ID - look up directly
        print('🆔 Input is a jam session ID, looking up directly...');
        jamSession = await _jamService.getJamSession(sanitizedInput);
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
      final success = await _authService.signInWithGoogle();
      if (success) {
        _showSnackBar('Successfully signed in!');
        // Load jam sessions for the newly signed-in user
        await _loadUserJamSessions();
      } else {
        _showSnackBar('Sign in failed. Please try again.');
      }
    } catch (e) {
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
          // User Account
          UserAccountWidget(
            onTap: _showUserAccountMenu,
            size: 40,
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


  Widget _buildJamSessionsList({bool isCompact = false}) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(isCompact ? 16 : 24),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.15),
        borderRadius: BorderRadius.circular(isCompact ? 12 : 16),
        border: Border.all(color: Colors.white.withOpacity(0.3), width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
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
                  Icons.music_note,
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
                      'Your Jam Sessions',
                      style: TextStyle(
                        fontFamily: '.SF Pro Display',
                        fontSize: isCompact ? 16 : 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                        letterSpacing: 0.3,
                      ),
                    ),
                    Text(
                      'Access your music sessions',
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
              IconButton(
                onPressed: _loadUserJamSessions,
                icon: Icon(
                  Icons.refresh,
                  color: Colors.white.withOpacity(0.7),
                  size: isCompact ? 16 : 18,
                ),
                tooltip: 'Refresh',
              ),
            ],
          ),
          
          SizedBox(height: isCompact ? 16 : 20),
          
          // Jam Sessions List
          if (_isLoadingJamSessions)
            Center(
              child: Padding(
                padding: EdgeInsets.all(20),
                child: CircularProgressIndicator(
                  color: Colors.white,
                  strokeWidth: 2,
                ),
              ),
            )
          else if (_userJamSessions.isEmpty)
            Container(
              width: double.infinity,
              padding: EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white.withOpacity(0.2), width: 1),
              ),
              child: Column(
                children: [
                  Icon(
                    Icons.music_off,
                    color: Colors.white.withOpacity(0.6),
                    size: 32,
                  ),
                  SizedBox(height: 12),
                  Text(
                    'No jam sessions yet',
                    style: TextStyle(
                      fontFamily: '.SF Pro Text',
                      fontSize: 14,
                      color: Colors.white.withOpacity(0.8),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'Create or join a session to get started',
                    style: TextStyle(
                      fontFamily: '.SF Pro Text',
                      fontSize: 12,
                      color: Colors.white.withOpacity(0.6),
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            )
          else
            Column(
              children: _userJamSessions.take(3).map((session) {
                return Container(
                  margin: EdgeInsets.only(bottom: isCompact ? 8 : 12),
                  child: InkWell(
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => SongCardPage(
                            jamSessionId: session.jamSessionId,
                            initialDescription: session.description ?? '',
                          ),
                        ),
                      );
                    },
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      padding: EdgeInsets.all(isCompact ? 12 : 16),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.white.withOpacity(0.2), width: 1),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: isCompact ? 32 : 40,
                            height: isCompact ? 32 : 40,
                            decoration: BoxDecoration(
                              color: Color(0xFF007AFF).withOpacity(0.8),
                              borderRadius: BorderRadius.circular(isCompact ? 16 : 20),
                            ),
                            child: Icon(
                              Icons.play_arrow,
                              color: Colors.white,
                              size: isCompact ? 16 : 20,
                            ),
                          ),
                          SizedBox(width: isCompact ? 12 : 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  session.description?.isNotEmpty == true 
                                    ? session.description!
                                    : 'Jam Session ${session.jamSessionId.substring(0, 8)}...',
                                  style: TextStyle(
                                    fontFamily: '.SF Pro Text',
                                    fontSize: isCompact ? 12 : 14,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.white,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                SizedBox(height: 2),
                                Text(
                                  '${session.active.length} active • ${session.admins.length} admins',
                                  style: TextStyle(
                                    fontFamily: '.SF Pro Text',
                                    fontSize: isCompact ? 10 : 12,
                                    color: Colors.white.withOpacity(0.7),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Icon(
                            Icons.arrow_forward_ios,
                            color: Colors.white.withOpacity(0.5),
                            size: isCompact ? 12 : 14,
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          
          if (_userJamSessions.length > 3) ...[
            SizedBox(height: isCompact ? 8 : 12),
            Center(
              child: Text(
                '+${_userJamSessions.length - 3} more sessions',
                style: TextStyle(
                  fontFamily: '.SF Pro Text',
                  fontSize: isCompact ? 10 : 12,
                  color: Colors.white.withOpacity(0.6),
                  fontStyle: FontStyle.italic,
                ),
              ),
            ),
          ],
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
                    onPressed: _isLoading ? null : _openQRScanner,
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
                    onPressed: _isLoading ? null : _showPinInput,
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
