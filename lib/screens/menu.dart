import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hgt/screens/login.dart';
import 'dart:async';
import 'home.dart';
import 'chatting.dart';
import 'profile.dart';

import 'package:hgt/services/loginDataControl.dart';

class Menu extends StatefulWidget {
  _MenuState createState() => _MenuState();
}

class _MenuState extends State<Menu> {
  List<Widget> data = [
    Home(),
    Chatting(),
    Profile(),
  ];

  @override
  Widget build(BuildContext context) {
    return CupertinoTabScaffold(
      tabBar: CupertinoTabBar(items: [
        BottomNavigationBarItem(icon: Icon(CupertinoIcons.add)),
        BottomNavigationBarItem(icon: Icon(CupertinoIcons.add)),
        BottomNavigationBarItem(icon: Icon(CupertinoIcons.add)),
      ]),
      tabBuilder: (BuildContext context, int index) {
        return CupertinoTabView(
          builder: (context) {
            return CupertinoPageScaffold(
              child: data[index],
            );
          },
        );
      },
    );
  }
}
// 