import 'package:flutter/material.dart';

String font = "Spoqa";

class HgtText {
  static TextStyle title(Color? color) {
    return TextStyle(
      fontFamily: font,
      fontSize: 24,
      color: color,
    );
  }

  static TextStyle large(Color? color) {
    return TextStyle(
      fontFamily: font,
      fontSize: 18,
      fontWeight: FontWeight.normal,
      color: color,
    );
  }

  static TextStyle medium(Color? color) {
    return TextStyle(
      fontFamily: font,
      fontSize: 14,
      color: color,
    );
  }

  static TextStyle small(Color? color) {
    return TextStyle(
      fontFamily: font,
      fontSize: 12,
      color: color,
    );
  }
}
