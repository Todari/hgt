import 'package:flutter/cupertino.dart';
import 'package:hgt/const/color_style.dart';
import 'package:hgt/const/text_style.dart';
import 'profile.dart';
import 'chatting.dart';
import 'menu.dart';

class Home extends StatefulWidget {
  const Home({super.key});

  @override
  State<Home> createState() => _HomeState();
}

class _HomeState extends State<Home> {
  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      child: SafeArea(
        child: Column(
          children: [
            Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                child: Row(
                  children: [
                    GestureDetector(
                      child: const Icon(
                        CupertinoIcons.profile_circled,
                        size: 32,
                      ),
                      onTap: () {
                        Navigator.push(
                            context,
                            CupertinoPageRoute(
                                builder: ((context) => const Profile())));
                      },
                    ),
                    Expanded(
                      child: Container(
                        alignment: Alignment.center,
                        padding: const EdgeInsets.only(left: 16),
                        child: Text(
                          "대충 로고임",
                          style: HgtText.titleLarge(HgtColor.black),
                        ),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0),
                      child: GestureDetector(
                        child: const Icon(
                          CupertinoIcons.chat_bubble,
                          size: 32,
                        ),
                        onTap: () {
                          Navigator.push(
                              context,
                              CupertinoPageRoute(
                                  builder: ((context) => const Chatting())));
                        },
                      ),
                    ),
                    GestureDetector(
                      child: const Icon(
                        CupertinoIcons.list_bullet,
                        size: 32,
                      ),
                      onTap: () {
                        Navigator.push(
                            context,
                            CupertinoPageRoute(
                                builder: (context) => const Menu()));
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
