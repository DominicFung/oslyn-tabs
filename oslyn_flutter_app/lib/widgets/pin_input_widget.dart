import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter/foundation.dart';
import 'dart:ui';

class PinInputWidget extends StatefulWidget {
  final Function(String) onPinEntered;
  final VoidCallback? onClose;

  const PinInputWidget({
    super.key,
    required this.onPinEntered,
    this.onClose,
  });

  @override
  State<PinInputWidget> createState() => _PinInputWidgetState();
}

class _PinInputWidgetState extends State<PinInputWidget> {
  final List<TextEditingController> _controllers = List.generate(6, (index) => TextEditingController());
  final List<FocusNode> _focusNodes = List.generate(6, (index) => FocusNode());
  String _pin = '';

  @override
  void initState() {
    super.initState();
    _pin = '';
    // Focus on the first field when the dialog opens
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _focusNodes[0].requestFocus();
    });
  }

  @override
  void dispose() {
    for (var controller in _controllers) {
      controller.dispose();
    }
    for (var focusNode in _focusNodes) {
      focusNode.dispose();
    }
    super.dispose();
  }

  void _onTextChanged(String value, int index) {
    if (value.length == 1) {
      // Move to next field
      if (index < 5) {
        _focusNodes[index + 1].requestFocus();
      } else {
        // Last field, check if PIN is complete
        _checkPinComplete();
      }
    } else if (value.isEmpty) {
      // Field is empty - this happens when delete/backspace is pressed
      // If current field is empty and there's a previous field with content, clear it
      if (index > 0 && _controllers[index - 1].text.isNotEmpty) {
        _controllers[index - 1].clear();
        _focusNodes[index - 1].requestFocus();
      }
      // Update PIN state
      _updatePinState();
    }
  }

  void _updatePinState() {
    final pin = _controllers.map((c) => c.text).join().toUpperCase();
    setState(() {
      _pin = pin;
    });
  }

  void _handleBackspace(int index) {
    if (index > 0) {
      // Clear the previous field and move focus to it
      _controllers[index - 1].clear();
      _focusNodes[index - 1].requestFocus();
      _updatePinState();
    } else if (index == 0 && _controllers[0].text.isNotEmpty) {
      // Clear the first field if it has content
      _controllers[0].clear();
      _updatePinState();
    }
  }

  void _checkPinComplete() {
    final pin = _controllers.map((c) => c.text).join().toUpperCase();
    if (pin.length == 6) {
      _updatePinState();
      widget.onPinEntered(pin);
    }
  }

  void _clearPin() {
    for (var controller in _controllers) {
      controller.clear();
    }
    _focusNodes[0].requestFocus();
    _updatePinState();
  }

  @override
  Widget build(BuildContext context) {
    final screenSize = MediaQuery.of(context).size;
    final isSmallScreen = screenSize.width < 400 || screenSize.height < 600;
    
    return Dialog(
      backgroundColor: Colors.transparent,
      child: Container(
        constraints: BoxConstraints(
          maxWidth: isSmallScreen ? screenSize.width * 0.95 : 400,
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
              padding: EdgeInsets.all(isSmallScreen ? 20 : 24),
              child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Row(
              children: [
                Icon(
                  Icons.pin,
                  color: Colors.white,
                  size: isSmallScreen ? 24 : 28,
                ),
                SizedBox(width: isSmallScreen ? 8 : 12),
                Expanded(
                  child: Text(
                    'Enter Jam PIN',
                    style: TextStyle(
                      fontSize: isSmallScreen ? 18 : 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                      fontFamily: '.SF Pro Text',
                      fontFamilyFallback: ['SF Pro Text', 'system-ui', 'Roboto'],
                    ),
                  ),
                ),
                if (widget.onClose != null)
                  IconButton(
                    onPressed: widget.onClose,
                    icon: Icon(
                      Icons.close,
                      color: Colors.white70,
                      size: isSmallScreen ? 20 : 24,
                    ),
                  ),
              ],
            ),
            
            SizedBox(height: isSmallScreen ? 16 : 24),
            
            // PIN input fields
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: List.generate(6, (index) {
                return Container(
                  width: isSmallScreen ? 40 : 45,
                  height: isSmallScreen ? 50 : 55,
                  decoration: BoxDecoration(
                    border: Border.all(
                      color: _pin.length > index ? Colors.white.withOpacity(0.6) : Colors.white.withOpacity(0.3),
                      width: 2,
                    ),
                    borderRadius: BorderRadius.circular(isSmallScreen ? 6 : 8),
                    color: _pin.length > index ? Colors.white.withOpacity(0.2) : Colors.white.withOpacity(0.1),
                  ),
                  child: KeyboardListener(
                    focusNode: FocusNode(),
                    onKeyEvent: (KeyEvent event) {
                      if (event is KeyDownEvent && event.logicalKey == LogicalKeyboardKey.backspace) {
                        _handleBackspace(index);
                      }
                    },
                    child: TextField(
                      controller: _controllers[index],
                      focusNode: _focusNodes[index],
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: isSmallScreen ? 20 : 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                        fontFamily: '.SF Pro Text',
                        fontFamilyFallback: ['SF Pro Text', 'system-ui', 'Roboto'],
                      ),
                      keyboardType: TextInputType.text,
                      textCapitalization: TextCapitalization.characters,
                      maxLength: 1,
                      inputFormatters: [
                        FilteringTextInputFormatter.allow(RegExp(r'[A-Z0-9]')),
                      ],
                      onChanged: (value) => _onTextChanged(value, index),
                      decoration: const InputDecoration(
                        border: InputBorder.none,
                        counterText: '',
                      ),
                    ),
                  ),
                );
              }),
            ),
            
            SizedBox(height: isSmallScreen ? 12 : 16),
            
            // Clear button
            if (_pin.isNotEmpty)
              TextButton.icon(
                onPressed: _clearPin,
                icon: Icon(
                  Icons.clear,
                  color: Colors.white70,
                  size: isSmallScreen ? 16 : 18,
                ),
                label: Text(
                  'Clear',
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: isSmallScreen ? 14 : 16,
                    fontFamily: '.SF Pro Text',
                    fontFamilyFallback: ['SF Pro Text', 'system-ui', 'Roboto'],
                  ),
                ),
              ),
            
            SizedBox(height: isSmallScreen ? 16 : 24),
            
            // Instructions
            Container(
              padding: EdgeInsets.all(isSmallScreen ? 12 : 16),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.1),
                borderRadius: BorderRadius.circular(isSmallScreen ? 6 : 8),
                border: Border.all(color: Colors.white.withOpacity(0.2)),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.info_outline,
                    color: Colors.white70,
                    size: isSmallScreen ? 18 : 20,
                  ),
                  SizedBox(width: isSmallScreen ? 8 : 12),
                  Expanded(
                    child: Text(
                      'Enter the 6-character PIN to join the jam session',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: isSmallScreen ? 12 : 14,
                        fontFamily: '.SF Pro Text',
                        fontFamilyFallback: ['SF Pro Text', 'system-ui', 'Roboto'],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
            ),
          ),
        ),
      ),
    );
  }
}


