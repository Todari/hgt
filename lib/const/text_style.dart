import 'package:flutter/material.dart';

String font = "Spoqa";

class HgtText {
  static TextStyle headerLarge(Color? color) {
    return TextStyle(
      fontFamily: font,
      fontSize: 36,
      fontWeight: FontWeight.w700,
      color: color,
    );
  }

  static TextStyle headerMedium(Color? color) {
    return TextStyle(
      fontFamily: font,
      fontSize: 28,
      fontWeight: FontWeight.w700,
      color: color,
    );
  }

  static TextStyle headerSmall(Color? color) {
    return TextStyle(
      fontFamily: font,
      fontSize: 22,
      fontWeight: FontWeight.w700,
      color: color,
    );
  }

  static TextStyle titleLarge(Color? color) {
    return TextStyle(
      fontFamily: font,
      fontSize: 18,
      fontWeight: FontWeight.w700,
      color: color,
    );
  }

  static TextStyle titleMedium(Color? color) {
    return TextStyle(
      fontFamily: font,
      fontSize: 16,
      fontWeight: FontWeight.w700,
      color: color,
    );
  }

  static TextStyle titleSmall(Color? color) {
    return TextStyle(
      fontFamily: font,
      fontSize: 14,
      fontWeight: FontWeight.w700,
      color: color,
    );
  }

  static TextStyle bodyLargeBold(Color? color) {
    return TextStyle(
      fontFamily: font,
      fontSize: 16,
      fontWeight: FontWeight.w700,
      color: color,
    );
  }

  static TextStyle bodyLargeMedium(Color? color) {
    return TextStyle(
      fontFamily: font,
      fontSize: 16,
      fontWeight: FontWeight.w500,
      color: color,
    );
  }

  static TextStyle bodyLargeRegular(Color? color) {
    return TextStyle(
      fontFamily: font,
      fontSize: 16,
      fontWeight: FontWeight.w400,
      color: color,
    );
  }

  static TextStyle bodyMediumBold(Color? color) {
    return TextStyle(
      fontFamily: font,
      fontSize: 14,
      fontWeight: FontWeight.w700,
      color: color,
    );
  }

  static TextStyle bodyMediumRegular(Color? color) {
    return TextStyle(
      fontFamily: font,
      fontSize: 14,
      fontWeight: FontWeight.w400,
      color: color,
    );
  }

  static TextStyle bodySmallMedium(Color? color) {
    return TextStyle(
      fontFamily: font,
      fontSize: 13,
      fontWeight: FontWeight.w500,
      color: color,
    );
  }

  static TextStyle bodySmallRegular(Color? color) {
    return TextStyle(
      fontFamily: font,
      fontSize: 13,
      fontWeight: FontWeight.w400,
      color: color,
    );
  }

  static TextStyle bodyTinyMedium(Color? color) {
    return TextStyle(
        fontFamily: font,
        fontSize: 11,
        color: color,
        fontWeight: FontWeight.w500);
  }

  static TextStyle bodyTinyRegular(Color? color) {
    return TextStyle(
        fontFamily: font,
        fontSize: 11,
        color: color,
        fontWeight: FontWeight.w400);
  }
}
