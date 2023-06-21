import 'package:dio/dio.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:hgt/const/boxStyle.dart';
import 'package:hgt/const/textStyle.dart';
import 'package:provider/provider.dart';
import '../http/http.dart';
import 'package:get_it/get_it.dart';
import 'package:hgt/object/user.dart';
import '../object/chat.dart';

class Chatting extends StatefulWidget {
  _ChattingState createState() => _ChattingState();
}

class _ChattingState extends State<Chatting> {
  var http = HgtHttp();
  var user = GetIt.I<HgtUser>(instanceName: "userInfo");
  var userID = "";

  var chatList = [];

  @override
  void initState() {
    _getUserID(user.studentId);
    _getChats(user.studentId);
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Stack(
        children: [
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: <Widget>[
              Expanded(
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: chatList.length,
                  itemBuilder: (context, index) {
                    Chat chat = chatList[index % chatList.length];
                    String createdAt = chat.createdAt;
                    String sender = chat.sender;
                    String content = chat.content;
                    if (sender == userID) {
                      return Padding(
                        padding: const EdgeInsets.fromLTRB(24, 8, 24, 8),
                        child: Container(
                          // height: 48,
                          width: double.infinity,
                          alignment: Alignment.centerRight,
                          child: Container(
                            constraints: BoxConstraints(
                              maxWidth: 280,
                            ),
                            decoration: HgtBox.test,
                            child: Padding(
                              padding: const EdgeInsets.all(12.0),
                              child: Text(
                                content,
                                style: HgtText.p,
                              ),
                            ),
                          ),
                        ),
                      );
                    } else {
                      return Container(
                        // height: 48,
                        width: double.infinity,
                        alignment: Alignment.centerLeft,
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(24, 8, 24, 8),
                          child: Container(
                            constraints: BoxConstraints(
                              maxWidth: 280,
                            ),
                            decoration: HgtBox.test,
                            child: Padding(
                              padding: const EdgeInsets.all(12.0),
                              child: Text(
                                content,
                                style: HgtText.p,
                              ),
                            ),
                          ),
                        ),
                      );
                    }
                  },
                ),
              )
            ],
          ),
        ],
      ),
    );
  }

  Future<void> _getUserID(studentId) async {
    var id = await http.getUserID(user.studentId);
    setState(() {
      userID = id;
    });
  }

  Future<void> _getChats(studentId) async {
    var chats = await http.getChats(user.studentId);
    setState(() {
      chatList = chats;
    });
  }
}
