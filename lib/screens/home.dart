import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:hgt/const/boxStyle.dart';
import 'package:hgt/const/textStyle.dart';
import 'package:hgt/const/colorStyle.dart';
import 'package:provider/provider.dart';
import 'profile.dart';
import 'chatting.dart';
import 'menu.dart';

class Home extends StatefulWidget {
  _HomeState createState() => _HomeState();
}

class _HomeState extends State<Home> {
  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      child: SafeArea(
        child: Column(
          children: [
            Container(
                padding: EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                child: Row(
                  children: [
                    GestureDetector(
                      child: Icon(
                        CupertinoIcons.profile_circled,
                        size: 32,
                      ),
                      onTap: () {
                        Navigator.push(
                            context,
                            CupertinoPageRoute(
                                builder: ((context) => Profile())));
                      },
                    ),
                    Expanded(
                      child: Container(
                        alignment: Alignment.center,
                        padding: EdgeInsets.only(left: 16),
                        child: Text("대충 로고임"),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0),
                      child: GestureDetector(
                        child: Icon(
                          CupertinoIcons.chat_bubble,
                          size: 32,
                        ),
                        onTap: () {
                          Navigator.push(
                              context,
                              CupertinoPageRoute(
                                  builder: ((context) => Chatting())));
                        },
                      ),
                    ),
                    GestureDetector(
                      child: Icon(
                        CupertinoIcons.list_bullet,
                        size: 32,
                      ),
                      onTap: () {
                        Navigator.push(context,
                            CupertinoPageRoute(builder: (context) => Menu()));
                      },
                    ),
                  ],
                ))
          ],
        ),
      ),
    );
  }
}
