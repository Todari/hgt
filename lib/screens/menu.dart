import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hgt/screens/login.dart';
import 'dart:async';
import 'home.dart';
import 'chatting.dart';
import 'profile.dart';
import 'package:hgt/const/boxStyle.dart';
import 'package:hgt/const/colorStyle.dart';
import 'package:hgt/const/textStyle.dart';

import 'package:hgt/services/loginDataControl.dart';

class Menu extends StatefulWidget {
  _MenuState createState() => _MenuState();
}

class _MenuState extends State<Menu> {
  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
        navigationBar: CupertinoNavigationBar(
          middle: Text(
            "내 프로필",
            style: HgtText.large(HgtColor.primary),
          ),
          backgroundColor: HgtColor.white,
        ),
        child: Text("아"));
  }
}
// 