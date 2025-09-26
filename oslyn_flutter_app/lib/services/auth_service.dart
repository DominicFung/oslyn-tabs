import 'package:google_sign_in/google_sign_in.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AuthService {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  GoogleSignIn? _googleSignIn;

  String? _currentUserId;
  String? _currentUserEmail;
  String? _currentUserName;
  bool _isFirstTimeUser = false;

  // Getters
  String? get currentUserId => _currentUserId;
  String? get currentUserEmail => _currentUserEmail;
  String? get currentUserName => _currentUserName;
  bool get isLoggedIn => _currentUserId != null;
  bool get isFirstTimeUser => _isFirstTimeUser;
  bool isAuthenticated() => _currentUserId != null;

  // Setters for manual authentication
  void setUserInfo(String userId, String? email, String? username) {
    _currentUserId = userId;
    _currentUserEmail = email;
    _currentUserName = username;
    _isFirstTimeUser = false;
    print('🔐 AuthService user info updated: $userId');
  }

  /// Initialize authentication service
  Future<void> initialize() async {
    try {
      // For Android, GoogleSignIn automatically reads from google-services.json
      // For web, we need to specify the client ID
      _googleSignIn = GoogleSignIn(
        scopes: ['email', 'profile'],
      );
      print('🔐 Initialized Google Sign-In for Android (using google-services.json)');

      // Check if user is already signed in
      final prefs = await SharedPreferences.getInstance();
      _currentUserId = prefs.getString('user_id');
      _currentUserEmail = prefs.getString('user_email');
      _currentUserName = prefs.getString('user_name');
      
      // Check if this is a first-time user
      _isFirstTimeUser = !prefs.containsKey('user_has_logged_in_before');

      print('🔐 Auth Service initialized');
      print('   - User ID: $_currentUserId');
      print('   - Email: $_currentUserEmail');
      print('   - Name: $_currentUserName');
      print('   - First time user: $_isFirstTimeUser');
    } catch (e) {
      print('❌ Error initializing auth service: $e');
      print('⚠️  Google Sign-In will not work without proper configuration');
      // Initialize without Google Sign-In to prevent errors
      _googleSignIn = null;
    }
  }

  /// Sign in with Google
  Future<bool> signInWithGoogle() async {
    try {
      print('🔐 Starting Google Sign-In...');
      
      if (_googleSignIn == null) {
        print('❌ Google Sign-In not configured. Please set up Google Client ID.');
        return false;
      }
      
      // Sign in with Google
      final GoogleSignInAccount? googleUser = await _googleSignIn!.signIn();
      if (googleUser == null) {
        print('❌ Google Sign-In cancelled by user');
        return false;
      }

      print('✅ Google Sign-In successful');
      print('   - Email: ${googleUser.email}');
      print('   - Name: ${googleUser.displayName}');
      print('   - ID: ${googleUser.id}');

      // Store user information
      _currentUserId = googleUser.id;
      _currentUserEmail = googleUser.email;
      _currentUserName = googleUser.displayName;

      // Save to SharedPreferences
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('user_id', _currentUserId!);
      await prefs.setString('user_email', _currentUserEmail!);
      await prefs.setString('user_name', _currentUserName!);
      
      // Mark that user has logged in before
      await prefs.setBool('user_has_logged_in_before', true);
      _isFirstTimeUser = false;

      print('✅ User information saved locally');
      return true;
    } catch (e) {
      print('❌ Error signing in with Google: $e');
      return false;
    }
  }

  /// Sign out
  Future<void> signOut() async {
    try {
      print('🔐 Signing out...');
      
      // Sign out from Google
      if (_googleSignIn != null) {
        await _googleSignIn!.signOut();
      }
      
      // Clear local data
      _currentUserId = null;
      _currentUserEmail = null;
      _currentUserName = null;

      // Clear SharedPreferences
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('user_id');
      await prefs.remove('user_email');
      await prefs.remove('user_name');
      // Note: We don't remove 'user_has_logged_in_before' to maintain first-time status

      print('✅ Sign out successful');
    } catch (e) {
      print('❌ Error signing out: $e');
    }
  }

  /// Get user display name for UI
  String getUserDisplayName() {
    if (_currentUserName != null && _currentUserName!.isNotEmpty) {
      return _currentUserName!;
    } else if (_currentUserEmail != null && _currentUserEmail!.isNotEmpty) {
      // Extract username from email if available
      final emailParts = _currentUserEmail!.split('@');
      return emailParts.isNotEmpty ? emailParts[0] : 'User';
    } else {
      return 'User';
    }
  }

  /// Get welcome message for user
  String getWelcomeMessage() {
    if (!isAuthenticated()) return '';
    
    final userName = getUserDisplayName();
    if (_isFirstTimeUser) {
      return 'Welcome, $userName!';
    } else {
      return 'Welcome back, $userName!';
    }
  }

  /// Get user avatar initials
  String getUserInitials() {
    if (!isAuthenticated()) return 'G';
    
    final name = getUserDisplayName();
    final words = name.split(' ');
    if (words.length >= 2) {
      return '${words[0][0]}${words[1][0]}'.toUpperCase();
    } else if (words.isNotEmpty) {
      return words[0][0].toUpperCase();
    }
    return 'U';
  }
}
