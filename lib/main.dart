import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import 'package:hgt/const/theme.dart';
import 'package:hgt/screens/home.dart';
import './screens/chatting.dart';
import './screens/profile.dart';
import 'package:hgt/screens/login.dart';
import 'screens/menu.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'firebase_options.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  await dotenv.load(fileName: ".env");
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