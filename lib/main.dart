import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hgt/const/theme.dart';
import 'package:hgt/screens/home.dart';
import './screens/chat.dart';
import './screens/profile.dart';
import 'package:hgt/screens/login.dart';
import 'dart:async';
import 'screens/menu.dart';
import 'package:hgt/services/loginDataControl.dart';
import '../http/Crawl.dart';
import 'package:hgt/object/user.dart';
import 'package:get_it/get_it.dart';
import 'package:hgt/http/customException.dart';
import 'package:provider/provider.dart';

void main() async {
  runApp(
    Hgt(),
  );
}

class Hgt extends StatefulWidget {
  _HgtState createState() => _HgtState();
}

class _HgtState extends State<Hgt> {
  @override
  Widget build(BuildContext context) {
    return CupertinoApp(
      title: '홍개팅',
      theme: HgtTheme.light,
      debugShowCheckedModeBanner: false,
      initialRoute: "/splash",
      routes: {
        '/menu': (context) => Menu(),
        '/home': (context) => Home(),
        '/chat': (context) => Chat(),
        '/profile': (context) => Profile(),
      },
      home: Login(),
      // home: Menu(),
      // home: CupertinoPageScaffold(child: Text("hi")),
    );
  }
}
// 