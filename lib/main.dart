import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:async';

import 'screens/home.dart';

void main() async {
  runApp(MyApp());
}

class MyApp extends StatefulWidget {
  _MyAppState createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  @override
  Widget build(BuildContext context) {
    return CupertinoApp(
      title: '홍개팅',
      // debugShowCheckedModeBanner: false,
      home: Home(),
      // home: CupertinoPageScaffold(child: Text("hi")),
    );
  }
}
// 