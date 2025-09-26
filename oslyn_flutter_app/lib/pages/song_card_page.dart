import 'dart:async';
import 'dart:convert';
import 'dart:math' as math;
import 'dart:ui';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:amplify_flutter/amplify_flutter.dart';
import 'package:amplify_api/amplify_api.dart';
import '../services/jam_service.dart';
import '../models/jam_session.dart';
import '../widgets/slides_widget.dart';
import '../widgets/section_sidebar.dart';
import '../widgets/left_navigation_sidebar.dart';
import '../widgets/key_selector_widget.dart';
import '../widgets/queue_management.dart';
import '../widgets/user_account_interface.dart';
import '../services/auth_service.dart';
import '../core/oslyn_engine.dart';
import '../graphql/subscriptions.dart';
import 'main_page.dart';
import '../widgets/qr_generator_widget.dart';
import '../utils/font_utils.dart';
import '../widgets/background/background.dart';

// Platform detection utility
class PlatformUtils {
  static bool get isWeb => kIsWeb;
  static bool get isMobile => !kIsWeb && (defaultTargetPlatform == TargetPlatform.android || defaultTargetPlatform == TargetPlatform.iOS);
  static bool get isDesktop => !kIsWeb && (defaultTargetPlatform == TargetPlatform.windows || defaultTargetPlatform == TargetPlatform.macOS || defaultTargetPlatform == TargetPlatform.linux);
}

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

class _SongCardPageState extends State<SongCardPage> with TickerProviderStateMixin {
  JamSession? jamSession;
  List<Song>? songs;
  bool isLoading = true;
  String? errorMessage;
  late JamService _jamService;
  int _currentPage = 0;
  String _textSize = 'text-base';
  bool _isLastPage = false;
  bool _isFirstPage = true;
  int _currentSongIndex = 0;
  bool _showDebug = false;
  final FocusNode _focusNode = FocusNode();
  bool _showSidebar = true;
  SidebarPosition _sidebarPosition = SidebarPosition.right;
  bool _showLeftNavigationSidebar = false;
  
  // Resizable containers state
  double _leftContainerWidthRatio = 0.33; // Start with 1/3 width
  bool _isDragging = false;
  bool _isHoveringDivider = false;
  
  // Key management
  String? _currentKey;
  int _capo = 0; // Capo fret number (0-12)
  
  // Synchronization state
  bool _isSyncingPage = false;
  bool _isSyncingSong = false;
  bool _isSyncingKey = false;
  String? _syncError;
  
  // Compact mode tracking
  bool _isSlidesInCompactMode = false;
  
  // Reference to SlidesWidget for line navigation
  final GlobalKey<SlidesWidgetState> _slidesWidgetKey = GlobalKey<SlidesWidgetState>();
  
  // Subscription management
  StreamSubscription<GraphQLResponse<String>>? _songSubscription;
  StreamSubscription<GraphQLResponse<String>>? _keySubscription;
  StreamSubscription<GraphQLResponse<String>>? _pageSubscription;
  StreamSubscription<GraphQLResponse<String>>? _queueSubscription;
  
  // Fade-out state and logic
  Timer? _fadeTimer;
  static const Duration _fadeDuration = Duration(seconds: 2);
  
  
  // Queue management slide animation
  late AnimationController _queueManagementAnimationController;
  late Animation<Offset> _queueManagementSlideAnimation;
  
  // Settings slide animation
  late AnimationController _settingsAnimationController;
  late Animation<Offset> _settingsSlideAnimation;
  
  // Key selector slide animation
  late AnimationController _keySelectorAnimationController;
  late Animation<Offset> _keySelectorSlideAnimation;
  
  // Text size slide animation
  late AnimationController _textSizeAnimationController;
  late Animation<Offset> _textSizeSlideAnimation;
  
  // QR Code slide animation
  late AnimationController _qrCodeAnimationController;
  late Animation<Offset> _qrCodeSlideAnimation;
  
  // Left container width animation
  late AnimationController _leftContainerWidthAnimationController;
  late Animation<double> _leftContainerWidthAnimation;
  
  // Container W layout animation
  late AnimationController _containerWLayoutAnimationController;
  late Animation<double> _containerWLayoutAnimation;
  
  // Container W slide animation (for collapsed state)
  late AnimationController _containerWSlideAnimationController;
  
  
  
  // Debug option to show/hide all container outlines
  bool _showContainerOutlines = true;
  
  // Queue management overlay state
  bool _showQueueManagementOverlay = false;
  
  // Settings overlay state
  bool _showSettingsOverlay = false;
  
  // Exit flag to prevent further operations
  bool _isExiting = false;
  
  // Account overlay state
  bool _showAccountOverlay = false;
  
  // Overlay position toggle (true = right side, false = left side)
  bool _overlayOnRightSide = false;
  
  // Key selector overlay state
  bool _showKeySelectorOverlay = false;
  
  // Capo selector overlay state
  bool _showCapoSelectorOverlay = false;
  
  // Key selector transpose toggle state
  bool _keySelectorSyncWithAllUsers = true;
  
  // Text size overlay state
  bool _showTextSizeOverlay = false;
  
  // QR Code overlay state
  bool _showQRCodeOverlay = false;
  
  // Left container collapsed state
  bool _isLeftContainerCollapsed = false; // Start with sidebar open by default
  
  // Fixed slider state - when true, slider is fixed at 1/10 width and Container W is hidden
  bool _isSliderFixed = false;
  
  
  // Toggle container outlines for debugging
  void _toggleContainerOutlines() {
    setState(() {
      _showContainerOutlines = !_showContainerOutlines;
    });
  }

  void _toggleSliderFix() {
    setState(() {
      _isSliderFixed = !_isSliderFixed;
      print('🔧 ULTRA COLLAPSED: Toggled ultra collapsed view to $_isSliderFixed');
      
      if (_isSliderFixed) {
        // Set slider to 1/10 width and animate blue container out
        _leftContainerWidthRatio = 0.1;
        _leftContainerWidthAnimationController.value = 0.1;
        // Animate blue container (Apple widgets) out of view
        _containerWSlideAnimationController.forward();
        print('🔧 ULTRA COLLAPSED: Set slider to 1/10 width and animating blue container out');
      } else {
        // Reset to default ratio and bring blue container back
        _leftContainerWidthRatio = 0.33;
        _leftContainerWidthAnimationController.value = 0.33;
        // Reset slide animation to show blue container at full height
        _containerWSlideAnimationController.reset();
        print('🔧 ULTRA COLLAPSED: Reset slider to default ratio and showing blue container at full height');
      }
    });
  }
  
  // Helper method to get outline decoration
  BoxDecoration? _getOutlineDecoration(Color color, {double width = 2.0}) {
    if (!_showContainerOutlines) return null;
    return BoxDecoration(
      border: Border.all(color: color, width: width),
    );
  }
  
  
  // Guest user state
  String? _guestName;
  bool _hasShownNamePopup = false;

  // Quiet noisy per-build logs; toggle to true if needed locally
  static const bool _logSongSelectionInBuild = false;

