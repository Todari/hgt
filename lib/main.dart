import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hgt/const/theme.dart';
import 'package:hgt/screens/home.dart';
import './screens/chatting.dart';
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
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  print("가보자고");
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
        '/chat': (context) => Chatting(),
        '/profile': (context) => Profile(),
      },
      home: Login(),
      // home: Menu(),
      // home: CupertinoPageScaffold(child: Text("hi")),
    );
  }
}
// 