import 'dart:convert';

import 'package:hgt/object/chat.dart';
import 'package:hgt/object/user.dart';
import 'package:hgt/screens/chatting.dart';
import 'package:http/http.dart' as http;

class HgtHttp {
  late String _cookie;
  // String _uid;
  // HgtHttp(this._uid);
  // String hgtURL = '127.0.0.1:8888';
  String hgtURL = '3.112.248.108:8888';

  Future<int> addUser(user) async {
    final url = Uri.http(hgtURL, '/user');
    final getUrl = Uri.http(hgtURL, '/user/${user.studentId}');
    final getResponse = await http.get(getUrl);
    print(getResponse);
    if (getResponse.statusCode == 404) {
      print("sending addUserPost");
      print(user);
      var response = await http.post(url,
          body: jsonEncode(<String, String>{
            "name": user.name,
            "studentId": user.studentId,
            "major": user.major,
            "age": user.age,
            "gender": user.gender
          }));
      print(response.body);
      return response.statusCode;
    } else {
      print("existed user");
      return 808;
    }
  }

  Future<String> getUserID(id) async {
    final url = Uri.http(hgtURL, '/user/$id');
    print("sending getUserGet");
    print(id);
    var response = await http.get(url);
    var result = jsonDecode(response.body);
    print(result["user"]["id"]);
    return result["user"]["id"];
  }

  Future<int> updateProperty(studentId, property) async {
    final url = Uri.http(hgtURL, '/property/$studentId');
    var response = await http.put(
      url,
      body: jsonEncode(
        <String, dynamic>{
          "studentId": studentId,
          "height": property.height,
          "smoke": property.smoke,
          "religion": property.religion,
          "p": property.p,
        },
      ),
    );
    print(response.body);
    return response.statusCode;
  }

  Future<String> getChatroomID(studentId) async {
    final url = Uri.http(hgtURL, '/chatroom/$studentId');
    var response = await http.get(url);
    var result = jsonDecode(response.body);
    print(result["chatroom"]["id"]);
    return result["chatroom"]["id"];
  }

  Future<List<Chat>> getChats(studentId) async {
    final url = Uri.http(hgtURL, '/chatroom/chats/$studentId');
    final List<Chat> results = [];
    var response = await http.get(url);
    var result = jsonDecode(response.body);
    print(result["chats"]);
    for (int i = 0; i < result["chats"].length; i++) {
      var chat = Chat.fromJson(result["chats"][i]);
      results.add(chat);
    }
    return results;
  }

  // yumDelete() async {
  //   final url = Uri.http(yumURL, '/nyu/user');
  //   var response = await http.delete(
  //     url,
  //     headers: {'Cookie': _cookie},
  //   );
  //   // print(response.body);
  // }
}
