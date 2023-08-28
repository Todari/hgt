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
      fontSize: 20,
      fontWeight: FontWeight.normal,
      color: color,
    );
  }

  static TextStyle medium(Color? color) {
    return TextStyle(
      fontFamily: font,
      fontSize: 16,
      color: color,
    );
  }

  static TextStyle small(Color? color) {
    return TextStyle(
      fontFamily: font,
      fontSize: 14,
      color: color,
    );
  }
}
