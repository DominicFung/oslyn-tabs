import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Security validation utility for input sanitization and protection
class SecurityValidator {
  static const int _maxJamIdLength = 50;
  static const int _minJamIdLength = 3;
  static const int _pinLength = 6; // For new PIN format
  static const int _maxAttempts = 5;
  static const int _rateLimitWindowMinutes = 5;
  
  // Allowed characters for jam ID (alphanumeric, hyphens, underscores)
  static final RegExp _allowedCharsRegex = RegExp(r'^[a-zA-Z0-9\-_]+$');
  
  // PIN format: 6 characters, alphanumeric only
  static final RegExp _pinRegex = RegExp(r'^[A-Z0-9]{6}$');
  
  // Malicious patterns to detect and block
  static final List<RegExp> _maliciousPatterns = [
    RegExp(r'(\bSELECT\b|\bUNION\b|\bINSERT\b|\bDELETE\b|\bUPDATE\b|\bDROP\b)', caseSensitive: false),
    RegExp(r'(\bSCRIPT\b|\bONLOAD\b|\bONERROR\b|\bJAVASCRIPT\b)', caseSensitive: false),
    RegExp(r'(<script|<iframe|<object|<embed)', caseSensitive: false),
    RegExp(r'(javascript:|vbscript:|data:)', caseSensitive: false),
    RegExp(r'(\$\{|\$\(|<%|%>)', caseSensitive: false),
    RegExp(r'(eval\s*\(|exec\s*\(|system\s*\()', caseSensitive: false),
    RegExp(r'(\.\.\/|\.\.\\|\/etc\/|\/proc\/)', caseSensitive: false),
    RegExp(r'(\|\||&&|;|\||`)', caseSensitive: false),
  ];

  /// Validates and sanitizes jam session ID input
  static ValidationResult validateJamId(String input) {
    final stopwatch = Stopwatch()..start();
    
    try {
      // 1. Basic null/empty check
      if (input.trim().isEmpty) {
        return ValidationResult.invalid('Jam ID cannot be empty');
      }

      final trimmedInput = input.trim();
      final cleanInput = trimmedInput.toUpperCase();

      // 2. Check if it's a PIN format (6 characters, alphanumeric)
      if (cleanInput.length == _pinLength) {
        if (_pinRegex.hasMatch(cleanInput)) {
          stopwatch.stop();
          print('🔒 PIN format validation completed in ${stopwatch.elapsedMilliseconds}ms');
          return ValidationResult.valid(cleanInput);
        } else {
          _logSecurityEvent('INVALID_PIN_FORMAT', cleanInput);
          return ValidationResult.invalid('Invalid PIN format. Must be 6 characters (letters and numbers only)');
        }
      }

      // 3. Length validation for legacy UUID format
      if (cleanInput.length < _minJamIdLength) {
        _logSecurityEvent('INVALID_LENGTH_TOO_SHORT', cleanInput);
        return ValidationResult.invalid('Jam ID must be at least $_minJamIdLength characters');
      }

      if (cleanInput.length > _maxJamIdLength) {
        _logSecurityEvent('INVALID_LENGTH_TOO_LONG', cleanInput);
        return ValidationResult.invalid('Jam ID cannot exceed $_maxJamIdLength characters');
      }

      // 4. Character validation for legacy format
      if (!_allowedCharsRegex.hasMatch(cleanInput)) {
        _logSecurityEvent('INVALID_CHARACTERS', cleanInput);
        return ValidationResult.invalid('Jam ID contains invalid characters. Only letters, numbers, hyphens, and underscores are allowed');
      }

      // 4. Malicious pattern detection
      for (final pattern in _maliciousPatterns) {
        if (pattern.hasMatch(cleanInput)) {
          _logSecurityEvent('MALICIOUS_PATTERN_DETECTED', cleanInput, pattern: pattern.pattern);
          return ValidationResult.invalid('Invalid input detected');
        }
      }

      // 5. Additional security checks
      final securityChecks = _performAdvancedSecurityChecks(cleanInput);
      if (!securityChecks.isValid) {
        return securityChecks;
      }

      stopwatch.stop();
      print('🔒 Security validation completed in ${stopwatch.elapsedMilliseconds}ms');
      
      // For UUIDs, preserve original case; for PINs, use uppercase
      return ValidationResult.valid(trimmedInput);
      
    } catch (e) {
      stopwatch.stop();
      _logSecurityEvent('VALIDATION_ERROR', input, error: e.toString());
      return ValidationResult.invalid('Validation error occurred');
    }
  }

