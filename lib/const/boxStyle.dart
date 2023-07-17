import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:hgt/const/colorStyle.dart';

class HgtBox {
  static BoxDecoration test = BoxDecoration(
    border: Border.all(color: Colors.black),
  );

  static BoxDecoration bg = BoxDecoration(
    color: CupertinoColors.white,
  );

  static BoxDecoration chip = BoxDecoration(
    border: Border.all(color: HgtColor.grey),
    borderRadius: BorderRadius.circular(8),
  );

  static BoxDecoration chipSelected = BoxDecoration(
    color: HgtColor.primary,
    border: Border.all(color: HgtColor.primary),
    borderRadius: BorderRadius.circular(8),
  );

  static BoxDecoration myChat = BoxDecoration(
    color: HgtColor.primary,
    borderRadius: BorderRadius.circular(16),
  );

  static BoxDecoration otherChat = BoxDecoration(
    color: HgtColor.white,
    border: Border.all(color: HgtColor.primary),
    borderRadius: BorderRadius.circular(16),
  );

  static BoxDecoration largeFilled(filledColor) {
    return BoxDecoration(
      color: filledColor,
      borderRadius: BorderRadius.circular(16),
    );
  }

  static BoxDecoration smallFilled(filledColor) {
    return BoxDecoration(
      color: filledColor,
      borderRadius: BorderRadius.circular(8),
    );
  }

  static BoxDecoration largeBorder(color) {
    return BoxDecoration(
      border: Border.all(color: color, width: 3.0),
      borderRadius: BorderRadius.circular(16),
    );
  }

  static BoxDecoration smallBorder(color) {
    return BoxDecoration(
      border: Border.all(color: color),
      borderRadius: BorderRadius.circular(8),
    );
  }
}