  void _showGuestNamePopup() {
    if (_hasShownNamePopup) return;
    
    _hasShownNamePopup = true;
    final TextEditingController nameController = TextEditingController();
    
    // Helper method for skip functionality
    void handleSkip() {
      Navigator.of(context).pop();
      setState(() {});
    }
    
    showDialog(
      context: context,
      barrierDismissible: true, // Allow dismissing by tapping outside
      builder: (BuildContext context) {
        final screenSize = MediaQuery.of(context).size;
        final isSmallScreen = screenSize.width < 400 || screenSize.height < 600;
        final isVerySmallScreen = screenSize.width < 350 || screenSize.height < 500;
        
        return PopScope(
          canPop: true,
          onPopInvokedWithResult: (didPop, result) {
            if (didPop) {
              // Handle when dialog is dismissed (click away or back button)
              // Only call setState, don't pop again since dialog is already being popped
              setState(() {});
            }
          },
          child: KeyboardListener(
            focusNode: FocusNode(),
            onKeyEvent: (KeyEvent event) {
              if (event is KeyDownEvent && event.logicalKey == LogicalKeyboardKey.escape) {
                // Handle escape key
                handleSkip();
              }
            },
            child: Dialog(
              backgroundColor: Colors.transparent,
              child: Container(
                constraints: BoxConstraints(
                  maxWidth: isVerySmallScreen ? screenSize.width * 0.95 : 400,
                  maxHeight: screenSize.height * 0.8,
                ),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(isSmallScreen ? 16 : 20),
                  border: Border.all(color: Colors.white.withOpacity(0.2), width: 1.5),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(isSmallScreen ? 16 : 20),
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                    child: Padding(
                      padding: EdgeInsets.all(isSmallScreen ? 16 : 24),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          // Header
                          Row(
                            children: [
                              Icon(
                                Icons.person_add, 
                                color: Colors.purple[700],
                                size: isSmallScreen ? 20 : 24,
                              ),
                              SizedBox(width: isSmallScreen ? 6 : 8),
                              Text(
                                'Join Jam Session',
                                style: FontUtils.sfPro(
                                  fontSize: isSmallScreen ? 18 : 20,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.white,
                                ),
                              ),
                            ],
                          ),
                          SizedBox(height: isSmallScreen ? 12 : 16),
                          
                          // Content
                          Text(
                            'Welcome to the jam session! Please enter your name to participate.',
                            style: FontUtils.sfPro(
                              fontSize: isSmallScreen ? 14 : 16,
                              color: Colors.white,
                            ),
                            textAlign: TextAlign.center,
                          ),
                          SizedBox(height: isSmallScreen ? 8 : 12),
                          
                          // Info box
                          Container(
                            padding: EdgeInsets.all(isSmallScreen ? 8 : 12),
                            decoration: BoxDecoration(
                              color: Colors.orange.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(isSmallScreen ? 6 : 8),
                              border: Border.all(color: Colors.orange.withOpacity(0.3)),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  Icons.info_outline, 
                                  color: Colors.orange[700], 
                                  size: isSmallScreen ? 16 : 20,
                                ),
                                SizedBox(width: isSmallScreen ? 6 : 8),
                                Expanded(
                                  child: Text(
                                    'You\'re viewing this jam session as a guest. Sign in to add songs and manage the queue.',
                                    style: TextStyle(
                                      color: Colors.orange[700],
                                      fontSize: isSmallScreen ? 12 : 14,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          SizedBox(height: isSmallScreen ? 12 : 16),
                          
                          // Text field
                          TextField(
                            controller: nameController,
                            style: TextStyle(
                              fontSize: isSmallScreen ? 14 : 16,
                              color: Colors.white,
                            ),
                            decoration: InputDecoration(
                              labelText: 'Your Name',
                              hintText: 'Enter your name',
                              labelStyle: TextStyle(
                                color: Colors.white70,
                                fontSize: isSmallScreen ? 12 : 14,
                              ),
                              hintStyle: TextStyle(
                                color: Colors.white60,
                                fontSize: isSmallScreen ? 14 : 16,
                              ),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(isSmallScreen ? 6 : 8),
                                borderSide: BorderSide(color: Colors.white.withOpacity(0.3)),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(isSmallScreen ? 6 : 8),
                                borderSide: BorderSide(color: Colors.white.withOpacity(0.3)),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(isSmallScreen ? 6 : 8),
                                borderSide: BorderSide(color: Colors.purple[700]!, width: 2),
                              ),
                              filled: true,
                              fillColor: Colors.white.withOpacity(0.1),
                              prefixIcon: Icon(
                                Icons.person,
                                color: Colors.white70,
                                size: isSmallScreen ? 18 : 20,
                              ),
                            ),
                            autofocus: true,
                            textCapitalization: TextCapitalization.words,
                          ),
                          SizedBox(height: isSmallScreen ? 16 : 20),
                          
                          // Buttons
                          Row(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              TextButton(
                                onPressed: handleSkip,
                                style: TextButton.styleFrom(
                                  padding: EdgeInsets.symmetric(
                                    horizontal: isSmallScreen ? 12 : 16,
                                    vertical: isSmallScreen ? 8 : 12,
                                  ),
                                ),
                                child: Text(
                                  'Skip',
                                  style: TextStyle(
                                    fontSize: isSmallScreen ? 14 : 16,
                                    color: Colors.white70,
                                  ),
                                ),
                              ),
                              SizedBox(width: isSmallScreen ? 8 : 12),
                              ElevatedButton(
                                onPressed: () {
                                  final name = nameController.text.trim();
                                  if (name.isNotEmpty) {
                                    _guestName = name;
                                    Navigator.of(context).pop();
                                    setState(() {});
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text('Welcome, $name!'),
                                        backgroundColor: Colors.green[600],
                                        duration: const Duration(seconds: 2),
                                      ),
                                    );
                                  } else {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                        content: Text('Please enter your name or skip'),
                                        backgroundColor: Colors.orange,
                                      ),
                                    );
                                  }
                                },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.purple[700],
                                  foregroundColor: Colors.white,
                                  padding: EdgeInsets.symmetric(
                                    horizontal: isSmallScreen ? 16 : 20,
                                    vertical: isSmallScreen ? 8 : 12,
                                  ),
                                ),
                                child: Text(
                                  'Join',
                                  style: TextStyle(
                                    fontSize: isSmallScreen ? 14 : 16,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
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

  @override
  void initState() {
    super.initState();
    _jamService = JamService();
    print('🔍 SONG CARD INIT: _currentSongIndex = $_currentSongIndex');
    
    
    // Initialize queue management slide animation
    _queueManagementAnimationController = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );
    _queueManagementSlideAnimation = Tween<Offset>(
      begin: const Offset(0.0, 1.0), // Start from bottom
      end: Offset.zero, // End at normal position
    ).animate(CurvedAnimation(
      parent: _queueManagementAnimationController,
      curve: Curves.fastOutSlowIn,
    ));
    
    // Initialize settings slide animation
    _settingsAnimationController = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );
    _settingsSlideAnimation = Tween<Offset>(
      begin: const Offset(0.0, 1.0), // Start from bottom
      end: Offset.zero, // End at normal position
    ).animate(CurvedAnimation(
      parent: _settingsAnimationController,
      curve: Curves.fastOutSlowIn,
    ));
    
    // Initialize key selector slide animation
    _keySelectorAnimationController = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );
    _keySelectorSlideAnimation = Tween<Offset>(
      begin: const Offset(0.0, 1.0), // Start from bottom
      end: Offset.zero, // End at normal position
    ).animate(CurvedAnimation(
      parent: _keySelectorAnimationController,
      curve: Curves.fastOutSlowIn,
    ));
    
    // Initialize text size slide animation
    _textSizeAnimationController = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );
    _textSizeSlideAnimation = Tween<Offset>(
      begin: const Offset(0.0, 1.0), // Start from bottom
      end: Offset.zero, // End at normal position
    ).animate(CurvedAnimation(
      parent: _textSizeAnimationController,
      curve: Curves.fastOutSlowIn,
    ));
    
    // Initialize QR Code slide animation
    _qrCodeAnimationController = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );
    _qrCodeSlideAnimation = Tween<Offset>(
      begin: const Offset(0.0, 1.0), // Start from bottom
      end: Offset.zero, // End at normal position
    ).animate(CurvedAnimation(
      parent: _qrCodeAnimationController,
      curve: Curves.fastOutSlowIn,
    ));
    
    // Initialize left container width animation
    _leftContainerWidthAnimationController = AnimationController(
      duration: const Duration(milliseconds: 250),
      vsync: this,
    );
    _leftContainerWidthAnimation = Tween<double>(
      begin: 0.2, // Collapsed width (1/5)
      end: _leftContainerWidthRatio, // Expanded width (current ratio)
    ).animate(CurvedAnimation(
      parent: _leftContainerWidthAnimationController,
      curve: Curves.fastOutSlowIn,
    ));
    
    // Start in expanded state (forward position)
    _leftContainerWidthAnimationController.value = 1.0;
    
    // Initialize Container W layout animation
    _containerWLayoutAnimationController = AnimationController(
      duration: const Duration(milliseconds: 250),
      vsync: this,
    );
    _containerWLayoutAnimation = Tween<double>(
      begin: 0.0, // Collapsed state (vertical layout)
      end: 1.0,   // Expanded state (horizontal layout)
    ).animate(CurvedAnimation(
      parent: _containerWLayoutAnimationController,
      curve: Curves.fastOutSlowIn,
    ));
    
    // Start in expanded state (horizontal layout)
    print('🎬 ANIMATION INIT: Setting Container W layout to expanded state (1.0)');
    _containerWLayoutAnimationController.value = 1.0;
    
    // Initialize Container W slide animation (for collapsed state)
    _containerWSlideAnimationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    
    print('🎬 ANIMATION INIT: All animation controllers initialized (simplified single-container approach)');
    print('   - Left container width: ${_leftContainerWidthAnimationController.value}');
    print('   - Container W layout: ${_containerWLayoutAnimationController.value}');
    print('   - Container W slide: ${_containerWSlideAnimationController.value}');
    print('   - Note: Transitional view removed - using single container with height animation');
    
    _loadJamSession();
    _startSongSubscription();
    _startKeySubscription();
    _startPageSubscription();
    _startQueueSubscription();
    
    // Start the initial fade timer
    _startFadeTimer();
  }

  Widget _buildAppleWidget({
    required IconData icon,
    required String label,
    required bool isActive,
    required VoidCallback onTap,
    BuildContext? context,
  }) {
    // Get screen height for responsive sizing
    final screenHeight = MediaQuery.of(context ?? this.context).size.height;
    final isSmallHeight = screenHeight < 600;
    
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: EdgeInsets.symmetric(
          horizontal: isSmallHeight ? 8 : 12, 
          vertical: isSmallHeight ? 6 : 8,
        ),
        decoration: BoxDecoration(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isActive 
              ? Colors.green
              : Colors.white.withOpacity(0.3),
            width: isActive ? 2 : 1,
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              color: Colors.white.withOpacity(0.8),
              size: isSmallHeight ? 16 : 20,
            ),
            if (!isSmallHeight) SizedBox(height: 4),
            if (!isSmallHeight) Text(
              label,
              style: TextStyle(
                color: Colors.white.withOpacity(0.8),
                fontSize: 10,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCollapseButton() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: Colors.white.withOpacity(0.2),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ).copyWith(
        // Add debug outline if enabled
        border: _showContainerOutlines 
          ? Border.all(color: Colors.pink, width: 2)
          : Border.all(
              color: Colors.white.withOpacity(0.2),
              width: 1,
            ),
      ),
      child: IconButton(
        onPressed: () {
          setState(() {
            _isLeftContainerCollapsed = !_isLeftContainerCollapsed;
            print('🎬 ANIMATION TOGGLE: Container collapsed state changed to $_isLeftContainerCollapsed');
            
            if (_isLeftContainerCollapsed) {
              // Collapse: animate from current ratio to 1/5 and switch to vertical layout
              print('🎬 ANIMATION COLLAPSE: Starting collapse animation (simplified single-container)');
              print('   - Reversing left container width animation');
              print('   - Reversing container W layout animation');
              print('   - Starting container W height slide animation');
              _leftContainerWidthAnimationController.reverse();
              _containerWLayoutAnimationController.reverse();
              // Start slide animation for Container W
              _containerWSlideAnimationController.forward();
            } else {
              // Expand: animate from 1/5 to current ratio and switch to horizontal layout
              print('🎬 ANIMATION EXPAND: Starting expand animation (simplified single-container)');
              print('   - Forwarding left container width animation');
              print('   - Forwarding container W layout animation');
              print('   - Resetting container W height slide animation');
              _leftContainerWidthAnimationController.forward();
              _containerWLayoutAnimationController.forward();
              // Reset slide animation
              _containerWSlideAnimationController.reset();
            }
          });
        },
        icon: _buildPullTabIcon(),
        tooltip: _isLeftContainerCollapsed ? 'Expand left panel' : 'Collapse left panel',
        padding: const EdgeInsets.all(8),
        constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
      ),
    );
  }

  Widget _buildPullTabIcon() {
    return Icon(
      Icons.drag_handle,
      color: Colors.white,
      size: 20,
    );
  }

  Widget _buildFixSliderButton() {
    return Container(
      decoration: BoxDecoration(
        color: _isSliderFixed ? Colors.orange.withOpacity(0.2) : Colors.white.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: _isSliderFixed ? Colors.orange.withOpacity(0.5) : Colors.white.withOpacity(0.2),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ).copyWith(
        // Add debug outline if enabled
        border: _showContainerOutlines 
          ? Border.all(color: Colors.cyan, width: 2)
          : Border.all(
              color: _isSliderFixed ? Colors.orange.withOpacity(0.5) : Colors.white.withOpacity(0.2),
              width: 1,
            ),
      ),
      child: IconButton(
        onPressed: _toggleSliderFix,
        icon: Icon(
          _isSliderFixed ? Icons.lock : Icons.lock_open,
          color: _isSliderFixed ? Colors.orange : Colors.white,
          size: 20,
        ),
        tooltip: _isSliderFixed ? 'Exit ultra collapsed view (show Apple widgets)' : 'Enter ultra collapsed view (hide Apple widgets)',
        padding: const EdgeInsets.all(8),
        constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
      ),
    );
  }

  Widget _buildAnimatedContainerW(double tinySpacing, double smallSpacing, double mediumSpacing, double largeSpacing, double extraLargeSpacing, double spacingScaleFactor, Function calculateDynamicSpacing, {bool isCollapsed = false}) {
    return AnimatedBuilder(
      animation: _containerWLayoutAnimation,
      builder: (context, child) {
        // Interpolate between vertical (0.0) and horizontal (1.0) layouts
        final isHorizontal = _containerWLayoutAnimation.value > 0.5;
        print('🎬 ANIMATION BUILD: Container W layout animation value: ${_containerWLayoutAnimation.value}, isHorizontal: $isHorizontal');
        
        // Calculate screen size variables
        final screenWidth = MediaQuery.of(context).size.width;
        final isSmallScreen = screenWidth < 600;
        final isMediumScreen = screenWidth >= 600 && screenWidth < 900;
        
        if (isHorizontal) {
          // Horizontal layout (expanded state)
          print('🎬 ANIMATION LAYOUT: Building horizontal layout (expanded state)');
          return Container(
            margin: EdgeInsets.fromLTRB(
              (isSmallScreen ? 8 : isMediumScreen ? 10 : 12) * spacingScaleFactor,
              (isSmallScreen ? 8 : isMediumScreen ? 10 : 12) * spacingScaleFactor, // Consistent top margin
              (isSmallScreen ? 8 : isMediumScreen ? 10 : 12) * spacingScaleFactor,
              (isSmallScreen ? 8 : isMediumScreen ? 10 : 12) * spacingScaleFactor,
            ),
            padding: EdgeInsets.symmetric(
              horizontal: 16 * spacingScaleFactor,
              vertical: 12 * spacingScaleFactor,
            ),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.1),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white.withOpacity(0.2), width: 1),
            ).copyWith(
              // Add debug outline if enabled
              border: _showContainerOutlines 
                ? Border.all(color: Colors.cyan, width: 2)
                : Border.all(color: Colors.white.withOpacity(0.2), width: 1),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                // Settings button
                _buildAppleWidget(
                  icon: Icons.settings,
                  label: 'Settings',
                  isActive: _showSettingsOverlay,
                  onTap: () {
                    print('🔘 Settings button tapped! _showSettingsOverlay: $_showSettingsOverlay');
                    if (_showSettingsOverlay) {
                      _closeSettingsOverlay();
                    } else {
                      _closeAllSelectors();
                      _switchToSettingsOverlay();
                    }
                  },
                ),
                // Queue management button
                _buildAppleWidget(
                  icon: Icons.queue_music,
                  label: 'Queue',
                  isActive: _showQueueManagementOverlay,
                  onTap: () {
                    if (_showQueueManagementOverlay) {
                      _closeQueueManagementOverlay();
                    } else {
                      _closeAllSelectors();
                      _switchToQueueOverlay();
                    }
                  },
                ),
                // Sidebar toggle button
                _buildAppleWidget(
                  icon: _showSidebar ? Icons.view_list : Icons.view_list_outlined,
                  label: 'Sidebar',
                  isActive: _showSidebar,
                  onTap: () {
                    _closeAllSelectors();
                    setState(() {
                      _showSidebar = !_showSidebar;
                    });
                  },
                ),
                // Account button
                _buildAppleWidget(
                  icon: Icons.person,
                  label: 'Account',
                  isActive: _showAccountOverlay,
                  onTap: () {
                    if (_showAccountOverlay) {
                      _closeAccountOverlay();
                    } else {
                      _closeAllSelectors();
                      _switchToAccountOverlay();
                    }
                  },
                ),
              ],
            ),
          );
        } else {
          // Vertical layout (collapsed state)
          print('🎬 ANIMATION LAYOUT: Building vertical layout (collapsed state)');
          return Row(
            children: [
              // Container W - vertical layout
              Expanded(
                flex: 1,
                child: Container(
                  margin: const EdgeInsets.all(8),
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.white.withOpacity(0.2), width: 1),
                  ).copyWith(
                    // Add debug outline if enabled
                    border: _showContainerOutlines 
                      ? Border.all(color: Colors.cyan, width: 2)
                      : Border.all(color: Colors.white.withOpacity(0.2), width: 1),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      // Settings button
                      _buildVerticalAppleWidget(
                        icon: Icons.settings,
                        label: 'Settings',
                        isActive: _showSettingsOverlay,
                        onTap: () {
                          print('🔘 Settings button tapped (vertical)! _showSettingsOverlay: $_showSettingsOverlay');
                          if (_showSettingsOverlay) {
                            _closeSettingsOverlay();
                          } else {
                            _closeAllSelectors();
                            _switchToSettingsOverlay();
                          }
                        },
                      ),
                      // Queue management button
                      _buildVerticalAppleWidget(
                        icon: Icons.queue_music,
                        label: 'Queue',
                        isActive: _showQueueManagementOverlay,
                        onTap: () {
                          if (_showQueueManagementOverlay) {
                            _closeQueueManagementOverlay();
                          } else {
                            _closeAllSelectors();
                            _switchToQueueOverlay();
                          }
                        },
                      ),
                      // Sidebar toggle button
                      _buildVerticalAppleWidget(
                        icon: _showSidebar ? Icons.view_list : Icons.view_list_outlined,
                        label: 'Sidebar',
                        isActive: _showSidebar,
                        onTap: () {
                          _closeAllSelectors();
                          setState(() {
                            _showSidebar = !_showSidebar;
                          });
                        },
                      ),
                      // Account button
                      _buildVerticalAppleWidget(
                        icon: Icons.person,
                        label: 'Account',
                        isActive: _showAccountOverlay,
                        onTap: () {
                          if (_showAccountOverlay) {
                            _closeAccountOverlay();
                          } else {
                            _closeAllSelectors();
                            _switchToAccountOverlay();
                          }
                        },
                      ),
                    ],
                  ),
                ),
              ),
              
              // Pagination widget - side by side with Container W
              Expanded(
                flex: 1,
                child: Container(
                  margin: const EdgeInsets.all(8),
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.white.withOpacity(0.2), width: 1),
                  ).copyWith(
                    // Add debug outline if enabled
                    border: _showContainerOutlines 
                      ? Border.all(color: Colors.orange, width: 2)
                      : Border.all(color: Colors.white.withOpacity(0.2), width: 1),
                  ),
                  child: _buildVerticalPagination(isCollapsed: isCollapsed),
                ),
              ),
            ],
          );
        }
      },
    );
  }


  Widget _buildVerticalAppleWidget({
    required IconData icon,
    required String label,
    required bool isActive,
    required VoidCallback onTap,
  }) {
    // Get screen height for responsive sizing
    final screenHeight = MediaQuery.of(context).size.height;
    final isSmallHeight = screenHeight < 600;
    
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: EdgeInsets.symmetric(
          horizontal: isSmallHeight ? 6 : 8, 
          vertical: isSmallHeight ? 8 : 12,
        ),
        decoration: BoxDecoration(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isActive 
              ? Colors.green
              : Colors.white.withOpacity(0.3),
            width: isActive ? 2 : 1,
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center, // Center content vertically
          children: [
            Icon(
              icon,
              color: Colors.white.withOpacity(0.8),
              size: isSmallHeight ? 16 : 20,
            ),
            if (!isSmallHeight) const SizedBox(height: 4),
            if (!isSmallHeight) Text(
              label,
              style: TextStyle(
                color: Colors.white.withOpacity(0.8),
                fontSize: 10,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRightContainerContent() {
    // Get scaling factors
    final screenWidth = MediaQuery.of(context).size.width;
    final isSmallScreen = screenWidth < 600;
    final isMediumScreen = screenWidth >= 600 && screenWidth < 900;
    final spacingScaleFactor = isSmallScreen ? 0.8 : isMediumScreen ? 0.9 : 1.0;
    final textScaleFactor = isSmallScreen ? 0.8 : isMediumScreen ? 0.9 : 1.0;
    
    // Get current song data for chord sheet
    String? chordSheet;
    String? chordSheetKey;
    
    if (jamSession?.setList?.songs?.isNotEmpty == true && _currentSongIndex >= 0) {
      final songIndexInSetlist = _queue.isNotEmpty && _currentSongIndex < _queue.length 
          ? _queue[_currentSongIndex]
          : _currentSongIndex;
      final selectedSong = jamSession!.setList!.songs![songIndexInSetlist];
      chordSheet = selectedSong.song.chordSheet;
      chordSheetKey = selectedSong.song.chordSheetKey;
    } else if (_queue.isNotEmpty && _currentSongIndex >= 0) {
      final songIndex = _queue[_currentSongIndex];
      if (jamSession?.setList?.songs?.isNotEmpty == true && songIndex < jamSession!.setList!.songs!.length) {
        final selectedSong = jamSession!.setList!.songs![songIndex];
        chordSheet = selectedSong.song.chordSheet;
        chordSheetKey = selectedSong.song.chordSheetKey;
      }
    }
    
    // Handle null values
    final safeChordSheet = chordSheet ?? '';
    final safeChordSheetKey = chordSheetKey ?? 'C';
    
    // If overlays are toggled to right side, show them here
    if (_overlayOnRightSide) {
      // Show queue management overlay on right side
      if (_showQueueManagementOverlay) {
        return Container(
          decoration: _getOutlineDecoration(Colors.green, width: 2),
          child: Stack(
            children: [
              // Queue management overlay with slide animation
              Positioned.fill(
                child: SlideTransition(
                  position: _queueManagementSlideAnimation,
                  child: Container(
                    decoration: const BoxDecoration(
                      color: Colors.transparent,
                      borderRadius: BorderRadius.all(Radius.circular(12)),
                    ),
                    child: QueueManagement(
                          jamSession: jamSession,
                          currentSongIndex: _currentSongIndex,
                          queue: _queue,
                          queueRevision: _queueRevision,
                          onQueueUpdated: (newQueue, newRevision) {
                            setState(() {
                              _queue = newQueue;
                              _queueRevision = newRevision;
                            });
                          },
                        ),
                  ),
                ),
              ),
            ],
          ),
        );
      }
      
      // Show settings overlay on right side
      if (_showSettingsOverlay) {
        print('🔧 Rendering settings overlay (right side)');
        return Container(
          decoration: _getOutlineDecoration(Colors.blue, width: 2),
          child: SlideTransition(
            position: _settingsSlideAnimation,
            child: Padding(
              padding: EdgeInsets.all(16 * spacingScaleFactor),
              child: Column(
                children: [
                  // Header with close button
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Settings',
                        style: TextStyle(
                          fontSize: 20 * textScaleFactor,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      IconButton(
                        onPressed: _closeSettingsOverlay,
                        icon: const Icon(Icons.close, color: Colors.white),
                      ),
                    ],
                  ),
                  const Divider(color: Colors.white30),
                  
                  // Settings content
                  Expanded(
                    child: SingleChildScrollView(
                      child: Column(
                        children: [
                          // Refresh option
                          _buildSettingsItem(
                            icon: Icons.refresh,
                            title: 'Refresh Jam Session',
                            onTap: () {
                              _closeSettingsOverlay();
                              _loadJamSession();
                            },
                          ),
                          // Exit Jam Session option
                          _buildSettingsItem(
                            icon: Icons.exit_to_app,
                            title: 'Exit Jam Session',
                            subtitle: 'Return to main page',
                            onTap: () {
                              print('🔘 Exit Jam Session button tapped!');
                              _closeSettingsOverlayAndExit();
                            },
                          ),
                          const Divider(color: Colors.white30),
                          
                          // Sidebar Position section
                          Text(
                            'Sidebar Position',
                            style: TextStyle(
                              fontSize: 16 * textScaleFactor,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 8),
                          _buildSettingsItem(
                            icon: Icons.arrow_back,
                            title: 'Left',
                            trailing: _sidebarPosition == SidebarPosition.left ? const Icon(Icons.check, color: Colors.green) : null,
                            onTap: () {
                              setState(() {
                                _sidebarPosition = SidebarPosition.left;
                              });
                            },
                          ),
                          _buildSettingsItem(
                            icon: Icons.arrow_forward,
                            title: 'Right',
                            trailing: _sidebarPosition == SidebarPosition.right ? const Icon(Icons.check, color: Colors.green) : null,
                            onTap: () {
                              setState(() {
                                _sidebarPosition = SidebarPosition.right;
                              });
                            },
                          ),
                          _buildSettingsItem(
                            icon: Icons.keyboard_arrow_down,
                            title: 'Bottom',
                            trailing: _sidebarPosition == SidebarPosition.bottom ? const Icon(Icons.check, color: Colors.green) : null,
                            onTap: () {
                              setState(() {
                                _sidebarPosition = SidebarPosition.bottom;
                              });
                            },
                          ),
                          const Divider(color: Colors.white30),
                          
                          // Overlay Position section
                          Text(
                            'Overlay Position',
                            style: TextStyle(
                              fontSize: 16 * textScaleFactor,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 8),
                          _buildSettingsItem(
                            icon: Icons.arrow_back,
                            title: 'Left Side',
                            subtitle: 'Show overlays on left container',
                            trailing: !_overlayOnRightSide ? const Icon(Icons.check, color: Colors.green) : null,
                            onTap: () {
                              setState(() {
                                _overlayOnRightSide = false;
                              });
                            },
                          ),
                          _buildSettingsItem(
                            icon: Icons.arrow_forward,
                            title: 'Right Side',
                            subtitle: 'Show overlays on right container (covers lyrics)',
                            trailing: _overlayOnRightSide ? const Icon(Icons.check, color: Colors.green) : null,
                            onTap: () {
                              setState(() {
                                _overlayOnRightSide = true;
                              });
                            },
                          ),
                          const Divider(color: Colors.white30),
                          
                          // Debug options
                          _buildSettingsItem(
                            icon: _showDebug ? Icons.bug_report : Icons.bug_report_outlined,
                            title: _showDebug ? 'Hide Debug Panel' : 'Show Debug Panel',
                            onTap: () {
                              setState(() {
                                _showDebug = !_showDebug;
                              });
                            },
                          ),
                          _buildSettingsItem(
                            icon: _showContainerOutlines ? Icons.border_outer : Icons.border_clear,
                            title: _showContainerOutlines ? 'Hide Container Outlines' : 'Show Container Outlines',
                            subtitle: 'Debug: Show all container borders',
                            onTap: () {
                              _toggleContainerOutlines();
                            },
                          ),
                          const Divider(color: Colors.white30),
                          
                          // Music Settings section
                          Text(
                            'Music Settings',
                            style: TextStyle(
                              fontSize: 16 * textScaleFactor,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 8),
                          _buildSettingsItem(
                            icon: Icons.music_note,
                            title: 'Key Selector',
                            subtitle: 'Current key: ${_currentKey ?? 'C'}',
                            onTap: () {
                              _openKeySelectorOverlay();
                            },
                          ),
                          _buildSettingsItem(
                            icon: Icons.tune,
                            title: 'Capo Settings',
                            subtitle: 'Current capo: ${_capo}',
                            onTap: () {
                              _openCapoSelectorOverlay();
                            },
                          ),
                          _buildSettingsItem(
                            icon: Icons.text_fields,
                            title: 'Text Size',
                            subtitle: 'Current size: $_textSize',
                            onTap: () {
                              _openTextSizeOverlay();
                            },
                          ),
                          _buildSettingsItem(
                            icon: Icons.qr_code,
                            title: 'QR Code',
                            subtitle: 'Share current song',
                            onTap: () {
                              _openQRCodeOverlay();
                            },
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      }
      
      // Show account overlay on right side
      if (_showAccountOverlay) {
        final authService = AuthService();
        final userId = authService.currentUserId;
        
        if (userId == null) {
          return Container(
            decoration: _getOutlineDecoration(Colors.red, width: 2),
            child: Padding(
              padding: EdgeInsets.all(16 * spacingScaleFactor),
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.error, color: Colors.red, size: 48),
                    SizedBox(height: 16),
                    Text(
                      'Not Authenticated',
                      style: TextStyle(
                        fontSize: 18 * textScaleFactor,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    SizedBox(height: 8),
                    Text(
                      'Please sign in to view account',
                      style: TextStyle(
                        fontSize: 14 * textScaleFactor,
                        color: Colors.white70,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }
        
        return Container(
          decoration: _getOutlineDecoration(Colors.purple, width: 2),
          child: Padding(
            padding: EdgeInsets.all(16 * spacingScaleFactor),
            child: UserAccountInterface(
              onClose: _closeAccountOverlay,
              userId: userId,
            ),
          ),
        );
      }
    }
    
    // Default: show normal lyrics content
    return _queue.isEmpty || _currentSongIndex < 0
        ? _buildEmptyQueueInstructions()
        : SlidesWidget(
            key: _slidesWidgetKey,
            chordSheet: safeChordSheet,
            chordSheetKey: _currentKey ?? safeChordSheetKey,
            originalKey: safeChordSheetKey, // Pass the original key
            textSize: _textSize,
            capo: _capo,
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
            onCompactModeChanged: (isCompact) {
              setState(() {
                _isSlidesInCompactMode = isCompact;
              });
            },
            onPreviousPage: _previousPage,
            onNextPage: _nextPage,
          );
  }

  Widget _buildVerticalPagination({bool isCollapsed = false}) {
    // Get screen height for responsive sizing
    final screenHeight = MediaQuery.of(context).size.height;
    final isSmallHeight = screenHeight < 600;
    final totalPages = _getTotalPages();
    
    return Column(
      mainAxisAlignment: MainAxisAlignment.center, // Center all content vertically
      children: [
        // Previous page button (top)
        isCollapsed ? Expanded(
          child: InkWell(
            onTap: _currentPage > 0 ? _previousPage : null,
            child: Container(
              decoration: BoxDecoration(
                border: _showContainerOutlines 
                  ? Border.all(color: Colors.cyan, width: 2)
                  : null,
              ),
              child: Center(
                child: Icon(
                  Icons.keyboard_arrow_up,
                  color: _currentPage > 0 
                    ? Colors.white.withOpacity(0.8)
                    : Colors.white.withOpacity(0.3),
                  size: isSmallHeight ? 16 : 20,
                ),
              ),
            ),
          ),
        ) : IconButton(
          onPressed: _currentPage > 0 ? _previousPage : null,
          icon: Icon(
            Icons.keyboard_arrow_up,
            color: _currentPage > 0 
              ? Colors.white.withOpacity(0.8)
              : Colors.white.withOpacity(0.3),
            size: isSmallHeight ? 16 : 20,
          ),
          tooltip: isSmallHeight ? null : 'Previous page',
          padding: isSmallHeight ? const EdgeInsets.all(4) : null,
        ),
        
        // Page info (middle) - always show text regardless of screen height
        Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            border: _showContainerOutlines 
              ? Border.all(color: Colors.green, width: 2)
              : null,
          ),
          child: Center( // Center the text horizontally and vertically
            child: Text(
              '${_currentPage + 1}${totalPages != null ? ' / $totalPages' : ''}',
              style: TextStyle(
                color: Colors.white.withOpacity(0.8),
                fontSize: isSmallHeight ? 10 : 12, // Smaller font for small screens but still visible
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ),
        
        // Next page button (bottom)
        Builder(
          builder: (context) {
            final canGoNext = totalPages != null && _currentPage < totalPages - 1;
            return isCollapsed ? Expanded(
              child: InkWell(
                onTap: canGoNext ? _nextPage : null,
                child: Container(
                  decoration: BoxDecoration(
                    border: _showContainerOutlines 
                      ? Border.all(color: Colors.cyan, width: 2)
                      : null,
                  ),
                  child: Center(
                    child: Icon(
                      Icons.keyboard_arrow_down,
                      color: canGoNext 
                        ? Colors.white.withOpacity(0.8)
                        : Colors.white.withOpacity(0.3),
                      size: isSmallHeight ? 16 : 20,
                    ),
                  ),
                ),
              ),
            ) : IconButton(
              onPressed: canGoNext ? _nextPage : null,
              icon: Icon(
                Icons.keyboard_arrow_down,
                color: canGoNext 
                  ? Colors.white.withOpacity(0.8)
                  : Colors.white.withOpacity(0.3),
                size: isSmallHeight ? 16 : 20,
              ),
              tooltip: isSmallHeight ? null : 'Next page',
              padding: isSmallHeight ? const EdgeInsets.all(4) : null,
            );
          },
        ),
      ],
    );
  }

  @override
  void dispose() {
    print('🧹 Disposing SongCardPage - cleaning up all resources...');
    print('🔍 Disposal subscription states:');
    print('   - _songSubscription: ${_songSubscription != null ? "ACTIVE" : "NULL"}');
    print('   - _keySubscription: ${_keySubscription != null ? "ACTIVE" : "NULL"}');
    print('   - _pageSubscription: ${_pageSubscription != null ? "ACTIVE" : "NULL"}');
    print('   - _queueSubscription: ${_queueSubscription != null ? "ACTIVE" : "NULL"}');
    print('   - _fadeTimer: ${_fadeTimer != null ? "ACTIVE" : "NULL"}');
    
    // Dispose focus node
    _focusNode.dispose();
    print('✅ Focus node disposed');
    
    // Dispose all animation controllers
    _queueManagementAnimationController.dispose();
    _settingsAnimationController.dispose();
    _keySelectorAnimationController.dispose();
    _textSizeAnimationController.dispose();
    _qrCodeAnimationController.dispose();
    _leftContainerWidthAnimationController.dispose();
    _containerWLayoutAnimationController.dispose();
    _containerWSlideAnimationController.dispose();
    print('✅ Animation controllers disposed');
    
    // Cancel all subscriptions
    if (_songSubscription != null) {
      print('🛑 Disposing song subscription...');
      _songSubscription!.cancel();
    }
    if (_keySubscription != null) {
      print('🛑 Disposing key subscription...');
      _keySubscription!.cancel();
    }
    if (_pageSubscription != null) {
      print('🛑 Disposing page subscription...');
      _pageSubscription!.cancel();
    }
    if (_queueSubscription != null) {
      print('🛑 Disposing queue subscription...');
      _queueSubscription!.cancel();
    }
    
    // Cancel fade timer
    if (_fadeTimer != null) {
      print('🛑 Disposing fade timer...');
      _fadeTimer!.cancel();
    }
    
    // Clear all references to prevent memory leaks
    _songSubscription = null;
    _keySubscription = null;
    _pageSubscription = null;
    _queueSubscription = null;
    _fadeTimer = null;
    
    print('✅ SongCardPage disposed successfully - all resources cleaned up');
    super.dispose();
  }

  // Reset fade timer
  void _resetFadeTimer() {
    _fadeTimer?.cancel();
    _fadeTimer = Timer(_fadeDuration, () {
      if (mounted) {
        // UI fade logic can be added here if needed
      }
    });
  }


  // Start fade timer
  void _startFadeTimer() {
    _fadeTimer?.cancel();
    _fadeTimer = Timer(_fadeDuration, () {
      if (mounted) {
        // UI fade logic can be added here if needed
      }
    });
  }

  Future<void> _loadJamSession() async {
    print('🎵 JAM SESSION: Starting to load jam session');
    print('   - Jam Session ID: ${widget.jamSessionId}');
    print('   - Initial collapsed state: $_isLeftContainerCollapsed');
    try {
      setState(() {
        isLoading = true;
        errorMessage = null;
      });

      print('🔍 Loading jam session with ID: ${widget.jamSessionId}');
      print('📊 DynamoDB Query Details:');
      print('   - Table: JAM_TABLE_NAME (from environment)');
      print('   - Primary Key: jamSessionId = ${widget.jamSessionId}');
      print('   - Query Type: GetItemCommand');
      print('   - Additional Tables: SETLIST_TABLE_NAME, SONG_TABLE_NAME (if setList requested)');
      print('⏱️ Starting DynamoDB query at: ${DateTime.now().toIso8601String()}');
      
      // Get user ID from auth service for authentication
      final authService = AuthService();
      final userId = authService.currentUserId;
      print('🔍 Auth service user ID: "$userId"');
      print('🔍 User ID is null: ${userId == null}');
      print('🔍 User ID is empty: ${userId?.isEmpty ?? true}');
      
      final stopwatch = Stopwatch()..start();
      final session = await _jamService.getJamSession(widget.jamSessionId, userId: userId);
      stopwatch.stop();
      
      print('⏱️ DynamoDB query completed in: ${stopwatch.elapsedMilliseconds}ms');

      setState(() {
        jamSession = session;
        isLoading = false;
        
        print('🎵 JAM SESSION: Successfully loaded jam session');
        print('   - Session loaded: ${session != null}');
        print('   - Current collapsed state: $_isLeftContainerCollapsed');
        print('   - Will show default view: ${!_isLeftContainerCollapsed}');
        
        // Initialize current song and page from server data
        if (session?.currentSong != null) {
          _currentSongIndex = session!.currentSong!;
          print('🎵 Initialized current song index from server: $_currentSongIndex');
        }
        if (session?.currentPage != null) {
          _currentPage = session!.currentPage!;
          print('📄 Initialized current page from server: $_currentPage');
        }
      });

      if (session != null) {
        print('✅ Jam session loaded successfully from DynamoDB!');
        print('📊 DynamoDB Response Summary:');
        
        // Show name popup for unauthenticated users
        final authService = AuthService();
        if (!authService.isAuthenticated()) {
          // Use a post-frame callback to ensure the dialog shows after the build
          WidgetsBinding.instance.addPostFrameCallback((_) {
            _showGuestNamePopup();
          });
        }
        print('   - Jam Session Record: ✅ Found');
        print('   - Set List Record: ${session.setList != null ? "✅ Found" : "❌ Not Found"}');
        print('   - Songs Records: ${session.setList?.songs?.isNotEmpty == true ? "✅ Found (${session.setList!.songs!.length} songs)" : "❌ Not Found"}');
        print('📝 Description: ${session.description}');
        print('👥 Admins: ${session.admins.length}');
        print('👥 Members: ${session.members.length}');
        print('👥 Guests: ${session.guests.length}');
        print('🎵 Set List: ${session.setList != null ? "Found" : "Not Found"}');
        
        if (session.setList != null) {
          print('📊 DynamoDB Set List Query Details:');
          print('   - Table: SETLIST_TABLE_NAME (from environment)');
          print('   - Primary Key: setListId = ${session.setList!.setListId}');
          print('   - Query Type: GetItemCommand');
          print('📋 Set List ID: ${session.setList!.setListId}');
          print('📋 Set List Description: ${session.setList!.description}');
          print('🎼 Songs in Set: ${session.setList!.songs?.length ?? 0}');
          
          // Log detailed setlist and room information
          print('\n=== ROOM & SETLIST DETAILED DATA ===');
          print('🏠 ROOM INFORMATION:');
          print('   - Jam Session ID: ${session.jamSessionId}');
          print('   - Description: ${session.description ?? 'N/A'}');
          print('   - Policy: ${session.policy ?? 'N/A'}');
          print('   - Start Date: ${session.startDate ?? 'N/A'} ${session.startDate != null ? '(${DateTime.fromMillisecondsSinceEpoch(session.startDate!).toIso8601String()})' : ''}');
          print('   - End Date: ${session.endDate ?? 'N/A'} ${session.endDate != null ? '(${DateTime.fromMillisecondsSinceEpoch(session.endDate!).toIso8601String()})' : ''}');
          print('   - Admins: ${session.admins.length}');
          print('   - Members: ${session.members.length}');
          print('   - Guests: ${session.guests.length}');
          print('   - Active Users: ${session.active.length}');
          
          print('\n🎵 SETLIST INFORMATION:');
          print('   - SetList ID: ${session.setList!.setListId}');
          print('   - Description: ${session.setList!.description ?? 'N/A'}');
          print('   - Total Songs: ${session.setList!.songs?.length ?? 0}');
          
          if (session.setList!.songs != null && session.setList!.songs!.isNotEmpty) {
            print('\n🎼 SONGS WITH KEYS:');
            for (int i = 0; i < session.setList!.songs!.length; i++) {
              final jamSong = session.setList!.songs![i];
              print('   ${i + 1}. ${jamSong.song.title} by ${jamSong.song.artist}');
              print('      - Song ID: ${jamSong.song.songId}');
              print('      - Key: ${jamSong.key}');
              print('      - Chord Sheet Length: ${jamSong.song.chordSheet.length} characters');
              print('      - Chord Sheet Key: ${jamSong.song.chordSheetKey}');
              if (i < 5) { // Only show first 5 songs in detail
                print('      - Chord Sheet Preview: ${jamSong.song.chordSheet.length > 100 ? jamSong.song.chordSheet.substring(0, 100) + '...' : jamSong.song.chordSheet}');
              }
              if (i >= 5) {
                print('      ... and ${session.setList!.songs!.length - 6} more songs');
                break;
              }
            }
          }
          
          if (session.setList!.songs != null && session.setList!.songs!.isNotEmpty) {
            print('📊 DynamoDB Songs Query Details:');
            print('   - Table: SONG_TABLE_NAME (from environment)');
            print('   - Query Type: BatchGetItemCommand');
            print('   - Song IDs Count: ${session.setList!.songs!.length}');
            print('   - Unique Song IDs: ${session.setList!.songs!.map((s) => s.song.songId).toSet().length}');
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
            
            if (songs!.isNotEmpty) {
              final firstSong = songs!.first;
              _logSongDebugInfo(firstSong, 'First song from jam session');
            }
            
            // Initialize current key from the first song
            _initializeCurrentKey();
            
            // Initialize queue with set list order
            await _initializeQueue();
          } else {
            print('⚠️ Set list exists but has no songs');
          }
        } else {
          print('⚠️ No set list found in jam session');
        }
        
        if (session.setList?.songs?.isEmpty == true) {
          print('🔄 Set list is empty, trying to load songs from current user...');
          await _loadSongsFromCurrentUser();
          // Initialize queue after loading songs
          await _initializeQueue();
        } else if (session.setList == null) {
          print('🔄 No set list, trying to fetch songs from current user...');
          await _loadSongsFromCurrentUser();
          // Initialize queue after loading songs
          await _initializeQueue();
        }
      } else {
        print('❌ Jam session failed to load, trying fallback...');
        await _loadSongsFromCurrentUser();
        // Initialize queue after loading songs from fallback
        await _initializeQueue();
      }
    } catch (e) {
      print('❌ Error loading jam session: $e');
      setState(() {
        errorMessage = 'Failed to load jam session: $e';
        isLoading = false;
      });
      
      print('🔄 Trying to fetch songs directly as fallback...');
      try {
        await _loadSongsFromCurrentUser();
        // Initialize queue after loading songs from fallback
        await _initializeQueue();
      } catch (songError) {
        print('❌ Failed to fetch songs directly: $songError');
      }
    }
  }

  Future<void> _loadSongsFromAdmin(String adminUserId) async {
    try {
      print('Trying to fetch songs from admin: $adminUserId');
      final adminSongs = await _jamService.getSongs(adminUserId, limit: 100); // Increased limit to get full setlist
      
      if (mounted) {
        setState(() {
          songs = adminSongs;
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

  /// Load songs using the current authenticated user
  Future<void> _loadSongsFromCurrentUser() async {
    try {
      final authService = AuthService();
      
      if (!authService.isAuthenticated()) {
        print('❌ User not authenticated, cannot load songs');
        return;
      }

      final userId = authService.currentUserId!;
      print('🎵 Loading all accessible songs for user: $userId');
      
      // Use the enhanced method that gets user's songs + shared songs + public band songs
      final allSongs = await _jamService.listAllAccessibleSongs(userId);
      
      if (mounted) {
        setState(() {
          songs = allSongs;
        });
      }
      
      print('✅ Successfully loaded ${allSongs.length} accessible songs for user');
    } catch (e) {
      print('❌ Error loading songs for current user: $e');
      // Show error message to user instead of falling back to hardcoded admin
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to load songs: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
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
    if (jamSession?.setList?.songs?.isNotEmpty == true && _currentSongIndex >= 0) {
      // Use queue to get the correct song from setlist
      final songIndexInSetlist = _queue.isNotEmpty && _currentSongIndex < _queue.length 
          ? _queue[_currentSongIndex] 
          : _currentSongIndex;
      final selectedSong = jamSession!.setList!.songs![songIndexInSetlist];
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
    } else if (songs?.isNotEmpty == true && _currentSongIndex >= 0) {
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

  void _previousPage() async {
    if (_currentPage > 0 && !_isSyncingPage) {
      final prevPageIndex = _currentPage - 1;
      
      // Show loading state
      setState(() {
        _isSyncingPage = true;
        _syncError = null;
      });
      
      try {
        // Wait for backend confirmation
        await _jamService.nextPage(widget.jamSessionId, prevPageIndex);
        
        // Only update UI after successful backend sync
        setState(() {
          _currentPage = prevPageIndex;
          _isLastPage = false; // We're going back, so we're definitely not on the last page
          _isFirstPage = _currentPage == 0; // Check if we're now on the first page
          _isSyncingPage = false;
        });
        
        print('✅ Page change synchronized with backend');
        
        // Reset fade timer when page changes
        _resetFadeTimer();
        
        // Ensure focus is maintained after state update
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _focusNode.requestFocus();
        });
      } catch (e) {
        // Show error, don't update UI
        setState(() {
          _isSyncingPage = false;
          _syncError = 'Failed to sync page change: $e';
        });
        print('❌ Failed to sync page change: $e');
      }
    }
  }

  void _nextPage() async {
    // Use cached total pages to avoid recalculation
    final totalPages = _getTotalPages();
    
    // Only advance if we're not at the last page and not already syncing
    if (totalPages != null && _currentPage < totalPages - 1 && !_isSyncingPage) {
      final nextPageIndex = _currentPage + 1;
      
      // Show loading state
      setState(() {
        _isSyncingPage = true;
        _syncError = null;
      });
      
      try {
        // Wait for backend confirmation
        await _jamService.nextPage(widget.jamSessionId, nextPageIndex);
        
        // Only update UI after successful backend sync
        setState(() {
          _currentPage = nextPageIndex;
          _isLastPage = _currentPage >= totalPages - 1;
          _isFirstPage = _currentPage == 0;
          _isSyncingPage = false;
        });
        
        print('✅ Page change synchronized with backend');
        
        // Reset fade timer when page changes
        _resetFadeTimer();
        
        // Ensure focus is maintained after state update
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _focusNode.requestFocus();
        });
      } catch (e) {
        // Show error, don't update UI
        setState(() {
          _isSyncingPage = false;
          _syncError = 'Failed to sync page change: $e';
        });
        print('❌ Failed to sync page change: $e');
      }
    }
  }

  void _goToNextSong() async {
    // Use queue-based navigation
    if (jamSession?.setList?.songs == null && (songs == null || songs!.isEmpty)) return;
    if (_isSyncingSong) return;

    setState(() { _isSyncingSong = true; _syncError = null; });
    try {
      // Check if there's a next song in the queue
      if (_queue.isNotEmpty && _currentSongIndex >= 0 && _currentSongIndex < _queue.length - 1) {
        final nextQueuePosition = _currentSongIndex + 1;
        final setlistIndex = _queue[nextQueuePosition];
        
        print('🎵 Going to next song: queue position $nextQueuePosition -> setlist index $setlistIndex');
        
        // Call backend with setlist index
        await _jamService.nextSong(widget.jamSessionId, setlistIndex, page: 0);
        
        // Update UI with queue position
        setState(() {
          _currentSongIndex = nextQueuePosition;
          _currentPage = 0;
          _isLastPage = false;
          _isFirstPage = true;
          _isSyncingSong = false;
        });
        _initializeCurrentKey();
        WidgetsBinding.instance.addPostFrameCallback((_) { _focusNode.requestFocus(); });
        print('✅ Next song synchronized with backend');
      } else {
        // No next song in queue
        setState(() { _isSyncingSong = false; });
        print('🎵 No next song available in queue');
      }
    } catch (e) {
      setState(() { _isSyncingSong = false; _syncError = 'Failed to sync next song: $e'; });
      print('❌ Failed to sync next song: $e');
    }
  }

  bool _hasNextSong() {
    if (jamSession?.setList?.songs != null && jamSession!.setList!.songs!.isNotEmpty) {
      // Check if there's a next song in the queue
      return _queue.isNotEmpty && _currentSongIndex >= 0 && _currentSongIndex < _queue.length - 1;
    } else if (songs != null && songs!.isNotEmpty) {
      return _currentSongIndex >= 0 && _currentSongIndex < songs!.length - 1;
    }
    return false;
  }

  void _goToPreviousSong() async {
    // Check if there's a previous song available and not already syncing
    if (jamSession?.setList?.songs != null && jamSession!.setList!.songs!.isNotEmpty) {
      if (_currentSongIndex > 0 && !_isSyncingSong) {
        final prevQueuePosition = _currentSongIndex - 1;
        final setlistIndex = _queue[prevQueuePosition];
        
        // Show loading state
        setState(() {
          _isSyncingSong = true;
          _syncError = null;
        });
        
        try {
          print('🎵 Going to previous song: queue position $prevQueuePosition -> setlist index $setlistIndex');
          
          // Wait for backend confirmation with setlist index
          await _jamService.nextSong(widget.jamSessionId, setlistIndex, page: 0);
          
          // Only update UI after successful backend sync
          setState(() {
            _currentSongIndex = prevQueuePosition; // Store queue position, not setlist index
            _currentPage = 0;
            _isLastPage = false;
            _isFirstPage = true; // Reset to first page
            _isSyncingSong = false;
          });
          
          // Update current key for the new song
          _initializeCurrentKey();
          
          print('✅ Previous song synchronized with backend');
          
          // Ensure focus is maintained after state update
          WidgetsBinding.instance.addPostFrameCallback((_) {
            _focusNode.requestFocus();
          });
        } catch (e) {
          // Show error, don't update UI
          setState(() {
            _isSyncingSong = false;
            _syncError = 'Failed to sync previous song: $e';
          });
          print('❌ Failed to sync previous song: $e');
        }
      }
    } else if (songs != null && songs!.isNotEmpty) {
      if (_currentSongIndex > 0 && !_isSyncingSong) {
        final prevSongIndex = _currentSongIndex - 1;
        
        // Show loading state
        setState(() {
          _isSyncingSong = true;
          _syncError = null;
        });
        
        try {
          // Wait for backend confirmation
          await _jamService.nextSong(widget.jamSessionId, prevSongIndex, page: 0);
          
          // Only update UI after successful backend sync
          setState(() {
            _currentSongIndex = prevSongIndex;
            _currentPage = 0;
            _isLastPage = false;
            _isFirstPage = true; // Reset to first page
            _isSyncingSong = false;
          });
          
          // Update current key for the new song
          _initializeCurrentKey();
          
          print('✅ Previous song synchronized with backend');
          
          // Ensure focus is maintained after state update
          WidgetsBinding.instance.addPostFrameCallback((_) {
            _focusNode.requestFocus();
          });
        } catch (e) {
          // Show error, don't update UI
          setState(() {
            _isSyncingSong = false;
            _syncError = 'Failed to sync previous song: $e';
          });
          print('❌ Failed to sync previous song: $e');
        }
      }
    }
  }

  bool _hasPreviousSong() {
    return _currentSongIndex > 0;
  }

  void _onSectionSelected(int pageIndex) async {
    if (pageIndex != _currentPage && !_isSyncingPage) {
      // Show loading state
      setState(() {
        _isSyncingPage = true;
        _syncError = null;
      });
      
      try {
        // Wait for backend confirmation
        await _jamService.nextPage(widget.jamSessionId, pageIndex);
        
        // Only update UI after successful backend sync
        setState(() {
          _currentPage = pageIndex;
          // Update last page status
          final totalPages = _getTotalPages();
          _isLastPage = totalPages != null && _currentPage >= totalPages - 1;
          _isFirstPage = _currentPage == 0; // Check if we're on the first page
          _isSyncingPage = false;
        });
        
        print('✅ Section selection synchronized with backend');
        
        // Ensure focus is maintained after state update
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _focusNode.requestFocus();
        });
      } catch (e) {
        // Show error, don't update UI
        setState(() {
          _isSyncingPage = false;
          _syncError = 'Failed to sync section selection: $e';
        });
        print('❌ Failed to sync section selection: $e');
      }
    }
  }

  void _initializeCurrentKey() {
    if (jamSession?.setList?.songs?.isNotEmpty == true && _currentSongIndex >= 0) {
      // Use queue to get the correct song from setlist
      final songIndexInSetlist = _queue.isNotEmpty && _currentSongIndex < _queue.length 
          ? _queue[_currentSongIndex] 
          : _currentSongIndex;
      final currentSong = jamSession!.setList!.songs![songIndexInSetlist];
      _currentKey = currentSong.song.chordSheetKey;
    } else if (songs?.isNotEmpty == true && _currentSongIndex >= 0) {
      _currentKey = songs![_currentSongIndex].chordSheetKey;
    }
  }

  void _onKeyChanged(String newKey) async {
    // This method is kept for backward compatibility but now calls the sync version
    _onKeyChangedWithSync(newKey, true);
  }

  void _onKeyChangedWithSync(String newKey, bool syncWithAllUsers) async {
    if (newKey != _currentKey && !_isSyncingKey) {
      // Show loading state
      setState(() {
        _isSyncingKey = true;
        _syncError = null;
      });
      
      try {
        if (syncWithAllUsers) {
          // Wait for backend confirmation
          await _jamService.setSongKey(widget.jamSessionId, newKey, song: _currentSongIndex);
          print('✅ Key change synchronized with backend');
        } else {
          // Local change only - no backend sync
          print('🎵 Key changed locally only');
        }
        
        // Update UI after successful sync (or immediately for local changes)
        setState(() {
          _currentKey = newKey;
          // Reset to first page when key changes to show the effect
          _currentPage = 0;
          _isFirstPage = true;
          final totalPages = _getTotalPages();
          _isLastPage = totalPages != null && totalPages <= 1;
          _isSyncingKey = false;
        });
        
        // Ensure focus is maintained after state update
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _focusNode.requestFocus();
        });
      } catch (e) {
        // Show error, don't update UI
        setState(() {
          _isSyncingKey = false;
          _syncError = 'Failed to sync key change: $e';
        });
        print('❌ Failed to sync key change: $e');
      }
    }
  }


  void _onSongSelected(int queuePosition) async {
    if (queuePosition != _currentSongIndex && !_isSyncingSong) {
      // Show loading state
      setState(() {
        _isSyncingSong = true;
        _syncError = null;
      });
      
      try {
        // Get the setlist index from the queue position
        if (queuePosition >= 0 && queuePosition < _queue.length) {
          final setlistIndex = _queue[queuePosition];
          print('🎵 Song selected: queue position $queuePosition -> setlist index $setlistIndex');
          
          // Wait for backend confirmation with the setlist index
          await _jamService.nextSong(widget.jamSessionId, setlistIndex, page: 0);
          
          // Only update UI after successful backend sync
          setState(() {
            _currentSongIndex = queuePosition; // Store queue position, not setlist index
            _currentPage = 0;
            _isFirstPage = true;
            _isLastPage = false;
            _isSyncingSong = false;
          });
          
          // Update current key for the new song
          _initializeCurrentKey();
          
          print('✅ Song change synchronized with backend');
          print('🎵 Current song index (queue position): $_currentSongIndex');
          print('🎵 Setlist index: $setlistIndex');
        } else {
          print('❌ Invalid queue position: $queuePosition (queue length: ${_queue.length})');
          setState(() {
            _isSyncingSong = false;
            _syncError = 'Invalid song selection';
          });
          return;
        }
        
        // Ensure focus is maintained after state update
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _focusNode.requestFocus();
        });
      } catch (e) {
        // Show error, don't update UI
        setState(() {
          _isSyncingSong = false;
          _syncError = 'Failed to sync song change: $e';
        });
        print('❌ Failed to sync song change: $e');
      }
    }
  }

  void _showTextSizeDialog() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Text Size'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildTextSizeOption('dynamic', 'Dynamic (Auto)', 1.0),
                _buildTextSizeOption('text-xs', 'Extra Small', 1.0),
                _buildTextSizeOption('text-sm', 'Small', 1.0),
                _buildTextSizeOption('text-base', 'Base', 1.0),
                _buildTextSizeOption('text-lg', 'Large', 1.0),
                _buildTextSizeOption('text-xl', 'Extra Large', 1.0),
                _buildTextSizeOption('text-2xl', '2XL', 1.0),
                _buildTextSizeOption('text-3xl', '3XL', 1.0),
                _buildTextSizeOption('text-4xl', '4XL', 1.0),
                _buildTextSizeOption('text-5xl', '5XL', 1.0),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
              },
              child: const Text('Close'),
            ),
          ],
        );
      },
    );
  }

  void _showQRCodeDialog() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return Dialog(
          backgroundColor: Colors.transparent,
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
            ),
            child: QRGeneratorWidget(
              jamSessionId: widget.jamSessionId,
              pin: jamSession?.pin,
              onClose: () => Navigator.of(context).pop(),
            ),
          ),
        );
      },
    );
  }

  void _showSettingsMenu(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (BuildContext context) {
        return Container(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Settings',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              ListTile(
                leading: const Icon(Icons.refresh),
                title: const Text('Refresh Jam Session'),
                onTap: () {
                  Navigator.pop(context);
                  _loadJamSession();
                },
              ),
              ListTile(
                leading: const Icon(Icons.exit_to_app),
                title: const Text('Exit Jam Session'),
                subtitle: const Text('Return to main page'),
                onTap: () {
                  print('🔘 Exit Jam Session button tapped (dialog)!');
                  Navigator.pop(context); // Close dialog
                  _exitJamSession();
                },
              ),
              const Divider(),
              const Text('Sidebar Position', style: TextStyle(fontWeight: FontWeight.bold)),
              ListTile(
                leading: const Icon(Icons.arrow_back),
                title: const Text('Left'),
                trailing: _sidebarPosition == SidebarPosition.left ? const Icon(Icons.check) : null,
                onTap: () {
                  setState(() {
                    _sidebarPosition = SidebarPosition.left;
                  });
                  Navigator.pop(context);
                },
              ),
              ListTile(
                leading: const Icon(Icons.arrow_forward),
                title: const Text('Right'),
                trailing: _sidebarPosition == SidebarPosition.right ? const Icon(Icons.check) : null,
                onTap: () {
                  setState(() {
                    _sidebarPosition = SidebarPosition.right;
                  });
                  Navigator.pop(context);
                },
              ),
              ListTile(
                leading: const Icon(Icons.keyboard_arrow_down),
                title: const Text('Bottom'),
                trailing: _sidebarPosition == SidebarPosition.bottom ? const Icon(Icons.check) : null,
                onTap: () {
                  setState(() {
                    _sidebarPosition = SidebarPosition.bottom;
                  });
                  Navigator.pop(context);
                },
              ),
              const Divider(),
              ListTile(
                leading: Icon(_showDebug ? Icons.bug_report : Icons.bug_report_outlined),
                title: Text(_showDebug ? 'Hide Debug Panel' : 'Show Debug Panel'),
                onTap: () {
                  setState(() {
                    _showDebug = !_showDebug;
                  });
                  Navigator.pop(context);
                },
              ),
              ListTile(
                leading: Icon(_showContainerOutlines ? Icons.border_outer : Icons.border_clear),
                title: Text(_showContainerOutlines ? 'Hide Container Outlines' : 'Show Container Outlines'),
                subtitle: const Text('Debug: Show all container borders'),
                onTap: () {
                  _toggleContainerOutlines();
                  Navigator.pop(context);
                },
              ),
              ListTile(
                leading: const Icon(Icons.text_fields),
                title: const Text('Text Size'),
                onTap: () {
                  Navigator.pop(context);
                  _openTextSizeOverlay();
                },
              ),
              ListTile(
                leading: const Icon(Icons.qr_code),
                title: const Text('Show QR Code & PIN'),
                onTap: () {
                  Navigator.pop(context);
                  _openQRCodeOverlay();
                },
              ),
              const Divider(),
              const Text('Music Settings', style: TextStyle(fontWeight: FontWeight.bold)),
              ListTile(
                leading: const Icon(Icons.music_note),
                title: const Text('Key Selector'),
                subtitle: Text('Current key: ${_currentKey ?? 'C'}'),
                onTap: () {
                  Navigator.pop(context);
                  _showKeySelectorDialog();
                },
              ),
              ListTile(
                leading: const Icon(Icons.tune),
                title: const Text('Capo Settings'),
                subtitle: Text('Current capo: ${_capo}'),
                onTap: () {
                  Navigator.pop(context);
                  _showCapoSelectorDialog();
                },
              ),
            ],
          ),
        );
      },
    );
  }

  void _showKeySelectorDialog() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Select Key'),
          content: SizedBox(
            width: 300,
            height: 400,
            child: KeySelectorWidget(
              currentKey: _currentKey ?? 'C',
              originalKey: 'C',
              onKeyChanged: _isSyncingKey ? null : _onKeyChanged,
              onKeyChangedWithSync: _isSyncingKey ? null : _onKeyChangedWithSync,
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Close'),
            ),
          ],
        );
      },
    );
  }

  void _showCapoSelectorDialog() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Capo Settings'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Current Capo: $_capo'),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  IconButton(
                    onPressed: _capo > 0 ? () {
                      setState(() {
                        _capo--;
                      });
                    } : null,
                    icon: const Icon(Icons.remove),
                  ),
                  Text(
                    '$_capo',
                    style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                  IconButton(
                    onPressed: _capo < 12 ? () {
                      setState(() {
                        _capo++;
                      });
                    } : null,
                    icon: const Icon(Icons.add),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Text(
                'Capo ${_capo}${_capo == 0 ? ' (Open)' : _capo == 1 ? ' (1st fret)' : ' (${_capo}th fret)'}',
                style: const TextStyle(fontSize: 16),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Close'),
            ),
          ],
        );
      },
    );
  }

  Widget _buildTextSizeOption(String value, String label, double textScaleFactor) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: ListTile(
        title: Text(
          label,
          style: TextStyle(
            color: Colors.white,
            fontSize: 16 * textScaleFactor,
          ),
        ),
        leading: Radio<String>(
          value: value,
          groupValue: _textSize,
          activeColor: Colors.white,
          onChanged: (String? newValue) {
            if (newValue != null) {
              setState(() {
                _textSize = newValue;
              });
              // Don't close the overlay after selection - user can continue selecting
            }
          },
        ),
      ),
    );
  }


  void _startSongSubscription() {
    try {
      print('🎵 Starting song subscription for jam session: ${widget.jamSessionId}');
      
      final request = GraphQLRequest<String>(
        document: GraphQLSubscriptions.onNextSong,
        variables: {'jamSessionId': widget.jamSessionId},
      );

      _songSubscription = Amplify.API.subscribe(request).listen(
        (response) {
          print('🎵 Received song subscription update: ${response.data}');
          _handleSongUpdate(response);
        },
        onError: (error) {
          print('❌ Song subscription error: $error');
        },
      );
    } catch (e) {
      print('❌ Failed to start song subscription: $e');
    }
  }

  void _handleSongUpdate(GraphQLResponse<String> response) {
    if (response.data != null) {
      try {
        final data = jsonDecode(response.data!);
        final songData = data['onNextSong'];
        
        if (songData != null) {
          final newSongIndex = songData['song'] as int?;
          final newPage = songData['page'] as int?;
          final currentSongIndex = songData['currentSongIndex'] as int?;
          
          print('🔍 SONG SUBSCRIPTION UPDATE:');
          print('   - newSongIndex: $newSongIndex');
          print('   - currentSongIndex: $currentSongIndex');
          print('   - Local _currentSongIndex: $_currentSongIndex');
          
          if (newSongIndex != null) {
            print('🎵 Received song change from another user: setlist index $newSongIndex');
            
            // Convert setlist index to queue position
            final queuePosition = _queue.indexOf(newSongIndex);
            if (queuePosition != -1) {
              print('🎵 Converted setlist index $newSongIndex to queue position $queuePosition');
              
              setState(() {
                _currentSongIndex = queuePosition;
                _currentPage = newPage ?? 0;
                _isFirstPage = _currentPage == 0;
                _isLastPage = false; // Will be recalculated
              });
              
              // Update current key for the new song
              _initializeCurrentKey();
              
              print('🎵 Updated to queue position: $queuePosition, page: $_currentPage');
            } else {
              print('❌ Could not find setlist index $newSongIndex in current queue: $_queue');
            }
          } else if (currentSongIndex != null && currentSongIndex != _currentSongIndex) {
            print('🎵 Received current song index update: $currentSongIndex');
            // currentSongIndex from backend is also a setlist index, convert to queue position
            final queuePosition = _queue.indexOf(currentSongIndex);
            if (queuePosition != -1) {
              setState(() {
                _currentSongIndex = queuePosition;
              });
              print('🎵 Updated current song index to queue position: $queuePosition');
            } else {
              print('❌ Could not find setlist index $currentSongIndex in current queue: $_queue');
            }
          }
          
          // Apply queue if present in payload
          final newQueue = (songData['queue'] as List?)?.map((e) => e as int).toList();
          if (newQueue != null) {
            setState(() { _queue = newQueue; });
          }
        }
      } catch (e) {
        print('❌ Error parsing song subscription data: $e');
      }
    }
  }

  void _startKeySubscription() {
    try {
      print('🎵 Starting key subscription for jam session: ${widget.jamSessionId}');
      
      final request = GraphQLRequest<String>(
        document: GraphQLSubscriptions.onSongKey,
        variables: {'jamSessionId': widget.jamSessionId},
      );

      _keySubscription = Amplify.API.subscribe(request).listen(
        (response) {
          print('🎵 Received key subscription update: ${response.data}');
          _handleKeyUpdate(response);
        },
        onError: (error) {
          print('❌ Key subscription error: $error');
        },
      );
    } catch (e) {
      print('❌ Failed to start key subscription: $e');
    }
  }

  void _handleKeyUpdate(GraphQLResponse<String> response) {
    if (response.data != null) {
      try {
        final data = jsonDecode(response.data!);
        final keyData = data['onSongKey'];
        
        if (keyData != null) {
          final newKey = keyData['key'] as String?;
          final songIndex = keyData['song'] as int?;
          final currentSongIndex = keyData['currentSongIndex'] as int?;
          
          print('🔍 KEY SUBSCRIPTION UPDATE:');
          print('   - newKey: $newKey');
          print('   - songIndex: $songIndex');
          print('   - currentSongIndex: $currentSongIndex');
          print('   - Local _currentSongIndex: $_currentSongIndex');
          
          // Check for current song index update
          if (currentSongIndex != null) {
            print('🎵 Received current song index update from key subscription: setlist index $currentSongIndex');
            // Convert setlist index to queue position
            final queuePosition = _queue.indexOf(currentSongIndex);
            if (queuePosition != -1 && queuePosition != _currentSongIndex) {
              setState(() {
                _currentSongIndex = queuePosition;
              });
              print('🎵 Updated current song index to queue position: $queuePosition');
            } else if (queuePosition == -1) {
              print('❌ Could not find setlist index $currentSongIndex in current queue: $_queue');
            }
          }
          
          if (newKey != null && songIndex != null && newKey != _currentKey) {
            // Check if this key change is for the current song
            final currentSetlistIndex = _currentSongIndex >= 0 && _queue.isNotEmpty && _currentSongIndex < _queue.length 
                ? _queue[_currentSongIndex] 
                : _currentSongIndex;
            
            if (songIndex == currentSetlistIndex) {
              print('🎵 Received key change from another user: $newKey');
              
              setState(() {
                _currentKey = newKey;
                // Reset to first page when key changes
                _currentPage = 0;
                _isFirstPage = true;
                final totalPages = _getTotalPages();
                _isLastPage = totalPages != null && totalPages <= 1;
              });
              
              print('🎵 Updated to key: $newKey');
            }
          }
        }
      } catch (e) {
        print('❌ Error parsing key subscription data: $e');
      }
    }
  }

  void _startPageSubscription() {
    try {
      print('📄 Starting page subscription for jam session: ${widget.jamSessionId}');
      
      final request = GraphQLRequest<String>(
        document: GraphQLSubscriptions.onNextPage,
        variables: {'jamSessionId': widget.jamSessionId},
      );

      _pageSubscription = Amplify.API.subscribe(request).listen(
        (response) {
          print('📄 Received page subscription update: ${response.data}');
          _handlePageUpdate(response);
        },
        onError: (error) {
          print('❌ Page subscription error: $error');
        },
      );
    } catch (e) {
      print('❌ Failed to start page subscription: $e');
    }
  }

  // Queue state (lightweight)
  List<int> _queue = [];
  int _queueRevision = 0;


  int? _computeNextQueuePosition() {
    print('🎵 COMPUTING NEXT QUEUE POSITION:');
    print('   - Current song index (queue position): $_currentSongIndex');
    print('   - Queue: $_queue');
    print('   - Queue length: ${_queue.length}');
    
    if (_queue.isNotEmpty && _currentSongIndex >= 0) {
      final currentPosition = _currentSongIndex;
      print('   - Current song position in queue: $currentPosition');
      
      if (currentPosition < _queue.length - 1) {
        // Return the next queue position
        final nextQueuePosition = currentPosition + 1;
        print('   - Next queue position: $nextQueuePosition');
        return nextQueuePosition;
      }
    }
    print('   - No next song found (returning null)');
    return null;
  }

  Future<void> _initializeQueue() async {
    try {
      print('🔄 Initializing queue for jam session: ${widget.jamSessionId}');
      
      // Get user ID from auth service for authentication
      final authService = AuthService();
      final userId = authService.currentUserId;
      print('🔄 Auth service user ID for queue: "$userId"');
      
      // Debug: Check if jam session is loaded
      print('🔍 [DEBUG] Jam session loaded: ${jamSession != null}');
      if (jamSession != null) {
        print('🔍 [DEBUG] Jam session ID: ${jamSession!.jamSessionId}');
        print('🔍 [DEBUG] Jam session queue: ${jamSession!.queue}');
        print('🔍 [DEBUG] Jam session revision: ${jamSession!.revision}');
        print('🔍 [DEBUG] Jam session current song: ${jamSession!.currentSong}');
      }
      
      final (q, rev, currentSongFromServer) = await _jamService.getJamQueue(widget.jamSessionId);
      
      print('📊 Current queue from server: $q (revision: $rev)');
      print('📊 Current song index from server: $currentSongFromServer');
      print('📊 Jam session setlist songs: ${jamSession?.setList?.songs?.length ?? 0}');
      print('📊 Local songs: ${songs?.length ?? 0}');
      
      // Set the current song index from the server response
      if (q != null && q.isNotEmpty) {
        if (currentSongFromServer != null) {
          print('🎵 Using current song index from server: $currentSongFromServer');
          setState(() {
            _currentSongIndex = currentSongFromServer;
          });
        } else if (jamSession?.currentSong != null) {
          print('🎵 Using current song from jam session: ${jamSession!.currentSong}');
          setState(() {
            _currentSongIndex = jamSession!.currentSong!;
          });
        } else {
          print('🎵 No current song index available, setting to 0 (first song)');
          setState(() {
            _currentSongIndex = 0;
          });
        }
        
        // Initialize current page from jam session if available
        if (jamSession?.currentPage != null) {
          print('📄 Using current page from jam session: ${jamSession!.currentPage}');
          setState(() {
            _currentPage = jamSession!.currentPage!;
            // Update page state flags
            _isFirstPage = _currentPage == 0;
            final totalPages = _getTotalPages();
            _isLastPage = totalPages != null && _currentPage >= totalPages - 1;
          });
        }
      }
      
      // If queue is empty or null, keep it empty (don't auto-populate with setlist)
      if (q == null || q.isEmpty) {
        print('🆕 Queue is empty, keeping it empty (no auto-population)');
        
        setState(() {
          _queue = <int>[];
          _queueRevision = rev ?? 0;
          _currentSongIndex = -1; // No current song when queue is empty
        });
        print('✅ Queue kept empty as intended');
      } else {
      // Queue already exists, use it (remove duplicates and validate indices)
      final availableSongs = jamSession?.setList?.songs?.length ?? songs?.length ?? 0;
      final seen = <int>{};
      final validQueue = q.where((songIndex) => 
        seen.add(songIndex) && songIndex >= 0 && songIndex < availableSongs
      ).toList();
      
      // Use the existing queue as-is (no automatic reset)
      setState(() {
        _queue = validQueue;
        _queueRevision = rev ?? 0;
        // Ensure current song index is valid for existing queue
        if (_currentSongIndex < 0 || _currentSongIndex >= _queue.length) {
          if (_queue.isNotEmpty) {
            _currentSongIndex = 0;
            print('🎵 Current song index was invalid, set to 0 (first song)');
          } else {
            _currentSongIndex = -1;
            print('🎵 Queue is empty, keeping current song index as -1');
          }
        }
      });
      print('✅ Loaded existing queue with ${_queue.length} songs (deduplicated from ${q.length}, validated against ${availableSongs} available songs)');
      print('🎵 Current song index: $_currentSongIndex');
    }
    } catch (e) {
      print('❌ Error initializing queue: $e');
      // Set a minimal local queue as fallback
      setState(() {
        _queue = [0]; // Just the first song
        _queueRevision = 0;
        _currentSongIndex = 0; // Set to first song
      });
      print('⚠️ Using minimal fallback queue: ${_queue.length} songs');
      print('🎵 Current song index set to 0 (first song)');
    }
  }

  void _startQueueSubscription() {
    try {
      final request = GraphQLRequest<String>(
        document: GraphQLSubscriptions.onJamQueueUpdate,
        variables: {'jamSessionId': widget.jamSessionId},
      );
      _queueSubscription = Amplify.API.subscribe(request).listen(
        (response) {
          if (response.data != null) {
            try {
              final data = jsonDecode(response.data!);
              final q = data['onJamQueueUpdate'];
              if (q != null) {
                final list = (q['queue'] as List?)?.map((e) => e as int).toList();
                final rev = q['revision'] as int?;
                final currentSongIndex = q['currentSongIndex'] as int?;
                
                print('🔍 QUEUE SUBSCRIPTION UPDATE:');
                print('   - Server currentSongIndex: $currentSongIndex');
                print('   - Local _currentSongIndex: $_currentSongIndex');
                print('   - Should update: ${currentSongIndex != null && currentSongIndex != _currentSongIndex}');
                
                if (list != null) {
                  setState(() {
                    _queue = list;
                    if (rev != null) _queueRevision = rev;
                    // Update current song index if provided and different
                    if (currentSongIndex != null && currentSongIndex != _currentSongIndex) {
                      print('   - Updating current song index from $_currentSongIndex to $currentSongIndex');
                      _currentSongIndex = currentSongIndex;
                      _currentPage = 0; // Reset to first page when song changes
                      _isFirstPage = true;
                      _isLastPage = false;
                      _initializeCurrentKey();
                    } else {
                      print('   - Not updating current song index');
                    }
                  });
                }
              }
            } catch (e) {
              print('❌ Error parsing queue update: $e');
            }
          }
        },
        onError: (error) { print('❌ Queue subscription error: $error'); },
      );
    } catch (e) {
      print('❌ Failed to start queue subscription: $e');
    }
  }

  Future<void> _playNext(int songIndex, int currentIndex) async {
    if (currentIndex >= _queue.length - 1) return; // Already at last song

    // Retry logic for robustness
    for (int attempt = 0; attempt < 3; attempt++) {
      final nextSongIndex = _queue[currentIndex + 1];
      final result = await _jamService.nextSong(widget.jamSessionId, nextSongIndex);

      if (result != null) {
        // Success - update local state if needed
        break;
      } else {
        // Failed - get fresh queue state and retry
        final (q, rev, _) = await _jamService.getJamQueue(widget.jamSessionId);
        if (q != null && rev != null) {
          setState(() {
            _queue = q;
            _queueRevision = rev;
          });
          // Check if we still have a valid next song after refresh
          if (currentIndex >= _queue.length - 1) break;
        } else {
          break; // Give up if we can't get queue state
        }
      }
    }
  }

  Future<void> _addToQueue(int songIndex) async {
    // OCC-safe: retry on revision mismatch using server state
    for (int attempt = 0; attempt < 3; attempt++) {
      final next = <int>[..._queue, songIndex];
      final (serverQueue, serverRev, _) = await _jamService.setJamQueue(
        widget.jamSessionId,
        next,
        expectedRevision: _queueRevision,
      );
      if (serverQueue != null) {
        setState(() {
          _queue = serverQueue;
          _queueRevision = serverRev ?? _queueRevision;
        });
        break;
      } else {
        final (q, rev, _) = await _jamService.getJamQueue(widget.jamSessionId);
        if (q != null && rev != null) {
          setState(() { _queue = q; _queueRevision = rev; });
        } else {
          break;
        }
      }
    }
  }

  void _handlePageUpdate(GraphQLResponse<String> response) {
    if (response.data != null) {
      try {
        final data = jsonDecode(response.data!);
        final pageData = data['onNextPage'];
        
        if (pageData != null) {
          final newPage = pageData['page'] as int?;
          final currentSongIndex = pageData['currentSongIndex'] as int?;
          
          print('🔍 PAGE SUBSCRIPTION UPDATE:');
          print('   - newPage: $newPage');
          print('   - currentSongIndex: $currentSongIndex');
          print('   - Local _currentSongIndex: $_currentSongIndex');
          
          // Check for current song index update
          if (currentSongIndex != null && currentSongIndex != _currentSongIndex) {
            print('🎵 Received current song index update from page subscription: $currentSongIndex');
            setState(() {
              _currentSongIndex = currentSongIndex;
            });
          }
          
          if (newPage != null && newPage != _currentPage) {
            print('📄 Received page change from another user: $newPage');
            
            setState(() {
              _currentPage = newPage;
              _isFirstPage = _currentPage == 0;
              final totalPages = _getTotalPages();
              _isLastPage = totalPages != null && _currentPage >= totalPages - 1;
            });
            
            print('📄 Updated to page: $newPage');
          }
        }
      } catch (e) {
        print('❌ Error parsing page subscription data: $e');
      }
    }
  }

  KeyEventResult _handleSectionShortcut(KeyDownEvent event) {
    // Don't handle section shortcuts when queue management overlay is visible
    if (_showQueueManagementOverlay) {
      return KeyEventResult.ignored;
    }
    
    // Get current song data for section lookup
    String? chordSheet;
    String? chordSheetKey;
    
    if (jamSession?.setList?.songs?.isNotEmpty == true && _currentSongIndex >= 0) {
      // Use queue to get the correct song from setlist
      final songIndexInSetlist = _queue.isNotEmpty && _currentSongIndex < _queue.length 
          ? _queue[_currentSongIndex] 
          : _currentSongIndex;
      final selectedSong = jamSession!.setList!.songs![songIndexInSetlist];
      chordSheet = selectedSong.song.chordSheet;
      chordSheetKey = selectedSong.song.chordSheetKey;
    } else if (songs?.isNotEmpty == true && _currentSongIndex >= 0) {
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
    // Early return if exiting
    if (_isExiting) {
      print('🚫 Widget is exiting, skipping build');
      return const SizedBox.shrink();
    }
    
    // Allow both authenticated and guest users to view jam sessions
    // Authentication is optional for viewing, but required for certain actions

    if (isLoading) {
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(),
              SizedBox(height: 16),
              Text('Loading song data...'),
            ],
          ),
        ),
      );
    }

    if (errorMessage != null) {
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error, size: 64, color: Colors.red),
              SizedBox(height: 16),
              Text('Error: $errorMessage'),
              SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {
                  setState(() {
                    errorMessage = null;
                    isLoading = true;
                  });
                  _loadJamSession();
                },
                child: Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    // Get current song's album art URL for dynamic background
    Song? currentSong;
    if (jamSession?.setList?.songs?.isNotEmpty == true && _currentSongIndex >= 0) {
      // Use queue to get the correct song from setlist
      final songIndexInSetlist = _queue.isNotEmpty && _currentSongIndex < _queue.length 
          ? _queue[_currentSongIndex] 
          : _currentSongIndex;
      if (songIndexInSetlist >= 0 && songIndexInSetlist < jamSession!.setList!.songs!.length) {
        currentSong = jamSession!.setList!.songs![songIndexInSetlist].song;
      }
    } else if (songs != null && _currentSongIndex >= 0 && _currentSongIndex < songs!.length) {
      currentSong = songs![_currentSongIndex];
    }
    final albumArtUrl = currentSong?.albumCover;

    return PopScope(
      canPop: false, // Prevent default back behavior
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) {
          // Handle when user tries to go back
          Navigator.of(context).pop();
        }
      },
      child: DynamicBackground(
        albumArtUrl: albumArtUrl,
        animationDuration: const Duration(milliseconds: 1200),
        blurIntensity: 50.0, // Much heavier blur
        scaleFactor: 2.0, // Larger scale
        enableBlurredImage: true,
        enableColorExtraction: true,
        child: Focus(
        focusNode: _focusNode,
        autofocus: true,
        canRequestFocus: true,
        onKeyEvent: (node, event) {
          if (event is KeyDownEvent) {
            if (event.logicalKey == LogicalKeyboardKey.escape) {
              // Handle escape key - only exit if name popup is not showing
              if (!_hasShownNamePopup) {
                // If name popup hasn't been shown yet, show it instead of exiting
                _showGuestNamePopup();
                return KeyEventResult.handled;
              } else {
                // If name popup has been shown, allow normal exit
                Navigator.of(context).pop();
                return KeyEventResult.handled;
              }
            } else if (event.logicalKey == LogicalKeyboardKey.arrowLeft) {
              // Check if we're in line navigation mode
              if (_isSlidesInCompactMode && _slidesWidgetKey.currentState != null) {
                _slidesWidgetKey.currentState!.previousLineGroup();
                return KeyEventResult.handled;
              } else {
                _previousPage();
                return KeyEventResult.handled;
              }
            } else if (event.logicalKey == LogicalKeyboardKey.arrowRight) {
              // Check if we're in line navigation mode
              if (_isSlidesInCompactMode && _slidesWidgetKey.currentState != null) {
                _slidesWidgetKey.currentState!.nextLineGroup();
                return KeyEventResult.handled;
              } else {
                _nextPage();
                return KeyEventResult.handled;
              }
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
        child: GestureDetector(
          onTap: () {
            // Reset fade timer on tap
            _resetFadeTimer();
          },
          onPanStart: (_) {
            // Reset fade timer on pan start
            _resetFadeTimer();
          },
          onPanUpdate: (_) {
            // Reset fade timer on pan update
            _resetFadeTimer();
          },
          child: Scaffold(
            backgroundColor: Colors.transparent,
            body: _buildBodyWithSidebar(),
          ),
        ),
        ),
      ),
    );
  }


  Widget _buildBody() {
    // Check if user is authenticated
    final authService = AuthService();
    final isAuthenticated = authService.isAuthenticated();
    
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

    // Handle unauthenticated users - also show normal interface
    if (!isAuthenticated) {
      return _buildSongDisplay();
    }

    // Always show the normal song display interface, even when queue is empty
    // The _buildSongDisplay method already handles empty queues gracefully
    return _buildSongDisplay();
  }

  void _openSongSelector() {
    // Always allow opening queue management, even if setlist is empty
    // The QueueManagement widget will handle empty setlists gracefully
    setState(() {
      _showQueueManagementOverlay = true;
    });
    // Start the slide up animation
    _queueManagementAnimationController.forward();
  }
  
  void _closeQueueManagementOverlay() {
    // Start the slide down animation
    _queueManagementAnimationController.reverse().then((_) {
      if (mounted) {
        setState(() {
          _showQueueManagementOverlay = false;
        });
      }
    });
  }

  void _openSettingsOverlay() {
    print('🔧 _openSettingsOverlay() called');
    setState(() {
      _showSettingsOverlay = true;
    });
    print('🔧 Settings overlay state set to true');
    // Start the slide up animation
    _settingsAnimationController.forward();
    print('🔧 Settings animation started');
  }

  void _closeSettingsOverlay() {
    print('🔧 _closeSettingsOverlay() called');
    // Start the slide down animation
    _settingsAnimationController.reverse().then((_) {
      print('🔧 Settings overlay animation completed');
      if (mounted) {
        setState(() {
          _showSettingsOverlay = false;
          _showTextSizeOverlay = false; // Also close text size overlay if open
          _showQRCodeOverlay = false; // Also close QR Code overlay if open
        });
        // Reset animation controllers
        _textSizeAnimationController.reset();
        _qrCodeAnimationController.reset();
        print('🔧 Settings overlay state updated');
      }
    });
  }

  void _closeSettingsOverlayAndExit() {
    print('🔧 _closeSettingsOverlayAndExit() called');
    
    // Immediately close the settings overlay without animation
    setState(() {
      _showSettingsOverlay = false;
      _showTextSizeOverlay = false;
      _showQRCodeOverlay = false;
    });
    
    // Reset animation controllers
    _settingsAnimationController.reset();
    _textSizeAnimationController.reset();
    _qrCodeAnimationController.reset();
    
    print('🔧 Settings overlay closed immediately, calling exit...');
    
    // Call exit immediately without waiting for animation
    _exitJamSession();
  }

  void _exitJamSession() {
    print('🚀 _exitJamSession() method called!');
    
    if (!mounted || _isExiting) {
      print('⚠️ Widget not mounted or already exiting, skipping exit cleanup');
      return;
    }
    
    // Set exit flag to prevent further operations
    _isExiting = true;
    
    print('🚪 Exiting jam session - cleaning up resources...');
    print('🔍 Current subscription states:');
    print('   - _songSubscription: ${_songSubscription != null ? "ACTIVE" : "NULL"}');
    print('   - _keySubscription: ${_keySubscription != null ? "ACTIVE" : "NULL"}');
    print('   - _pageSubscription: ${_pageSubscription != null ? "ACTIVE" : "NULL"}');
    print('   - _queueSubscription: ${_queueSubscription != null ? "ACTIVE" : "NULL"}');
    print('   - _fadeTimer: ${_fadeTimer != null ? "ACTIVE" : "NULL"}');
    
    // Cancel all subscriptions first
    if (_songSubscription != null) {
      print('🛑 Cancelling song subscription...');
      _songSubscription!.cancel();
    }
    if (_keySubscription != null) {
      print('🛑 Cancelling key subscription...');
      _keySubscription!.cancel();
    }
    if (_pageSubscription != null) {
      print('🛑 Cancelling page subscription...');
      _pageSubscription!.cancel();
    }
    if (_queueSubscription != null) {
      print('🛑 Cancelling queue subscription...');
      _queueSubscription!.cancel();
    }
    
    // Cancel fade timer
    if (_fadeTimer != null) {
      print('🛑 Cancelling fade timer...');
      _fadeTimer!.cancel();
    }
    
    // Clear subscription references
    _songSubscription = null;
    _keySubscription = null;
    _pageSubscription = null;
    _queueSubscription = null;
    _fadeTimer = null;
    
    print('✅ All subscriptions and timers cancelled and cleared');
    print('🔍 Final subscription states:');
    print('   - _songSubscription: ${_songSubscription != null ? "ACTIVE" : "NULL"}');
    print('   - _keySubscription: ${_keySubscription != null ? "ACTIVE" : "NULL"}');
    print('   - _pageSubscription: ${_pageSubscription != null ? "ACTIVE" : "NULL"}');
    print('   - _queueSubscription: ${_queueSubscription != null ? "ACTIVE" : "NULL"}');
    print('   - _fadeTimer: ${_fadeTimer != null ? "ACTIVE" : "NULL"}');
    
    // Navigate back to main page using pushReplacement to clear navigation stack
    print('🚀 Navigating back to main page...');
    
    // Use a post-frame callback to ensure navigation happens after current frame
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        try {
          // Use pushReplacement to clear the navigation stack and reset Navigator state
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (context) => const MainPage(),
            ),
          );
          print('✅ Navigation completed successfully with pushReplacement');
        } catch (e) {
          print('❌ Navigation error: $e');
          // If pushReplacement fails, try regular pop
          try {
            Navigator.pop(context);
            print('✅ Fallback navigation completed successfully');
          } catch (e2) {
            print('❌ Fallback navigation also failed: $e2');
          }
        }
      }
    });
  }

  void _switchToQueueOverlay() {
    if (_showSettingsOverlay) {
      // Close settings first, then open queue
      _settingsAnimationController.reverse().then((_) {
        if (mounted) {
          setState(() {
            _showSettingsOverlay = false;
            _showQueueManagementOverlay = true;
          });
          _queueManagementAnimationController.forward();
        }
      });
    } else {
      // Just open queue
      _openSongSelector();
    }
  }

  void _switchToSettingsOverlay() {
    print('🔧 _switchToSettingsOverlay() called');
    if (_showQueueManagementOverlay) {
      print('🔧 Closing queue first, then opening settings');
      // Close queue first, then open settings
      _queueManagementAnimationController.reverse().then((_) {
        if (mounted) {
          setState(() {
            _showQueueManagementOverlay = false;
            _showSettingsOverlay = true;
          });
          _settingsAnimationController.forward();
          print('🔧 Settings overlay opened after queue closed');
        }
      });
    } else {
      print('🔧 Opening settings directly');
      // Just open settings
      _openSettingsOverlay();
    }
  }

  // Helper method to close all selector overlays
  void _closeAllSelectors() {
    if (_showKeySelectorOverlay) {
      _keySelectorAnimationController.reverse().then((_) {
        if (mounted) {
          setState(() {
            _showKeySelectorOverlay = false;
          });
        }
      });
    }
    if (_showCapoSelectorOverlay) {
      setState(() {
        _showCapoSelectorOverlay = false;
      });
    }
    if (_showAccountOverlay) {
      setState(() {
        _showAccountOverlay = false;
      });
    }
    // Note: Text size overlay is a sub-overlay of settings, so it's handled by settings overlay
  }

  void _switchToAccountOverlay() {
    if (_showQueueManagementOverlay) {
      // Close queue first, then open account
      _queueManagementAnimationController.reverse().then((_) {
        if (mounted) {
          setState(() {
            _showQueueManagementOverlay = false;
            _showAccountOverlay = true;
          });
        }
      });
    } else if (_showSettingsOverlay) {
      // Close settings first, then open account
      _settingsAnimationController.reverse().then((_) {
        if (mounted) {
          setState(() {
            _showSettingsOverlay = false;
            _showAccountOverlay = true;
          });
        }
      });
    } else {
      // Just open account
      setState(() {
        _showAccountOverlay = true;
      });
    }
  }

  void _closeAccountOverlay() {
    setState(() {
      _showAccountOverlay = false;
    });
  }

  void _cycleKey() {
    final keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    final currentIndex = keys.indexOf(_currentKey ?? 'C');
    final nextIndex = (currentIndex + 1) % keys.length;
    _onKeyChanged(keys[nextIndex]);
  }

  void _cycleCapo() {
    final newCapo = (_capo + 1) % 13; // 0-12
    setState(() {
      _capo = newCapo;
    });
  }

  List<String> _getKeyOptions() {
    const availableKeys = ['A', 'Bb', 'B', 'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab'];
    final options = <String>[];
    
    // Add original key first
    options.add('C'); // Assuming C is original
    
    // Add other keys that aren't the original
    for (final key in availableKeys) {
      if (key != 'C') {
        options.add(key);
      }
    }
    return options;
  }

  void _openKeySelectorOverlay() {
    setState(() {
      _showSettingsOverlay = false; // Hide settings overlay
      _showKeySelectorOverlay = true;
    });
    // Start the slide up animation
    _keySelectorAnimationController.forward();
  }

  void _closeKeySelectorOverlay() {
    // Start the slide down animation
    _keySelectorAnimationController.reverse().then((_) {
      if (mounted) {
        setState(() {
          _showKeySelectorOverlay = false;
          _showSettingsOverlay = true; // Return to settings page
        });
      }
    });
  }

  void _openCapoSelectorOverlay() {
    setState(() {
      _showSettingsOverlay = false; // Hide settings overlay
      _showCapoSelectorOverlay = true;
    });
  }

  void _closeCapoSelectorOverlay() {
    setState(() {
      _showCapoSelectorOverlay = false;
      _showSettingsOverlay = true; // Return to settings page
    });
  }

  void _openTextSizeOverlay() {
    setState(() {
      _showSettingsOverlay = false; // Hide settings overlay
      _showTextSizeOverlay = true;
    });
    // Start the slide up animation
    _textSizeAnimationController.forward();
  }

  void _closeTextSizeOverlay() {
    // Start the slide down animation
    _textSizeAnimationController.reverse().then((_) {
      if (mounted) {
        setState(() {
          _showTextSizeOverlay = false;
          _showSettingsOverlay = true; // Return to settings page
        });
      }
    });
  }

  void _openQRCodeOverlay() {
    setState(() {
      _showSettingsOverlay = false; // Hide settings overlay
      _showQRCodeOverlay = true;
    });
    // Start the slide up animation
    _qrCodeAnimationController.forward();
  }

  void _closeQRCodeOverlay() {
    // Start the slide down animation
    _qrCodeAnimationController.reverse().then((_) {
      if (mounted) {
        setState(() {
          _showQRCodeOverlay = false;
          _showSettingsOverlay = true; // Return to settings page
        });
      }
    });
  }

  Widget _buildSettingsItem({
    required IconData icon,
    required String title,
    String? subtitle,
    Widget? trailing,
    required VoidCallback onTap,
  }) {
    print('🔧 _buildSettingsItem called for: $title');
    return ListTile(
      leading: Icon(icon, color: Colors.white70),
      title: Text(
        title,
        style: const TextStyle(color: Colors.white),
      ),
      subtitle: subtitle != null 
          ? Text(
              subtitle,
              style: const TextStyle(color: Colors.white60),
            )
          : null,
      trailing: trailing,
      onTap: () {
        print('🔧 Settings item tapped: $title');
        onTap();
      },
      contentPadding: const EdgeInsets.symmetric(horizontal: 0, vertical: 4),
    );
  }

  void _showQueueManagement() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      showDragHandle: false,
      builder: (BuildContext context) {
        return QueueManagement(
          jamSession: jamSession,
          currentSongIndex: _currentSongIndex,
          queue: _queue,
          queueRevision: _queueRevision,
          onQueueUpdated: (newQueue, newRevision) {
            setState(() {
              _queue = newQueue;
              _queueRevision = newRevision;
            });
          },
          onSongSelected: (songIndex) {
            Navigator.pop(context);
            _onSongSelected(songIndex);
          },
          onCurrentSongChanged: (newCurrentSongIndex) {
            if (newCurrentSongIndex != null) {
              setState(() {
                _currentSongIndex = newCurrentSongIndex;
              });
            }
          },
        );
      },
    );
  }

  Widget _buildEmptyQueueDisplay() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.queue_music_outlined,
            size: 64,
            color: Colors.grey[400],
          ),
          const SizedBox(height: 16),
          Text(
            'No songs in queue',
            style: TextStyle(
              fontSize: 18,
              color: Colors.grey[600],
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Add songs to the queue to start playing',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[500],
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () {
              _openSongSelector();
            },
            icon: const Icon(Icons.add),
            label: const Text('Add Songs'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF8B7ED8),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyQueueInstructions() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.queue_music,
              size: 80,
              color: Colors.white.withOpacity(0.7),
            ),
            const SizedBox(height: 24),
            Text(
              'How to Add Songs',
              style: TextStyle(
                fontSize: 24,
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            Text(
              PlatformUtils.isMobile 
                ? 'Click on the Queue icon on the left to open the queue and setlist management.'
                : 'Click on the Queue icon on the bottom left to open the queue and setlist management.',
              style: TextStyle(
                fontSize: 16,
                color: Colors.white.withOpacity(0.8),
                height: 1.5,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            Text(
              'Search for songs you have access to and add them to the queue/setlist.',
              style: TextStyle(
                fontSize: 16,
                color: Colors.white.withOpacity(0.8),
                height: 1.5,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: Colors.white.withOpacity(0.2),
                  width: 1,
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.touch_app,
                    color: Colors.white.withOpacity(0.8),
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    PlatformUtils.isMobile 
                      ? 'Look for the Queue button on the left'
                      : 'Look for the Queue button on the bottom left',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.white.withOpacity(0.8),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBodyWithSidebar() {
    final body = _buildBody();
    
    // Create the main content area - lyrics always use full screen
    Widget mainContent = Stack(
      children: [
        // Body content - full screen without top padding
        Positioned(
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          child: body,
        ),
        
        // Loading indicator (bottom left corner)
        if (_isSyncingPage || _isSyncingSong || _isSyncingKey)
          Positioned(
            bottom: 16,
            left: 16,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.1),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white.withOpacity(0.2), width: 1.5),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        _isSyncingPage 
                            ? 'Syncing page...' 
                            : _isSyncingSong 
                                ? 'Syncing song...'
                                : 'Syncing key...',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          fontFamily: '.SF Pro Text',
                          fontFamilyFallback: ['SF Pro Text', 'system-ui', 'Roboto'],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        
        
        // Error message overlay
        if (_syncError != null)
          Positioned(
            top: 16,
            left: 16,
            right: 16,
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.red.shade100,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.red.shade300),
              ),
              child: Row(
                children: [
                  Icon(Icons.error_outline, color: Colors.red.shade700),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      _syncError!,
                      style: TextStyle(color: Colors.red.shade700),
                    ),
                  ),
                  IconButton(
                    onPressed: () {
                      setState(() {
                        _syncError = null;
                      });
                    },
                    icon: Icon(Icons.close, color: Colors.red.shade700),
                  ),
                ],
              ),
            ),
          ),
        
      ],
    );
    
    // Add left navigation sidebar if enabled
    Widget content = mainContent;
    if (_showLeftNavigationSidebar) {
      content = Row(
        children: [
          LeftNavigationSidebar(
            isVisible: _showLeftNavigationSidebar,
            onMySongs: () {
              // Handle My Songs navigation
              print('Navigate to My Songs');
            },
            onMyJamSessions: () {
              // Handle My Jam Sessions navigation
              print('Navigate to My Jam Sessions');
            },
            onUserAccountPressed: _showUserAccountMenu,
          ),
          Expanded(child: mainContent),
        ],
      );
    }
    
    if (!_showSidebar) {
      return content;
    }

    // Get current song data for sidebar
    String? chordSheet;
    String? chordSheetKey;
    
    if (jamSession?.setList?.songs?.isNotEmpty == true && _currentSongIndex >= 0) {
      // Use queue to get the correct song from setlist
      final songIndexInSetlist = _queue.isNotEmpty && _currentSongIndex < _queue.length 
          ? _queue[_currentSongIndex] 
          : _currentSongIndex;
      final selectedSong = jamSession!.setList!.songs![songIndexInSetlist];
      chordSheet = selectedSong.song.chordSheet;
      chordSheetKey = selectedSong.song.chordSheetKey;
    } else if (songs?.isNotEmpty == true && _currentSongIndex >= 0) {
      final selectedSong = songs![_currentSongIndex];
      chordSheet = selectedSong.chordSheet;
      chordSheetKey = selectedSong.chordSheetKey;
    }

    if (chordSheet == null || chordSheetKey == null) {
      return content;
    }

    final sidebar = SectionSidebar(
      chordSheet: chordSheet,
      chordSheetKey: chordSheetKey,
      currentPage: _currentPage,
      onSectionSelected: _onSectionSelected,
      position: _sidebarPosition,
      isVisible: _showSidebar,
      jamSession: jamSession,
      currentSongIndex: _currentSongIndex,
      nextSongIndex: _computeNextQueuePosition(),
      onSongSelected: _onSongSelected,
      onPlayNext: _playNext,
      onAddToQueue: _addToQueue,
      queue: _queue,
      queueRevision: _queueRevision,
      onQueueUpdated: (newQueue, newRevision) {
        setState(() {
          // Remove duplicates while preserving order and validate indices
          final availableSongs = jamSession?.setList?.songs?.length ?? songs?.length ?? 0;
          final seen = <int>{};
          _queue = newQueue.where((songIndex) => 
            seen.add(songIndex) && songIndex >= 0 && songIndex < availableSongs
          ).toList();
          _queueRevision = newRevision;
        });
      },
      onCurrentSongChanged: (newCurrentSongIndex) {
        setState(() {
          _currentSongIndex = newCurrentSongIndex ?? 0;
        });
      },
    );

    switch (_sidebarPosition) {
      case SidebarPosition.left:
        return Row(
          children: [
            sidebar,
            Expanded(child: content),
          ],
        );
      case SidebarPosition.right:
        return Row(
          children: [
            Expanded(child: content),
            sidebar,
          ],
        );
      case SidebarPosition.bottom:
        return Column(
          children: [
            Expanded(child: content),
            sidebar,
          ],
        );
    }
  }

  bool _shouldShowSimplifiedSongInfo(BuildContext context) {
    // Get the available height for the song content
    final screenHeight = MediaQuery.of(context).size.height;
    final statusBarHeight = MediaQuery.of(context).padding.top;
    final bottomPadding = MediaQuery.of(context).padding.bottom;
    
    // Account for top buttons (estimated 80px), song info section (estimated 120px), 
    // and pagination control (estimated 60px)
    final reservedSpace = 80 + 120 + 60;
    final availableHeight = screenHeight - statusBarHeight - bottomPadding - reservedSpace;
    
    // Estimate height needed for 3 lines of lyrics (approximately 60px per line)
    final minHeightForLyrics = 180;
    
    return availableHeight < minHeightForLyrics;
  }





  Widget _buildSimplifiedSongInfo(String title, String? albumCover) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final availableWidth = constraints.maxWidth;
          final availableHeight = constraints.maxHeight;
          final widthBasedSize = availableWidth * 0.25;
          final heightBasedSize = availableHeight * 0.2; // More aggressive height scaling
          final iconSize = (widthBasedSize < heightBasedSize ? widthBasedSize : heightBasedSize).clamp(20.0, 80.0);
          
          return Row(
            children: [
              // Smaller icon
              Container(
                width: iconSize,
                height: iconSize,
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
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Color(0xFF667eea).withValues(alpha: 0.3),
                  blurRadius: 8,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: albumCover != null && albumCover.isNotEmpty
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Image.network(
                      albumCover,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) =>
                          Icon(
                        Icons.music_note_rounded,
                        size: 24,
                        color: Colors.white.withValues(alpha: 0.8),
                      ),
                    ),
                  )
                : Icon(
                    Icons.music_note_rounded,
                    size: 24,
                    color: Colors.white.withValues(alpha: 0.8),
                  ),
          ),
          
          const SizedBox(width: 16),
          
          // Just the song title
          Expanded(
            child: Text(
              title,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.3,
                shadows: [
                  Shadow(
                    offset: const Offset(0, 1),
                    blurRadius: 2,
                  ),
                ],
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
            ],
          );
        },
      ),
    );
  }


  Widget _buildFallbackFullSongInfo() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final availableWidth = constraints.maxWidth;
          final availableHeight = constraints.maxHeight;
          final widthBasedSize = availableWidth * 0.4;
          final heightBasedSize = availableHeight * 0.3; // More aggressive height scaling
          final iconSize = (widthBasedSize < heightBasedSize ? widthBasedSize : heightBasedSize).clamp(40.0, 150.0);
          
          return Row(
            children: [
              Container(
                width: iconSize,
                height: iconSize,
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
              ],
            ),
          ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildSongDisplay() {
    Song? songToDisplay;
    String? chordSheet;
    String? chordSheetKey;
    
    // If queue is empty, provide a blank song to prevent RangeError
    if (_queue.isEmpty || _currentSongIndex < 0) {
      songToDisplay = Song(
        songId: 'blank',
        title: 'No Song Selected',
        artist: 'Add songs to the queue',
        album: '',
        albumCover: null,
        isApproved: true,
        version: 1,
        chordSheet: '',
        chordSheetKey: 'C',
        originPlatorm: null,
        originLink: null,
        CCLISongTitle: null,
        CCLISongWriter: null,
        CCLICopyrightNotice: null,
        CCLILicenseNumber: null,
      );
      chordSheet = '';
      chordSheetKey = 'C';
      if (kDebugMode && _logSongSelectionInBuild) {
        print('Using blank song for empty queue');
      }
    } else if (jamSession?.setList?.songs?.isNotEmpty == true && _currentSongIndex >= 0) {
      // Use queue to get the correct song from setlist
      final songIndexInSetlist = _queue.isNotEmpty && _currentSongIndex < _queue.length 
          ? _queue[_currentSongIndex] 
          : _currentSongIndex;
      final selectedSong = jamSession!.setList!.songs![songIndexInSetlist];
      songToDisplay = selectedSong.song;
      chordSheet = songToDisplay.chordSheet;
      chordSheetKey = songToDisplay.chordSheetKey;
      if (kDebugMode && _logSongSelectionInBuild) {
        print('Using song from jam session set list: ${songToDisplay.title} (queue index: $_currentSongIndex, setlist index: $songIndexInSetlist)');
      }
    } else if (songs?.isNotEmpty == true && _currentSongIndex >= 0) {
      final selectedSong = songs![_currentSongIndex];
      songToDisplay = selectedSong;
      chordSheet = songToDisplay.chordSheet;
      chordSheetKey = songToDisplay.chordSheetKey;
      if (kDebugMode && _logSongSelectionInBuild) {
        print('Using song from admin songs: ${songToDisplay.title} (index: $_currentSongIndex)');
      }
    }

    if (songToDisplay != null && chordSheet != null && chordSheetKey != null) {
      return GestureDetector(
        onTap: () {
          // Ensure focus is regained when tapping on the screen
          _focusNode.requestFocus();
        },
        child: Column(
          children: [
            Expanded(
              child: _buildResizableContainers(context, chordSheet, chordSheetKey),
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
                      style: FontUtils.sfPro(color: Colors.white.withValues(alpha: 0.8), fontSize: 12),
                    ),
                    const SizedBox(height: 8),
                                  Text(
                      'Raw sheet length: ${chordSheet.length} characters',
                      style: FontUtils.sfPro(color: Colors.white.withValues(alpha: 0.8), fontSize: 12),
                            ),
                            const SizedBox(height: 8),
                            Text(
                      'Raw sheet preview:',
                      style: FontUtils.sfPro(color: Colors.white.withValues(alpha: 0.8), fontSize: 12),
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
        // Ensure focus is regained when tapping on the screen
        _focusNode.requestFocus();
      },
      child: LayoutBuilder(
        builder: (context, constraints) {
          final screenWidth = constraints.maxWidth;
          final isSmallScreen = screenWidth < 600;
          final isMediumScreen = screenWidth >= 600 && screenWidth < 900;
          
          return Column(
            children: [
          // Top right buttons that shift with sidebar
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              // Key selector button
              Container(
                margin: const EdgeInsets.only(right: 8, top: 16),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.9),
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: KeySelectorWidget(
                  currentKey: _currentKey ?? 'C',
                  originalKey: 'C',
                  onKeyChanged: _isSyncingKey ? null : _onKeyChanged,
                  onKeyChangedWithSync: _isSyncingKey ? null : _onKeyChangedWithSync,
                ),
              ),
              
              
            ],
          ),
          
          // Responsive song information section for fallback
          _shouldShowSimplifiedSongInfo(context) 
            ? _buildSimplifiedSongInfo('Amazing Grace', null)
            : _buildFallbackFullSongInfo(),

          Expanded(
            child: _buildResizableContainers(context, sampleChordSheet, 'C'),
          ),


            ],
          );
        },
      ),
    );
  }

  Widget _buildLeftContainerContent(double tinySpacing, double smallSpacing, double mediumSpacing, double largeSpacing, double extraLargeSpacing, double spacingScaleFactor, Function calculateDynamicSpacing) {
    print('🎵 DEFAULT VIEW: Building left container content (song info view)');
    print('   - _isLeftContainerCollapsed: $_isLeftContainerCollapsed');
    print('   - Platform: ${PlatformUtils.isWeb ? "Web" : PlatformUtils.isDesktop ? "Desktop" : "Mobile"}');
    return LayoutBuilder(
      builder: (context, constraints) {
        final availableHeight = constraints.maxHeight;
        final screenWidth = MediaQuery.of(context).size.width;
        final screenHeight = MediaQuery.of(context).size.height;
        
        // Calculate responsive scaling factors based on screen width
        final isSmallScreen = screenWidth < 600;
        final isMediumScreen = screenWidth >= 600 && screenWidth < 900;
        
        // Calculate height-based scaling factor - moderate scaling
        final heightScaleFactor = (screenHeight / 900).clamp(0.5, 1.1); // Moderate scaling from 50% to 110%
        
        // Calculate scaling factors for different screen sizes
        double containerScaleFactor;
        double textScaleFactor;
        double spacingScaleFactor;
        
        if (isSmallScreen) {
          containerScaleFactor = 0.7; // 30% smaller
          textScaleFactor = 0.8;     // 20% smaller text
          spacingScaleFactor = 0.8;  // 20% smaller spacing
        } else if (isMediumScreen) {
          containerScaleFactor = 0.85; // 15% smaller
          textScaleFactor = 0.9;      // 10% smaller text
          spacingScaleFactor = 0.9;   // 10% smaller spacing
        } else {
          containerScaleFactor = 1.0; // Full size
          textScaleFactor = 1.0;      // Full size text
          spacingScaleFactor = 1.0;   // Full size spacing
        }
        
        // Apply height scaling to text scale factor with additional reduction
        textScaleFactor *= heightScaleFactor;
        
        // Additional height-based reduction for text elements - moderate additional scaling
        final additionalTextReduction = (screenHeight / 1000).clamp(0.7, 1.0); // Additional 70% to 100% scaling
        textScaleFactor *= additionalTextReduction;
        
        // Calculate if there's enough room for album art (minimum 80px height needed)
        final availableWidth = constraints.maxWidth;
        final albumArtSize = _calculateAlbumArtSize(availableWidth, availableHeight: availableHeight) * containerScaleFactor;
        final showAlbumArt = availableHeight > 200 && albumArtSize > 60 && screenHeight >= 400; // Hide if container too small or screen height < 400
        
        // If queue management overlay is shown, display it instead of normal content (only on left side)
        if (_showQueueManagementOverlay && !_overlayOnRightSide) {
          return Container(
            decoration: _getOutlineDecoration(Colors.green, width: 2),
            child: Stack(
          children: [
            // Queue management overlay with slide animation
            Positioned.fill(
              child: SlideTransition(
                position: _queueManagementSlideAnimation,
                child: Stack(
                  children: [
                    Container(
                      decoration: const BoxDecoration(
                        color: Colors.transparent,
                        borderRadius: BorderRadius.all(Radius.circular(12)),
                      ),
                      child: QueueManagement(
                              jamSession: jamSession,
                              currentSongIndex: _currentSongIndex,
                              queue: _queue,
                              queueRevision: _queueRevision,
                              onQueueUpdated: (newQueue, newRevision) {
                                setState(() {
                                  // Remove duplicates while preserving order and validate indices
                                  final availableSongs = jamSession?.setList?.songs?.length ?? songs?.length ?? 0;
                                  final seen = <int>{};
                                  _queue = newQueue.where((songIndex) => 
                                    seen.add(songIndex) && songIndex >= 0 && songIndex < availableSongs
                                  ).toList();
                                  _queueRevision = newRevision;
                                });
                              },
                              onSongSelected: _onSongSelected,
                              onCurrentSongChanged: (newCurrentSongIndex) {
                                setState(() {
                                  _currentSongIndex = newCurrentSongIndex ?? 0;
                                });
                              },
                            ),
                    ),
                    // Close button - now inside the slide animation
                    Positioned(
                      top: 12,
                      right: 12,
                      child: Container(
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: Colors.white.withOpacity(0.2),
                            width: 1,
                          ),
                        ),
                        child: IconButton(
                          onPressed: _closeQueueManagementOverlay,
                          icon: const Icon(Icons.keyboard_arrow_down, color: Colors.white, size: 20),
                          style: IconButton.styleFrom(
                            padding: const EdgeInsets.all(8),
                            shape: const CircleBorder(),
                          ),
                        ),
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

    // If settings overlay is shown, display it instead of normal content (only on left side)
    if (_showSettingsOverlay && !_overlayOnRightSide) {
      print('🔧 Rendering settings overlay (left side)');
      return Container(
        decoration: _getOutlineDecoration(Colors.blue, width: 2),
        child: SlideTransition(
          position: _settingsSlideAnimation,
          child: Padding(
            padding: EdgeInsets.all(16 * spacingScaleFactor),
            child: Column(
            children: [
              // Header with close button
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Settings',
                    style: TextStyle(
                      fontSize: 20 * textScaleFactor,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  IconButton(
                    onPressed: _closeSettingsOverlay,
                    icon: const Icon(Icons.close, color: Colors.white),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              // Settings content
              Expanded(
                child: SingleChildScrollView(
                  child: Column(
                    children: [
                      // Refresh option
                      _buildSettingsItem(
                        icon: Icons.refresh,
                        title: 'Refresh Jam Session',
                        onTap: () {
                          _closeSettingsOverlay();
                          _loadJamSession();
                        },
                      ),
                      // Exit Jam Session option
                      _buildSettingsItem(
                        icon: Icons.exit_to_app,
                        title: 'Exit Jam Session',
                        subtitle: 'Return to main page',
                        onTap: () {
                          print('🔘 Exit Jam Session button tapped (left side)!');
                          _closeSettingsOverlayAndExit();
                        },
                      ),
                      const Divider(color: Colors.white30),
                      
                      // Sidebar Position section
                      Text(
                        'Sidebar Position',
                        style: TextStyle(
                          fontSize: 16 * textScaleFactor,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 8),
                      _buildSettingsItem(
                        icon: Icons.arrow_back,
                        title: 'Left',
                        trailing: _sidebarPosition == SidebarPosition.left ? const Icon(Icons.check, color: Colors.green) : null,
                        onTap: () {
                          setState(() {
                            _sidebarPosition = SidebarPosition.left;
                          });
                        },
                      ),
                      _buildSettingsItem(
                        icon: Icons.arrow_forward,
                        title: 'Right',
                        trailing: _sidebarPosition == SidebarPosition.right ? const Icon(Icons.check, color: Colors.green) : null,
                        onTap: () {
                          setState(() {
                            _sidebarPosition = SidebarPosition.right;
                          });
                        },
                      ),
                      _buildSettingsItem(
                        icon: Icons.keyboard_arrow_down,
                        title: 'Bottom',
                        trailing: _sidebarPosition == SidebarPosition.bottom ? const Icon(Icons.check, color: Colors.green) : null,
                        onTap: () {
                          setState(() {
                            _sidebarPosition = SidebarPosition.bottom;
                          });
                        },
                      ),
                      const Divider(color: Colors.white30),
                      
                      // Overlay Position section
                      Text(
                        'Overlay Position',
                        style: TextStyle(
                          fontSize: 16 * textScaleFactor,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 8),
                      _buildSettingsItem(
                        icon: Icons.arrow_back,
                        title: 'Left Side',
                        subtitle: 'Show overlays on left container',
                        trailing: !_overlayOnRightSide ? const Icon(Icons.check, color: Colors.green) : null,
                        onTap: () {
                          setState(() {
                            _overlayOnRightSide = false;
                          });
                        },
                      ),
                      _buildSettingsItem(
                        icon: Icons.arrow_forward,
                        title: 'Right Side',
                        subtitle: 'Show overlays on right container (covers lyrics)',
                        trailing: _overlayOnRightSide ? const Icon(Icons.check, color: Colors.green) : null,
                        onTap: () {
                          setState(() {
                            _overlayOnRightSide = true;
                          });
                        },
                      ),
                      const Divider(color: Colors.white30),
                      
                      // Debug options
                      _buildSettingsItem(
                        icon: _showDebug ? Icons.bug_report : Icons.bug_report_outlined,
                        title: _showDebug ? 'Hide Debug Panel' : 'Show Debug Panel',
                        onTap: () {
                          setState(() {
                            _showDebug = !_showDebug;
                          });
                        },
                      ),
                      _buildSettingsItem(
                        icon: _showContainerOutlines ? Icons.border_outer : Icons.border_clear,
                        title: _showContainerOutlines ? 'Hide Container Outlines' : 'Show Container Outlines',
                        subtitle: 'Debug: Show all container borders',
                        onTap: () {
                          _toggleContainerOutlines();
                        },
                      ),
                      const Divider(color: Colors.white30),
                      
                      // Music Settings section
                      Text(
                        'Music Settings',
                        style: TextStyle(
                          fontSize: 16 * textScaleFactor,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 8),
                      _buildSettingsItem(
                        icon: Icons.music_note,
                        title: 'Key Selector',
                        subtitle: 'Current key: ${_currentKey ?? 'C'}',
                        onTap: () {
                          _openKeySelectorOverlay();
                        },
                      ),
                      _buildSettingsItem(
                        icon: Icons.tune,
                        title: 'Capo Settings',
                        subtitle: 'Current capo: ${_capo}',
                        onTap: () {
                          _openCapoSelectorOverlay();
                        },
                      ),
                      const Divider(color: Colors.white30),
                      
                      // Other options
                      _buildSettingsItem(
                        icon: Icons.text_fields,
                        title: 'Text Size',
                        onTap: () {
                          _openTextSizeOverlay();
                        },
                      ),
                      _buildSettingsItem(
                        icon: Icons.qr_code,
                        title: 'Show QR Code & PIN',
                        onTap: () {
                          _openQRCodeOverlay();
                        },
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          ),
        ),
      );
    }

    // If account overlay is shown, display it instead of normal content (only on left side)
    if (_showAccountOverlay && !_overlayOnRightSide) {
      final authService = AuthService();
      final userId = authService.currentUserId;
      
      if (userId == null) {
        return Container(
          decoration: _getOutlineDecoration(Colors.red, width: 2),
          child: Padding(
            padding: EdgeInsets.all(16 * spacingScaleFactor),
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error, color: Colors.red, size: 48),
                  SizedBox(height: 16),
                  Text(
                    'Not Authenticated',
                    style: TextStyle(
                      fontSize: 18 * textScaleFactor,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Please sign in to view account',
                    style: TextStyle(
                      fontSize: 14 * textScaleFactor,
                      color: Colors.white70,
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      }
      
      return Container(
        decoration: _getOutlineDecoration(Colors.purple, width: 2),
        child: Padding(
          padding: EdgeInsets.all(16 * spacingScaleFactor),
          child: UserAccountInterface(
            onClose: _closeAccountOverlay,
            userId: userId,
          ),
        ),
      );
    }

    // If key selector overlay is shown, display it instead of normal content
    if (_showKeySelectorOverlay) {
      return Container(
        decoration: _getOutlineDecoration(Colors.purple, width: 2),
        child: SlideTransition(
          position: _keySelectorSlideAnimation,
          child: Padding(
            padding: EdgeInsets.all(16 * spacingScaleFactor),
            child: Column(
            children: [
              // Header with close button
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(
                        Icons.music_note,
                        color: Colors.white,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Select Key',
                        style: TextStyle(
                          fontSize: 20 * textScaleFactor,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                  TextButton(
                    onPressed: _closeKeySelectorOverlay,
                    style: TextButton.styleFrom(
                      backgroundColor: const Color(0xFF007AFF), // iPhone blue
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20), // Rounded edges
                      ),
                    ),
                    child: const Text(
                      'Done',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              
              // Toggle for sync with all users
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.white.withOpacity(0.2)),
                ),
                child: Row(
                  children: [
                    Icon(
                      _keySelectorSyncWithAllUsers ? Icons.sync : Icons.sync_disabled,
                      color: _keySelectorSyncWithAllUsers ? Colors.green : Colors.grey[600],
                      size: 18,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Transpose Key for all users',
                      style: TextStyle(
                        fontSize: 14 * textScaleFactor,
                        color: Colors.white,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const Spacer(),
                    Switch(
                      value: _keySelectorSyncWithAllUsers,
                      onChanged: (value) {
                        setState(() {
                          _keySelectorSyncWithAllUsers = value;
                        });
                      },
                      activeColor: Colors.green,
                      activeTrackColor: Colors.green.shade200,
                      inactiveThumbColor: Colors.grey.shade400,
                      inactiveTrackColor: Colors.grey.shade300,
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: 16),
              const Divider(color: Colors.white30),
              const SizedBox(height: 8),
              
              // Key list
              Expanded(
                child: RepaintBoundary(
                  child: ListView.builder(
                    itemCount: _getKeyOptions().length,
                    itemBuilder: (context, index) {
                    final keyOptions = _getKeyOptions();
                    final key = keyOptions[index];
                    final isSelected = key == _currentKey;
                    final isOriginal = key == 'C'; // Assuming C is original
                    
                    String displayText = key;
                    if (isOriginal && index == 0) {
                      displayText = 'Original: $key';
                    }
                    
                    return ListTile(
                      title: Text(
                        displayText,
                        style: TextStyle(
                          fontSize: 16 * textScaleFactor,
                          fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                          color: isSelected ? Colors.white : Colors.white70,
                        ),
                      ),
                      trailing: isSelected
                          ? const Icon(
                              Icons.check,
                              color: Colors.green,
                            )
                          : null,
                      onTap: () {
                        if (_isSyncingKey) return; // Don't allow changes if syncing
                        if (_onKeyChangedWithSync != null) {
                          _onKeyChangedWithSync!(key, _keySelectorSyncWithAllUsers);
                        } else if (_onKeyChanged != null) {
                          _onKeyChanged!(key);
                        }
                      },
                      contentPadding: const EdgeInsets.symmetric(horizontal: 0, vertical: 4),
                    );
                  },
                ),
                ),
              ),
            ],
          ),
          ),
        ),
      );
    }

    // If text size overlay is shown, display it instead of normal content
    if (_showTextSizeOverlay) {
      return Container(
        decoration: _getOutlineDecoration(Colors.cyan, width: 2),
        child: SlideTransition(
          position: _textSizeSlideAnimation,
          child: Padding(
            padding: EdgeInsets.all(16 * spacingScaleFactor),
            child: Column(
            children: [
              // Header with close button
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(
                        Icons.text_fields,
                        color: Colors.white,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Text Size',
                        style: TextStyle(
                          fontSize: 20 * textScaleFactor,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                  TextButton(
                    onPressed: _closeTextSizeOverlay,
                    style: TextButton.styleFrom(
                      backgroundColor: const Color(0xFF007AFF), // iPhone blue
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20), // More rounded edges
                      ),
                    ),
                    child: const Text(
                      'Done',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              
              // Text size options
              Expanded(
                child: SingleChildScrollView(
                  child: Column(
                    children: [
                      _buildTextSizeOption('dynamic', 'Dynamic (Auto)', textScaleFactor),
                      _buildTextSizeOption('text-xs', 'Extra Small', textScaleFactor),
                      _buildTextSizeOption('text-sm', 'Small', textScaleFactor),
                      _buildTextSizeOption('text-base', 'Base', textScaleFactor),
                      _buildTextSizeOption('text-lg', 'Large', textScaleFactor),
                      _buildTextSizeOption('text-xl', 'Extra Large', textScaleFactor),
                      _buildTextSizeOption('text-2xl', '2XL', textScaleFactor),
                      _buildTextSizeOption('text-3xl', '3XL', textScaleFactor),
                      _buildTextSizeOption('text-4xl', '4XL', textScaleFactor),
                      _buildTextSizeOption('text-5xl', '5XL', textScaleFactor),
                    ],
                  ),
                ),
              ),
            ],
          ),
          ),
        ),
      );
    }

    // If QR Code overlay is shown, display it instead of normal content
    if (_showQRCodeOverlay) {
      return Container(
        decoration: _getOutlineDecoration(Colors.teal, width: 2),
        child: SlideTransition(
          position: _qrCodeSlideAnimation,
          child: Padding(
            padding: EdgeInsets.all(16 * spacingScaleFactor),
            child: Column(
            children: [
              // Header with close button
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(
                        Icons.qr_code,
                        color: Colors.white,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'QR Code & PIN',
                        style: TextStyle(
                          fontSize: 20 * textScaleFactor,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                  TextButton(
                    onPressed: _closeQRCodeOverlay,
                    style: TextButton.styleFrom(
                      backgroundColor: const Color(0xFF007AFF), // iPhone blue
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20), // Rounded edges
                      ),
                    ),
                    child: const Text(
                      'Done',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              
              // QR Code content
              Expanded(
                child: Center(
                  child: QRGeneratorWidget(
                    jamSessionId: widget.jamSessionId,
                    pin: jamSession?.pin ?? 'N/A',
                  ),
                ),
              ),
            ],
          ),
          ),
        ),
      );
    }

    // If capo selector overlay is shown, display it instead of normal content
    if (_showCapoSelectorOverlay) {
      return Container(
        decoration: _getOutlineDecoration(Colors.orange, width: 2),
        child: Padding(
          padding: EdgeInsets.all(16 * spacingScaleFactor),
          child: Column(
            children: [
              // Header with back button
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Capo Settings',
                    style: TextStyle(
                      fontSize: 20 * textScaleFactor,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  TextButton(
                    onPressed: _closeCapoSelectorOverlay,
                    style: TextButton.styleFrom(
                      backgroundColor: const Color(0xFF007AFF), // iPhone blue
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20), // Rounded edges
                      ),
                    ),
                    child: const Text(
                      'Done',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              // Capo selector content
              Expanded(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'Current Capo: $_capo',
                      style: TextStyle(
                        fontSize: 18 * textScaleFactor,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 32),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        IconButton(
                          onPressed: _capo > 0 ? () {
                            setState(() {
                              _capo--;
                            });
                          } : null,
                          icon: const Icon(Icons.remove, color: Colors.white, size: 32),
                          style: IconButton.styleFrom(
                            backgroundColor: _capo > 0 ? Colors.white.withOpacity(0.2) : Colors.grey.withOpacity(0.2),
                            padding: const EdgeInsets.all(16),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.white.withOpacity(0.3)),
                          ),
                          child: Text(
                            '$_capo',
                            style: TextStyle(
                              fontSize: 32 * textScaleFactor,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                        IconButton(
                          onPressed: _capo < 12 ? () {
                            setState(() {
                              _capo++;
                            });
                          } : null,
                          icon: const Icon(Icons.add, color: Colors.white, size: 32),
                          style: IconButton.styleFrom(
                            backgroundColor: _capo < 12 ? Colors.white.withOpacity(0.2) : Colors.grey.withOpacity(0.2),
                            padding: const EdgeInsets.all(16),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'Capo ${_capo}${_capo == 0 ? ' (Open)' : _capo == 1 ? ' (1st fret)' : ' (${_capo}th fret)'}',
                      style: TextStyle(
                        fontSize: 16 * textScaleFactor,
                        color: Colors.white70,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      );
    }

    // Get current song data
    String? realTitle;
    String? realArtist;
    String? realAlbum;
    String? realAlbumCover;
    
    // If queue is empty, provide blank song info to prevent RangeError
    if (_queue.isEmpty || _currentSongIndex < 0) {
      realTitle = 'No Song Selected';
      realArtist = 'Add songs to the queue/setlist';
      realAlbum = '';
      realAlbumCover = null;
    } else if (jamSession?.setList?.songs?.isNotEmpty == true && _currentSongIndex >= 0) {
      // Use queue to get the correct song from setlist
      final songIndexInSetlist = _queue.isNotEmpty && _currentSongIndex < _queue.length 
          ? _queue[_currentSongIndex] 
          : _currentSongIndex;
      final selectedSong = jamSession!.setList!.songs![songIndexInSetlist];
      realTitle = selectedSong.song.title;
      realArtist = selectedSong.song.artist;
      realAlbum = selectedSong.song.album;
      realAlbumCover = selectedSong.song.albumCover;
    } else if (songs?.isNotEmpty == true && _currentSongIndex >= 0) {
      final selectedSong = songs![_currentSongIndex];
      realTitle = selectedSong.title;
      realArtist = selectedSong.artist;
      realAlbum = selectedSong.album;
      realAlbumCover = selectedSong.albumCover;
    }

    // ESSENTIAL: Main left container - holds song info and navigation
    return Container(
      decoration: _getOutlineDecoration(Colors.green, width: 2),
      child: Padding(
        padding: EdgeInsets.all(20 * spacingScaleFactor),
        child: Column(
          children: [
          // Top content group - takes 4/5 of the space
          Expanded(
            flex: 4,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
              // Album Art Container - conditional based on available space
              if (showAlbumArt) ...[
                Container(
                  width: albumArtSize,
                  height: albumArtSize,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.3),
                        blurRadius: 12,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ).copyWith(
                    // Add debug outline if enabled
                    border: _showContainerOutlines 
                      ? Border.all(color: Colors.deepOrange, width: 2)
                      : null,
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: realAlbumCover != null && realAlbumCover.isNotEmpty
                        ? Image.network(
                            realAlbumCover,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) => _buildPlaceholderAlbumArt(albumArtSize),
                          )
                        : _buildPlaceholderAlbumArt(albumArtSize),
                  ),
                ),
              ],
              
              // Dynamic spacing before song title - scales based on available space
              SizedBox(height: calculateDynamicSpacing(largeSpacing, showAlbumArt, availableHeight)),
              
              // ESSENTIAL: Song Title - always visible
              Container(
                constraints: BoxConstraints(
                  minHeight: 25.0, // Minimum height as requested
                  maxHeight: 80.0, // Increased max height to accommodate two lines
                ),
                child: Text(
                  realTitle ?? 'Unknown Song',
                  style: TextStyle(
                    fontSize: 28 * textScaleFactor,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                    shadows: [
                      Shadow(
                        color: Colors.black26,
                        offset: Offset(0, 2),
                        blurRadius: 4,
                      ),
                    ],
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis, // Only ellipsis if more than 2 lines needed
                  softWrap: true, // Enable soft wrapping for better text flow
                ),
                ),
              
              // Dynamic spacing between song title and artist name
              SizedBox(height: calculateDynamicSpacing(smallSpacing, true, availableHeight)),
              
              // Artist Name
                Text(
                realArtist ?? 'Unknown Artist',
                style: TextStyle(
                  fontSize: 18 * textScaleFactor,
                  color: Colors.white70,
                  fontWeight: FontWeight.w500,
                ),
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              
              // Dynamic spacing between artist name and album name
              SizedBox(height: calculateDynamicSpacing(tinySpacing, true, availableHeight)),
              
              // Album Name
                Text(
                realAlbum ?? 'Unknown Album',
                style: TextStyle(
                  fontSize: 14 * textScaleFactor,
                  color: Colors.white60,
                  fontStyle: FontStyle.italic,
                ),
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              
              // Dynamic spacing between album name and pagination - scales based on available space
              SizedBox(height: calculateDynamicSpacing(20 * spacingScaleFactor, true, availableHeight)),
              
              // ESSENTIAL: Pagination controls - not expanded, so it can be flexible
              Flexible(
                child: _buildLeftContainerPagination(containerScaleFactor, textScaleFactor, spacingScaleFactor),
              ),
              ],
            ),
          ),
          
          // Bottom section - takes 1/5 of the space
          Expanded(
            flex: 1,
            child: Align(
              alignment: Alignment.bottomCenter,
              child: Container(
                // Calculate container height based on screen height - more flexible
                constraints: BoxConstraints(
                  minHeight: (80 * heightScaleFactor).clamp(60.0, 100.0),
                  maxHeight: (160 * heightScaleFactor).clamp(120.0, 200.0),
                ),
                margin: EdgeInsets.all(12 * spacingScaleFactor),
                padding: EdgeInsets.all(12 * spacingScaleFactor),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(16 * spacingScaleFactor),
                  border: Border.all(
                    color: Colors.white.withOpacity(0.1),
                    width: 1,
                  ),
                ).copyWith(
                  // Add debug outline for glassy container
                  border: _showContainerOutlines 
                    ? Border.all(color: Colors.blue, width: 3)
                    : Border.all(
                        color: Colors.white.withOpacity(0.1),
                        width: 1,
                      ),
                ),
                 child: Column(
                   mainAxisAlignment: MainAxisAlignment.center,
                   children: [
                     // Song navigation features - flexible
                     Flexible(
                       child: _buildSongNavigationFeatures(containerScaleFactor, textScaleFactor, spacingScaleFactor, tinySpacing, smallSpacing, mediumSpacing, largeSpacing, extraLargeSpacing, calculateDynamicSpacing),
                     ),
                   ],
                 ),
              ),
            ),
          ),
        ],
        ),
      ),
    );
      },
    );
  }

  Widget _buildPlaceholderAlbumArt(double size) {
    return Container(
      color: Colors.grey[800],
      child: Icon(
        Icons.music_note,
        color: Colors.white54,
        size: size * 0.4, // Make icon proportional to container size
      ),
    );
  }

  double _calculateAlbumArtSize(double availableWidth, {double? availableHeight}) {
    // Calculate album art size based on both available width and height
    // Use 75% of the available width, but also consider height constraints
    final widthBasedSize = availableWidth * 0.75;
    final heightBasedSize = availableHeight != null ? availableHeight * 0.5 : widthBasedSize;
    
    // Use the smaller of the two to ensure it fits in both dimensions
    final calculatedSize = availableHeight != null 
        ? (widthBasedSize < heightBasedSize ? widthBasedSize : heightBasedSize)
        : widthBasedSize;
    
    // More aggressive scaling with lower minimum
    return calculatedSize.clamp(80.0, 400.0);
  }

  Widget _buildLeftContainerPagination(double containerScaleFactor, double textScaleFactor, double spacingScaleFactor) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final availableHeight = constraints.maxHeight;
        final screenHeight = MediaQuery.of(context).size.height;
        
        // Height-based scaling from container height
        final containerHeightRatio = (availableHeight / 100).clamp(0.5, 2.0);
        // Height-based scaling from screen height (same as other elements)
        final screenHeightRatio = (screenHeight / 800).clamp(0.6, 1.2);
        
        // Combine both height scaling factors
        final combinedHeightRatio = containerHeightRatio * screenHeightRatio;
        
        // Additional height reduction factor for smaller screens - more gradual scaling
        final heightReductionFactor = (screenHeight / 800).clamp(0.75, 1.0); // Gradual scaling from 75% to 100%
        
        // Conservative width scaling - shrinks slower and by less
        final widthScaleFactor = (screenHeight / 1000).clamp(0.85, 1.0); // Very conservative width scaling
        
        // Responsive padding and sizing based on combined height ratio and screen size
        final horizontalPadding = (12 * combinedHeightRatio * spacingScaleFactor * widthScaleFactor).clamp(8.0, 20.0); // Less responsive to height, higher minimum
        final verticalPadding = (8 * combinedHeightRatio * spacingScaleFactor * heightReductionFactor).clamp(4.0, 16.0); // Increased min from 2.0 to 4.0
        final iconSize = (14 * combinedHeightRatio * containerScaleFactor * heightReductionFactor).clamp(8.0, 20.0); // More aggressive scaling
        final fontSize = (12 * combinedHeightRatio * textScaleFactor).clamp(10.0, 16.0); // Increased min from 8.0 to 10.0
        
        // Calculate icon style based on height - flatter icons for smaller heights
        final isSmallHeight = screenHeight < 600;
        final iconData = isSmallHeight ? Icons.chevron_left : Icons.arrow_back_ios;
        final nextIconData = isSmallHeight ? Icons.chevron_right : Icons.arrow_forward_ios;
        
        return SizedBox(
          // Set minimum height to 29px but don't shrink original size on normal screens
          height: math.max(29.0, (65.0 * heightReductionFactor)), // Original size 65px, minimum 29px
          child: Container(
            padding: EdgeInsets.symmetric(horizontal: horizontalPadding, vertical: verticalPadding),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: Colors.white.withOpacity(0.3),
          width: 1,
        ),
      ).copyWith(
        // Add debug outline if enabled
        border: _showContainerOutlines 
          ? Border.all(color: Colors.cyan, width: 2)
          : Border.all(
              color: Colors.white.withOpacity(0.3),
              width: 1,
            ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Previous page button
          IconButton(
            onPressed: (_currentPage > 0 && !_isSyncingPage) ? _previousPage : null,
            icon: Icon(
              iconData,
              color: (_currentPage > 0 && !_isSyncingPage) ? Colors.white : Colors.white.withValues(alpha: 0.3),
              size: iconSize,
            ),
            padding: EdgeInsets.zero,
            constraints: BoxConstraints(
              minWidth: iconSize * (2 * heightReductionFactor), 
              minHeight: iconSize * (2 * heightReductionFactor)
            ),
          ),
          
          SizedBox(width: 8 * spacingScaleFactor * widthScaleFactor),
          
          // Page number display
          Text(
            '${_currentPage + 1}${_getTotalPages() != null ? ' / ${_getTotalPages()}' : ''}',
            style: TextStyle(
              color: Colors.white,
              fontSize: fontSize,
              fontWeight: FontWeight.w600,
            ),
          ),
          
          SizedBox(width: 8 * spacingScaleFactor * widthScaleFactor),
          
          // Next page button
          IconButton(
            onPressed: (_isLastPage || _isSyncingPage) ? null : _nextPage,
            icon: Icon(
              nextIconData,
              color: (_isLastPage || _isSyncingPage) ? Colors.white.withValues(alpha: 0.3) : Colors.white,
              size: iconSize,
            ),
            padding: EdgeInsets.zero,
            constraints: BoxConstraints(
              minWidth: iconSize * (2 * heightReductionFactor), 
              minHeight: iconSize * (2 * heightReductionFactor)
            ),
          ),
        ],
      ),
          ),
        );
      },
    );
  }


  Widget _buildSongNavigationFeatures(double containerScaleFactor, double textScaleFactor, double spacingScaleFactor, double tinySpacing, double smallSpacing, double mediumSpacing, double largeSpacing, double extraLargeSpacing, Function calculateDynamicSpacing) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final availableHeight = constraints.maxHeight;
        final availableWidth = constraints.maxWidth;
        final screenHeight = MediaQuery.of(context).size.height;
        final screenWidth = MediaQuery.of(context).size.width;
        
        // Smart responsive behavior: determine if we're width-constrained or height-constrained
        final isWidthConstrained = availableWidth < 400; // Narrow screens
        final isHeightConstrained = availableHeight < 80; // Short screens
        
        // Calculate responsive sizing based on the primary constraint
        double heightRatio, fontSize, iconSize;
        
        if (isWidthConstrained) {
          // Width-constrained: prioritize horizontal space, reduce height
          heightRatio = (availableHeight / 60).clamp(0.4, 1.2);
          fontSize = (8 * heightRatio * textScaleFactor).clamp(6.0, 10.0);
          iconSize = (10 * heightRatio * containerScaleFactor).clamp(6.0, 14.0);
        } else if (isHeightConstrained) {
          // Height-constrained: prioritize vertical space, reduce width
          heightRatio = (availableHeight / 60).clamp(0.3, 1.0);
          fontSize = (7 * heightRatio * textScaleFactor).clamp(5.0, 9.0);
          iconSize = (8 * heightRatio * containerScaleFactor).clamp(6.0, 12.0);
        } else {
          // Normal sizing
          heightRatio = (availableHeight / 60).clamp(0.5, 1.5);
          fontSize = (9 * heightRatio * textScaleFactor).clamp(6.0, 12.0);
          iconSize = (12 * heightRatio * containerScaleFactor).clamp(8.0, 16.0);
        }
        
        // Calculate icon style based on height - flatter icons for smaller heights
        final isSmallHeight = screenHeight < 600;
        final prevIconData = isSmallHeight ? Icons.chevron_left : Icons.arrow_back_ios;
        final nextIconData = isSmallHeight ? Icons.chevron_right : Icons.arrow_forward_ios;
        
        // ESSENTIAL: Navigation controls - previous/next song buttons
        return Row(
          children: [
          // ESSENTIAL: Previous song button and title
          Expanded(
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: _hasPreviousSong() ? _goToPreviousSong : null,
                borderRadius: BorderRadius.circular(8 * spacingScaleFactor),
                child: Container(
                  decoration: _getOutlineDecoration(Colors.green, width: 2), // Debug outline for previous button container
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Previous arrow button (Container C - no box around arrow)
                      Icon(
                        prevIconData,
                        color: _hasPreviousSong() 
                            ? Colors.white 
                            : Colors.grey.withOpacity(0.5),
                        size: iconSize,
                      ),
                      SizedBox(height: 2 * spacingScaleFactor),
                      // Previous song title
                      Builder(
                        builder: (context) {
                          final previousQueueIndex = _currentSongIndex > 0 ? _currentSongIndex - 1 : null;
                          final previousSongTitle = _getPreviousSongTitle(queueIndex: previousQueueIndex);
                          return Text(
                            previousSongTitle,
                            style: TextStyle(
                              color: _hasPreviousSong() 
                                  ? Colors.white.withOpacity(0.8)
                                  : Colors.grey.withOpacity(0.5),
                              fontSize: fontSize,
                              fontWeight: FontWeight.w400,
                            ),
                            textAlign: TextAlign.center,
                            overflow: TextOverflow.ellipsis,
                            maxLines: 1,
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          
          SizedBox(width: 1 * spacingScaleFactor), // Even smaller gap between previous and next song buttons
          
          // ESSENTIAL: Next song button and title
          Expanded(
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: _hasNextSong() ? _goToNextSong : null,
                borderRadius: BorderRadius.circular(8 * spacingScaleFactor),
                child: Container(
                  decoration: _getOutlineDecoration(Colors.pink, width: 2), // Debug outline for next button container
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Next arrow button (Container C - no box around arrow)
                      Icon(
                        nextIconData,
                        color: _hasNextSong() 
                            ? Colors.white 
                            : Colors.grey.withOpacity(0.5),
                        size: iconSize,
                      ),
                      SizedBox(height: 2 * spacingScaleFactor),
                      // Next song title
                      Text(
                        _getNextSongTitle(queueIndex: _computeNextQueuePosition()),
                        style: TextStyle(
                          color: _hasNextSong() 
                              ? Colors.white.withOpacity(0.8)
                              : Colors.grey.withOpacity(0.5),
                          fontSize: fontSize,
                          fontWeight: FontWeight.w400,
                        ),
                        textAlign: TextAlign.center,
                        overflow: TextOverflow.ellipsis,
                        maxLines: 1,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      );
      },
    );
  }

  // Helper methods for song selector features (from sidebar)
  String? _cachedNextSongTitle;
  int? _cachedNextSongIndex;
  int? _cachedQueueIndex;
  
  String _getNextSongTitle({int? queueIndex}) {
    // Return cached result if nothing has changed
    if (_cachedNextSongTitle != null && 
        _cachedNextSongIndex == _computeNextQueuePosition() && 
        _cachedQueueIndex == queueIndex) {
      return _cachedNextSongTitle!;
    }
    
    String result = 'No songs in set';
    
    // If we have a queue, only check the queue for next song
    if (_queue.isNotEmpty) {
      if (jamSession?.setList?.songs?.isNotEmpty == true) {
        final songs = jamSession!.setList!.songs!;
        
        // Check if nextSongIndex is null (current song is last in queue)
        final nextIndex = _computeNextQueuePosition();
        if (nextIndex == null) {
          result = 'No next song';
        } else if (nextIndex >= 0 && nextIndex < _queue.length) {
          // nextSongIndex is now a queue position, get the setlist index from queue
          final setlistIndex = _queue[nextIndex];
          if (setlistIndex >= 0 && setlistIndex < songs.length) {
            final title = songs[setlistIndex].song.title;
            final queuePos = queueIndex != null ? ' (Queue #${queueIndex + 1})' : '';
            result = '$title$queuePos';
          } else {
            result = 'No next song';
          }
        } else {
          result = 'No next song';
        }
      } else {
        result = 'No next song';
      }
    } else {
      // When queue is empty, always show "No next song" - don't fallback to sequential navigation
      result = 'No next song';
    }
    
    // Cache the result
    _cachedNextSongTitle = result;
    _cachedNextSongIndex = _computeNextQueuePosition();
    _cachedQueueIndex = queueIndex;
    
    return result;
  }

  // Previous song helper methods - cached for performance
  String? _cachedPreviousSongTitle;
  int? _cachedPreviousSongIndex;
  int? _cachedPreviousQueueIndex;
  
  String _getPreviousSongTitle({int? queueIndex}) {
    // Return cached result if nothing has changed
    if (_cachedPreviousSongTitle != null && 
        _cachedPreviousSongIndex == _currentSongIndex && 
        _cachedPreviousQueueIndex == queueIndex) {
      return _cachedPreviousSongTitle!;
    }
    
    String result = 'No songs in set';
    
    if (jamSession?.setList?.songs?.isNotEmpty == true) {
      final songs = jamSession!.setList!.songs!;
      
      // Use queue-based previous song if available
      if (_currentSongIndex > 0 && _queue.isNotEmpty && _currentSongIndex < _queue.length) {
        // currentSongIndex is the queue position, get the previous song from queue
        final previousQueueIndex = _currentSongIndex - 1;
        if (previousQueueIndex >= 0 && previousQueueIndex < _queue.length) {
          final setlistIndex = _queue[previousQueueIndex];
          if (setlistIndex >= 0 && setlistIndex < songs.length) {
            final title = songs[setlistIndex].song.title;
            final queuePos = queueIndex != null ? ' (Queue #${queueIndex + 1})' : '';
            result = '$title$queuePos';
          }
        }
      } else if (_currentSongIndex > 0 && _currentSongIndex - 1 < songs.length) {
        // Fallback to sequential navigation
        final title = songs[_currentSongIndex - 1].song.title;
        final queuePos = queueIndex != null ? ' (Queue #${queueIndex + 1})' : '';
        result = '$title$queuePos';
      } else {
        result = 'No previous song';
      }
    }
    
    // Cache the result
    _cachedPreviousSongTitle = result;
    _cachedPreviousSongIndex = _currentSongIndex;
    _cachedPreviousQueueIndex = queueIndex;
    
    return result;
  }

  Widget _buildResizableContainers(BuildContext context, String? chordSheet, String? chordSheetKey) {
    // Handle null values
    final safeChordSheet = chordSheet ?? '';
    final safeChordSheetKey = chordSheetKey ?? 'C';
    
    return LayoutBuilder(
      builder: (context, constraints) {
        final screenWidth = constraints.maxWidth;
        final isSmallScreen = screenWidth < 600;
        final isMediumScreen = screenWidth >= 600 && screenWidth < 900;
        
        // Calculate spacing scale factor
        double spacingScaleFactor;
        if (isSmallScreen) {
          spacingScaleFactor = 0.8;  // 20% smaller spacing
        } else if (isMediumScreen) {
          spacingScaleFactor = 0.9;   // 10% smaller spacing
        } else {
          spacingScaleFactor = 1.0;   // Full size spacing
        }
        
        // Responsive spacing constants
        final tinySpacing = 4 * spacingScaleFactor;
        final smallSpacing = 8 * spacingScaleFactor;
        final mediumSpacing = 16 * spacingScaleFactor;
        final largeSpacing = 24 * spacingScaleFactor;
        final extraLargeSpacing = 32 * spacingScaleFactor;
        
        // Dynamic spacing calculation based on available space and visible elements
        final calculateDynamicSpacing = (double baseSpacing, bool isElementVisible, double availableSpace) {
          if (!isElementVisible) return 0.0;
          // Scale spacing based on available space - more space = more spacing
          final spaceRatio = (availableSpace / 200).clamp(0.5, 1.5);
          return (baseSpacing * spaceRatio).clamp(baseSpacing * 0.5, baseSpacing * 1.5);
        };
        
        // Responsive margins and padding
        final margin = isSmallScreen ? 8.0 : isMediumScreen ? 12.0 : 16.0;
        final borderRadius = isSmallScreen ? 16.0 : isMediumScreen ? 20.0 : 24.0;
        final borderWidth = isSmallScreen ? 2.0 : isMediumScreen ? 3.0 : 4.0;
        
        // ESSENTIAL: Main resizable container - holds left and right sections
        return Container(
          margin: EdgeInsets.all(margin),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(borderRadius),
            border: _showContainerOutlines 
              ? Border.all(
                  color: Colors.purple,
                  width: borderWidth,
                )
              : null,
          ),
          child: LayoutBuilder(
            builder: (context, constraints) {
              // Calculate divider width for responsive design
              final dividerWidth = (isSmallScreen ? 6.0 : 8.0) * spacingScaleFactor; // Responsive divider width
          
              return RepaintBoundary(
                child: AnimatedBuilder(
                  animation: _leftContainerWidthAnimation,
                  builder: (context, child) {
                  // Calculate actual widths based on animation state
                  // Use 1/10 ratio if in ultra collapsed mode, otherwise use animation value
                  final widthRatio = _isSliderFixed ? 0.1 : _leftContainerWidthAnimation.value;
                  final calculatedLeftWidth = constraints.maxWidth * widthRatio;
                  
                  // Ensure minimum width for left container when collapsed (at least 60px for buttons)
                  // This applies whether in ultra collapsed mode or just collapsed normally
                  final minWidthForCollapsed = _isLeftContainerCollapsed ? 60.0 : 0.0;
                  final leftWidth = math.max(calculatedLeftWidth, minWidthForCollapsed);
                  
                  if (_isSliderFixed) {
                    print('🔧 WIDTH CALC: Using ultra collapsed ratio (0.1) - Blue container (Apple widgets) animated out');
                    print('🔧 WIDTH CALC: Applied minimum width of 60px for button visibility');
                  } else if (_isLeftContainerCollapsed) {
                    print('🔧 WIDTH CALC: Using animation value (${_leftContainerWidthAnimation.value}) - Blue container (Apple widgets) visible in collapsed view');
                    print('🔧 WIDTH CALC: Applied minimum width of 60px for collapsed button visibility');
                  } else {
                    print('🔧 WIDTH CALC: Using animation value (${_leftContainerWidthAnimation.value}) - Expanded view');
                  }
                  final rightWidth = constraints.maxWidth - leftWidth - dividerWidth;
                  
                  return Row(
                    children: [
                      // Left column - show when not collapsed (unified layout for all platforms)
                      if (!_isLeftContainerCollapsed) ...[
                        // Unified layout for all platforms - show normal left container
                        () {
                          print('🎵 MAIN LAYOUT: Showing default song view (not collapsed)');
                          return SizedBox(
                          width: leftWidth,
                          child: Column(
                            children: [
                              // Left container - song info and navigation
                              Expanded(
                                child: Container(
                                  margin: EdgeInsets.fromLTRB(
                                    (isSmallScreen ? 8 : isMediumScreen ? 10 : 12) * spacingScaleFactor,
                                    (isSmallScreen ? 8 : isMediumScreen ? 10 : 12) * spacingScaleFactor,
                                    (isSmallScreen ? 8 : isMediumScreen ? 10 : 12) * spacingScaleFactor,
                                    (isSmallScreen ? 8 : isMediumScreen ? 10 : 12) * spacingScaleFactor, // Consistent bottom margin
                                  ),
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(20),
                                    border: _showContainerOutlines 
                                      ? Border.all(color: Colors.blue, width: 3)
                                      : null,
                                  ),
                                  child: Stack(
                                    children: [
                                      // Main content
                                      _buildLeftContainerContent(tinySpacing, smallSpacing, mediumSpacing, largeSpacing, extraLargeSpacing, spacingScaleFactor, calculateDynamicSpacing),
                                      
                                      // Pull tab button in top right corner - only show when no overlays are active
                                      if (!_showQueueManagementOverlay && !_showSettingsOverlay && !_showAccountOverlay && !_showKeySelectorOverlay && !_showCapoSelectorOverlay && !_showTextSizeOverlay && !_showQRCodeOverlay)
                                        Positioned(
                                          top: 8,
                                          right: 8,
                                          child: _buildCollapseButton(),
                                        ),
                                    ],
                                  ),
                                ),
                              ),
                              
                              // Container W - Apple-style widgets (animated layout)
                              _buildAnimatedContainerW(tinySpacing, smallSpacing, mediumSpacing, largeSpacing, extraLargeSpacing, spacingScaleFactor, calculateDynamicSpacing, isCollapsed: false),
                            ],
                          ),
                        );
                        }(),
                      ] else ...[
                        // When collapsed, show Container W with simplified height animation
                        () {
                          print('🎵 MAIN LAYOUT: Showing collapsed view (simplified single-container animation)');
                          print('   - Ultra collapsed (Apple widgets hidden): $_isSliderFixed');
                          print('   - Slider fixed: $_isSliderFixed');
                          return SizedBox(
                            width: leftWidth,
                            child: Stack(
                              children: [
                                // Show different content based on whether in ultra collapsed mode
                                if (_isSliderFixed) ...[
                                  // Ultra collapsed: Show control buttons + paginator, blue container (Apple widgets) is animated out
                                  Container(
                                    width: leftWidth,
                                    height: constraints.maxHeight,
                                    decoration: BoxDecoration(
                                      color: Colors.transparent,
                                      border: _showContainerOutlines 
                                        ? Border.all(color: Colors.purple, width: 3)
                                        : null,
                                    ),
                                    child: Column(
                                      children: [
                                        // Control button at the top (only lock button in ultra collapsed)
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.end,
                                          children: [
                                            _buildFixSliderButton(),
                                          ],
                                        ),
                                        const SizedBox(height: 8),
                                        // Paginator in the remaining space
                                        Expanded(
                                          child: Container(
                                            margin: const EdgeInsets.all(8),
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
                                            decoration: BoxDecoration(
                                              color: Colors.white.withOpacity(0.1),
                                              borderRadius: BorderRadius.circular(16),
                                              border: Border.all(color: Colors.white.withOpacity(0.2), width: 1),
                                            ).copyWith(
                                              // Add debug outline if enabled
                                              border: _showContainerOutlines 
                                                ? Border.all(color: Colors.orange, width: 2)
                                                : Border.all(color: Colors.white.withOpacity(0.2), width: 1),
                                            ),
                                            child: _buildVerticalPagination(isCollapsed: true),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ] else ...[
                                  // Normal collapsed: Show buttons + Container W (Apple widgets) with animation
                                  Stack(
                                    children: [
                                      // Container W (Apple widgets) with slide animation
                                      AnimatedBuilder(
                                        animation: _containerWSlideAnimationController,
                                        builder: (context, child) {
                                          final animationValue = _containerWSlideAnimationController.value;
                                          print('🎬 ANIMATION SLIDE: Container W (Apple widgets) slide animation value: $animationValue');
                                          
                                          // Calculate height based on animation progress
                                          final bottomMargin = (isSmallScreen ? 8 : isMediumScreen ? 10 : 12) * spacingScaleFactor;
                                          final availableHeight = constraints.maxHeight - bottomMargin;
                                          
                                          // If animation is reset (value = 0), show full height
                                          // If animation is forward (value = 1), start from 20% and expand to full height
                                          final currentHeight = animationValue == 0.0 
                                            ? availableHeight  // Full height when reset (normal collapsed view)
                                            : availableHeight * 0.2 + (availableHeight * 0.8) * animationValue;  // Animated height when transitioning
                                          
                                          print('🎬 ANIMATION HEIGHT: animationValue=$animationValue, availableHeight=$availableHeight, currentHeight=$currentHeight');
                                          
                                          return Container(
                                            width: leftWidth,
                                            height: currentHeight,
                                            margin: EdgeInsets.fromLTRB(
                                              (isSmallScreen ? 8 : isMediumScreen ? 10 : 12) * spacingScaleFactor,
                                              (isSmallScreen ? 8 : isMediumScreen ? 10 : 12) * spacingScaleFactor,
                                              (isSmallScreen ? 8 : isMediumScreen ? 10 : 12) * spacingScaleFactor,
                                              (isSmallScreen ? 8 : isMediumScreen ? 10 : 12) * spacingScaleFactor,
                                            ),
                                            decoration: BoxDecoration(
                                              borderRadius: BorderRadius.circular(20),
                                              border: _showContainerOutlines 
                                                ? Border.all(color: Colors.blue, width: 3) // Blue container for Apple widgets
                                                : null,
                                            ),
                                            child: _buildAnimatedContainerW(tinySpacing, smallSpacing, mediumSpacing, largeSpacing, extraLargeSpacing, spacingScaleFactor, calculateDynamicSpacing, isCollapsed: true),
                                          );
                                        },
                                      ),
                                      
                                      // Buttons overlay
                                      Positioned(
                                        top: 8,
                                        right: 8,
                                        child: _buildCollapseButton(),
                                      ),
                                      Positioned(
                                        top: 56, // 8 + 40 (button height) + 8 (spacing)
                                        right: 8,
                                        child: _buildFixSliderButton(),
                                      ),
                                    ],
                                  ),
                                ],
                              ],
                            ),
                          );
                        }(),
                      ],
                
                  // Draggable divider - for resizing
                    MouseRegion(
                      cursor: SystemMouseCursors.resizeColumn,
                      onEnter: (event) {
                        setState(() {
                          _isHoveringDivider = true;
                        });
                      },
                      onExit: (event) {
                        setState(() {
                          _isHoveringDivider = false;
                        });
                      },
                      child: GestureDetector(
                        onPanStart: (details) {
                          setState(() {
                            _isDragging = true;
                          });
                        },
                        onPanUpdate: (details) {
                          if (_isDragging) {
                            // Calculate the change in ratio based on the pan delta and total available width
                            final availableWidth = constraints.maxWidth - dividerWidth;
                            final deltaRatio = details.delta.dx / availableWidth;
                            final newRatio = _leftContainerWidthRatio + deltaRatio;
                            
                            // Apply constraints: 1/4 (0.25) to 1/2 (0.5)
                            final constrainedRatio = newRatio.clamp(1.0/4.0, 1.0/2.0);
                            
                            setState(() {
                              _leftContainerWidthRatio = constrainedRatio;
                            });
                          }
                        },
                        onPanEnd: (details) {
                          setState(() {
                            _isDragging = false;
                          });
                        },
                        child: Container(
                          width: dividerWidth,
                          color: _isDragging ? Colors.blue.withOpacity(0.5) : Colors.transparent,
                          child: Container(
                            width: dividerWidth,
                            decoration: BoxDecoration(
                              color: (_isHoveringDivider || _isDragging) 
                                ? Colors.grey.withOpacity(0.3)
                                : Colors.transparent,
                              borderRadius: BorderRadius.circular(4),
                            ).copyWith(
                              // Add debug outline if enabled
                              border: _showContainerOutlines 
                                ? Border.all(color: Colors.yellow, width: 2)
                                : null,
                            ),
                          ),
                        ),
                      ),
                    ),
                  
                      // ESSENTIAL: Right container (lyrics container) - main content
                      SizedBox(
                        width: rightWidth,
                        child: Container(
                      margin: EdgeInsets.fromLTRB(
                        (isSmallScreen ? 8 : isMediumScreen ? 10 : 12) * spacingScaleFactor,
                        (isSmallScreen ? 8 : isMediumScreen ? 10 : 12) * spacingScaleFactor,
                        (isSmallScreen ? 8 : isMediumScreen ? 10 : 12) * spacingScaleFactor,
                        (isSmallScreen ? 8 : isMediumScreen ? 10 : 12) * spacingScaleFactor,
                      ),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(20),
                        border: _showContainerOutlines 
                          ? Border.all(color: Colors.red, width: 3)
                          : null,
                      ),
                      child: _buildRightContainerContent(),
                    ),
                  ),
                    ],
                  );
                },
              ),
            );
            },
          ),
        );
      },
    );
  }

  void _showUserAccountMenu() {
    final authService = AuthService();
    final userId = authService.currentUserId;
    
    if (userId == null) {
      // Show error dialog if not authenticated
      showDialog(
        context: context,
        builder: (context) => Dialog(
          backgroundColor: Colors.transparent,
          child: Container(
            decoration: BoxDecoration(
              color: Colors.red[900],
              borderRadius: BorderRadius.circular(12),
            ),
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.error, color: Colors.red, size: 48),
                const SizedBox(height: 16),
                Text(
                  'Not Authenticated',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Please sign in to view account',
                  style: const TextStyle(
                    fontSize: 14,
                    color: Colors.white70,
                  ),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Close'),
                ),
              ],
            ),
          ),
        ),
      );
      return;
    }
    
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        child: UserAccountInterface(
          onClose: () => Navigator.pop(context),
          userId: userId,
        ),
      ),
    );
  }
}