  /// Performs advanced security checks
  static ValidationResult _performAdvancedSecurityChecks(String input) {
    // Check for excessive repetition (potential DoS)
    if (_hasExcessiveRepetition(input)) {
      _logSecurityEvent('EXCESSIVE_REPETITION', input);
      return ValidationResult.invalid('Invalid input pattern');
    }

    // Check for encoded attacks
    if (_hasEncodedAttacks(input)) {
      _logSecurityEvent('ENCODED_ATTACK_DETECTED', input);
      return ValidationResult.invalid('Invalid input detected');
    }

    // Check for binary data
    if (_hasBinaryData(input)) {
      _logSecurityEvent('BINARY_DATA_DETECTED', input);
      return ValidationResult.invalid('Invalid input format');
    }

    return ValidationResult.valid(input);
  }

  /// Checks for excessive character repetition
  static bool _hasExcessiveRepetition(String input) {
    if (input.length < 4) return false;
    
    for (int i = 0; i < input.length - 3; i++) {
      final char = input[i];
      int count = 1;
      for (int j = i + 1; j < input.length && j < i + 10; j++) {
        if (input[j] == char) {
          count++;
          if (count > 5) return true; // More than 5 consecutive same characters
        } else {
          break;
        }
      }
    }
    return false;
  }

  /// Checks for various encoding attacks
  static bool _hasEncodedAttacks(String input) {
    final lowerInput = input.toLowerCase();
    
    // URL encoding patterns
    if (lowerInput.contains('%') && RegExp(r'%[0-9a-f]{2}').hasMatch(lowerInput)) {
      final decoded = Uri.decodeFull(input);
      for (final pattern in _maliciousPatterns) {
        if (pattern.hasMatch(decoded)) return true;
      }
    }
    
    // HTML entity encoding
    if (lowerInput.contains('&') && lowerInput.contains(';')) {
      // Basic HTML entity check
      if (RegExp(r'&(lt|gt|amp|quot|#\d+);').hasMatch(lowerInput)) {
        return true;
      }
    }
    
    return false;
  }

  /// Checks for binary or non-printable data
  static bool _hasBinaryData(String input) {
    for (int i = 0; i < input.length; i++) {
      final charCode = input.codeUnitAt(i);
      // Allow printable ASCII and common Unicode ranges
      if (charCode < 32 || charCode == 127) {
        return true;
      }
    }
    return false;
  }

  /// Rate limiting check
  static Future<bool> checkRateLimit() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final now = DateTime.now().millisecondsSinceEpoch;
      final windowStart = now - (_rateLimitWindowMinutes * 60 * 1000);
      
      // Get recent attempts
      final attempts = prefs.getStringList('jam_id_attempts') ?? [];
      
      // Filter to current window
      final recentAttempts = attempts
          .map((e) => int.tryParse(e) ?? 0)
          .where((timestamp) => timestamp > windowStart)
          .toList();
      
      if (recentAttempts.length >= _maxAttempts) {
        _logSecurityEvent('RATE_LIMIT_EXCEEDED', '', attempts: recentAttempts.length);
        return false;
      }
      
      // Add current attempt
      recentAttempts.add(now);
      await prefs.setStringList('jam_id_attempts', recentAttempts.map((e) => e.toString()).toList());
      
      return true;
    } catch (e) {
      print('Rate limit check error: $e');
      return true; // Allow on error to prevent blocking legitimate users
    }
  }

  /// Logs security events for monitoring
  static void _logSecurityEvent(String eventType, String input, {String? pattern, String? error, int? attempts}) {
    final event = {
      'timestamp': DateTime.now().toIso8601String(),
      'event_type': eventType,
      'input_hash': _hashInput(input),
      'input_length': input.length,
      'pattern': pattern,
      'error': error,
      'attempts': attempts,
    };
    
    print('🚨 SECURITY EVENT: ${jsonEncode(event)}');
    
    // In a production app, you would send this to a security monitoring service
    // _sendToSecurityMonitoring(event);
  }

  /// Creates a hash of the input for logging (preserves privacy)
  static String _hashInput(String input) {
    if (input.isEmpty) return 'empty';
    final bytes = utf8.encode(input);
    final digest = sha256.convert(bytes);
    return digest.toString().substring(0, 8); // First 8 chars of hash
  }

  /// Sanitizes input for safe logging
  static String sanitizeForLogging(String input) {
    if (input.length <= 16) {
      return input.replaceAll(RegExp(r'[^a-zA-Z0-9\-_]'), '*');
    } else {
      return '${input.substring(0, 8)}...${input.substring(input.length - 4)}';
    }
  }
}

/// Result of validation operation
class ValidationResult {
  final bool isValid;
  final String? errorMessage;
  final String? sanitizedInput;

  const ValidationResult._({
    required this.isValid,
    this.errorMessage,
    this.sanitizedInput,
  });

  factory ValidationResult.valid(String sanitizedInput) {
    return ValidationResult._(
      isValid: true,
      sanitizedInput: sanitizedInput,
    );
  }

  factory ValidationResult.invalid(String errorMessage) {
    return ValidationResult._(
      isValid: false,
      errorMessage: errorMessage,
    );
  }
}
