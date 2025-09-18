import 'package:flutter/material.dart';
// import 'package:qr_code_scanner/qr_code_scanner.dart';
import 'package:permission_handler/permission_handler.dart';

class QRScannerWidget extends StatefulWidget {
  final Function(String) onQRCodeScanned;
  final VoidCallback? onClose;

  const QRScannerWidget({
    super.key,
    required this.onQRCodeScanned,
    this.onClose,
  });

  @override
  State<QRScannerWidget> createState() => _QRScannerWidgetState();
}

class _QRScannerWidgetState extends State<QRScannerWidget> {
  bool _hasPermission = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _checkCameraPermission();
  }

  Future<void> _checkCameraPermission() async {
    final status = await Permission.camera.status;
    if (status.isGranted) {
      setState(() {
        _hasPermission = true;
      });
    } else {
      final result = await Permission.camera.request();
      setState(() {
        _hasPermission = result.isGranted;
        if (!result.isGranted) {
          _errorMessage = 'Camera permission is required to scan QR codes';
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        title: const Text('QR Code Scanner'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: widget.onClose,
        ),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (!_hasPermission) ...[
              const Icon(
                Icons.camera_alt_outlined,
                size: 80,
                color: Colors.white,
              ),
              const SizedBox(height: 16),
              Text(
                _errorMessage ?? 'Camera permission required',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _checkCameraPermission,
                child: const Text('Grant Permission'),
              ),
            ] else ...[
              const Icon(
                Icons.qr_code_scanner,
                size: 80,
                color: Colors.white,
              ),
              const SizedBox(height: 16),
              const Text(
                'QR Scanner temporarily disabled',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              const Text(
                'The QR scanner feature is currently being updated. Please use manual input instead.',
                style: TextStyle(
                  color: Colors.white70,
                  fontSize: 14,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () {
                  // Simulate QR code input for testing
                  widget.onQRCodeScanned('test-jam-session-id');
                },
                child: const Text('Test with Sample QR Code'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}