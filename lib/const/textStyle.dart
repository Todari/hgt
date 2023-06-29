import 'package:flutter/material.dart';
import 'package:hgt/const/colorStyle.dart';

String font = "Spoqa";

class HgtText {
  static TextStyle Title = TextStyle(
    fontFamily: font,
    fontSize: 24,
    // fontWeight: FontWeight.bold,
  );

  static TextStyle p = TextStyle(
    fontFamily: font,
    fontSize: 18,
  );

  static TextStyle p2 = TextStyle(
    fontFamily: font,
    fontSize: 14,
  );
  static TextStyle p2w = TextStyle(
    fontFamily: font,
    fontSize: 14,
  );

  static TextStyle p2b8 = TextStyle(
    color: HgtColor.b8,
    fontFamily: font,
    fontSize: 14,
  );
}
