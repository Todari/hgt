import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:dio/dio.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:hgt/const/boxStyle.dart';
import 'package:hgt/const/textStyle.dart';
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
  var chatroomID = "";
  var userID = "";

  final TextEditingController _chatController = TextEditingController();
  final CollectionReference _chatCollection =
      FirebaseFirestore.instance.collection('chat');

  var chatList = [];

  @override
  void initState() {
    _getUserID(user.studentId);
    // _getChats(user.studentId);
    _getChatroomID(user.studentId);
    print("chatroomID :$chatroomID");
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
              StreamBuilder<QuerySnapshot>(
                stream: _chatCollection
                    .where('chatroomId', isEqualTo: chatroomID)
                    .orderBy('createdAt', descending: true)
                    .snapshots(),
                builder: (context, snapshot) {
                  print(snapshot);
                  if (!snapshot.hasData) {
                    return Center(
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
              Container(
                child: Row(
                  children: <Widget>[
                    Expanded(
                      child: CupertinoTextField(
                        onSubmitted: _handleSubmit,
                        placeholder: "Enter a message...",
                        controller: _chatController,
                      ),
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
    );

    // @override
    // Widget build(BuildContext context) {
    //   return SafeArea(
    //     child: Stack(
    //       children: [
    //         Column(
    //           mainAxisAlignment: MainAxisAlignment.center,
    //           children: <Widget>[
    //             Expanded(
    //               child: ListView.builder(
    //                 shrinkWrap: true,
    //                 itemCount: chatList.length,
    //                 itemBuilder: (context, index) {
    //                   Chat chat = chatList[index % chatList.length];
    //                   String createdAt = chat.createdAt;
    //                   String sender = chat.sender;
    //                   String content = chat.content;
    //                   if (sender == userID) {
    //                     return Padding(
    //                       padding: const EdgeInsets.fromLTRB(24, 8, 24, 8),
    //                       child: Container(
    //                         // height: 48,
    //                         width: double.infinity,
    //                         alignment: Alignment.centerRight,
    //                         child: Container(
    //                           constraints: BoxConstraints(
    //                             maxWidth: 280,
    //                           ),
    //                           decoration: HgtBox.test,
    //                           child: Padding(
    //                             padding: const EdgeInsets.all(12.0),
    //                             child: Text(
    //                               content,
    //                               style: HgtText.p,
    //                             ),
    //                           ),
    //                         ),
    //                       ),
    //                     );
    //                   } else {
    //                     return Container(
    //                       // height: 48,
    //                       width: double.infinity,
    //                       alignment: Alignment.centerLeft,
    //                       child: Padding(
    //                         padding: const EdgeInsets.fromLTRB(24, 8, 24, 8),
    //                         child: Container(
    //                           constraints: BoxConstraints(
    //                             maxWidth: 280,
    //                           ),
    //                           decoration: HgtBox.test,
    //                           child: Padding(
    //                             padding: const EdgeInsets.all(12.0),
    //                             child: Text(
    //                               content,
    //                               style: HgtText.p,
    //                             ),
    //                           ),
    //                         ),
    //                       ),
    //                     );
    //                   }
    //                 },
    //               ),
    //             )
    //           ],
    //         ),
    //       ],
    //     ),
    //   );
  }

  void _handleSubmit(String text) {
    _chatController.clear();

    _chatCollection.add({
      'chatroomId': chatroomID,
      'content': text,
      'sender': userID,
      'createdAt': DateTime.now().toUtc().millisecondsSinceEpoch,
    });
  }

  Future<void> _getChatroomID(String studentId) async {
    var id = await http.getChatroomID(studentId);
    var splitId = id.split("\"")[1];
    setState(() {
      chatroomID = splitId;
    });
  }

  Future<void> _getUserID(studentId) async {
    var id = await http.getUserID(user.studentId);
    var splitId = id.split("\"")[1];
    setState(() {
      userID = id;
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

  Message({required this.sender, required this.content, required this.me});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 8.0),
      child: Container(
        child: Column(
          crossAxisAlignment:
              me ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: <Widget>[
            // Text(sender),
            Container(
              constraints: BoxConstraints(maxWidth: 280),
              decoration: BoxDecoration(
                color: me
                    ? CupertinoColors.activeOrange
                    : CupertinoColors.systemGrey,
                borderRadius: BorderRadius.circular(16.0),
              ),
              // elevation: 6.0,
              child: Container(
                padding: EdgeInsets.symmetric(vertical: 8.0, horizontal: 16.0),
                child: Text(
                  content,
                  style: HgtText.p,
                ),
              ),
            )
          ],
        ),
      ),
    );
  }
}

class SendButton extends StatelessWidget {
  final String text;
  final VoidCallback callback;

  const SendButton({required this.text, required this.callback});

  @override
  Widget build(BuildContext context) {
    return CupertinoButton.filled(
      onPressed: callback,
      child: Text(text),
    );
  }
}
