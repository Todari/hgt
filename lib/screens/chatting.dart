import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:hgt/const/box_style.dart';
import 'package:hgt/const/text_style.dart';
import 'package:hgt/const/color_style.dart';
import '../http/http.dart';
import 'package:get_it/get_it.dart';
import 'package:hgt/object/user.dart';

class Chatting extends StatefulWidget {
  const Chatting({super.key});
  @override
  State<Chatting> createState() => _ChattingState();
}

class _ChattingState extends State<Chatting> {
  var http = HgtHttp();
  var user = GetIt.I<HgtUser>(instanceName: "userInfo");
  var chatroomID = "";
  var userID = "";

  final TextEditingController _chatController = TextEditingController();
  final CollectionReference _chatCollection =
      FirebaseFirestore.instance.collection('chat');

  var chatList = [];

  @override
  void initState() {
    _getUserID(user.studentId);
    _getChatroomID(user.studentId);
    print("chatroomID :$chatroomID");
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      navigationBar: CupertinoNavigationBar(
        middle: Text(
          "채팅",
          style: HgtText.large(HgtColor.black),
        ),
        backgroundColor: HgtColor.white,
      ),
      child: SafeArea(
        child: Stack(
          children: [
            Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: <Widget>[
                StreamBuilder<QuerySnapshot>(
                  stream: _chatCollection
                      .where('chatroomId', isEqualTo: chatroomID)
                      .orderBy('createdAt', descending: true)
                      .snapshots(),
                  builder: (context, snapshot) {
                    print(snapshot);
                    if (!snapshot.hasData) {
                      return const Center(
                        child: CircularProgressIndicator(),
                      );
                    } else {
                      List<DocumentSnapshot> docs = snapshot.data!.docs;
                      List<Widget> messages = docs
                          .map((doc) => Message(
                                sender: doc['sender'],
                                content: doc['content'],
                                me: userID == doc['sender'],
                              ))
                          .toList();

                      return Expanded(
                        child: ListView(
                          reverse: true,
                          children: <Widget>[
                            ...messages,
                          ],
                        ),
                      );
                    }
                  },
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(24.0, 8, 24, 8),
                  child: Row(
                    children: <Widget>[
                      Expanded(
                        child: CupertinoTextField(
                          onSubmitted: _handleSubmit,
                          placeholder: "Enter a message...",
                          placeholderStyle: HgtText.medium(HgtColor.grey2),
                          controller: _chatController,
                        ),
                      ),
                      const SizedBox(
                        width: 16,
                      ),
                      SendButton(
                        text: "Send",
                        callback: () {
                          _handleSubmit(_chatController.text);
                        },
                      )
                    ],
                  ),
                )
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _handleSubmit(String text) {
    if (_chatController.text.trim() != "") {
      _chatCollection.add({
        'chatroomId': chatroomID,
        'content': text,
        'sender': userID,
        'createdAt': DateTime.now().toUtc().millisecondsSinceEpoch,
      });
    }
    _chatController.clear();
  }

  Future<void> _getChatroomID(String studentId) async {
    var id = await http.getChatroomID(studentId);
    var splitId = id.split("\"")[1];
    setState(() {
      chatroomID = splitId;
      print("chatroomID : $chatroomID");
    });
  }

  Future<void> _getUserID(studentId) async {
    var id = await http.getUserID(studentId);
    // var splitId = id.split("\"")[1];
    setState(() {
      userID = id;
      print("getUserID : $userID");
    });
  }

  // Future<void> _getChats(studentId) async {
  //   var chats = await http.getChats(user.studentId);
  //   setState(() {
  //     chatList = chats;
  //   });
  // }
}

class Message extends StatelessWidget {
  final String sender;
  final String content;
  final bool me;

  const Message(
      {required this.sender,
      required this.content,
      required this.me,
      super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 4.0),
      child: Column(
        crossAxisAlignment:
            me ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: <Widget>[
          // Text(sender),
          Container(
            constraints: const BoxConstraints(maxWidth: 280),
            decoration: me ? HgtBox.myChat : HgtBox.otherChat,
            // elevation: 6.0,
            child: Container(
              padding:
                  const EdgeInsets.symmetric(vertical: 8.0, horizontal: 16.0),
              child: Text(
                content,
                style: me
                    ? HgtText.medium(HgtColor.white)
                    : HgtText.medium(HgtColor.black),
              ),
            ),
          )
        ],
      ),
    );
  }
}

class SendButton extends StatelessWidget {
  final String text;
  final VoidCallback callback;

  const SendButton({required this.text, required this.callback, super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 80,
      height: 36,
      decoration: HgtBox.smallFilled(HgtColor.primary),
      child: CupertinoButton.filled(
        minSize: 0,
        padding: const EdgeInsets.all(0),
        onPressed: callback,
        child: Text(
          text,
          style: HgtText.medium(HgtColor.white),
        ),
      ),
    );
  }
}
