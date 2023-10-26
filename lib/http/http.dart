import 'dart:convert';

import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:hgt/object/chat.dart';
import 'package:hgt/object/property.dart';
import 'package:http/http.dart' as http;

class HgtHttp {
  String hgtURL = dotenv.get("hgtURL");
//
  Future<String> getToken(id, age) async {
    final url = Uri.http(hgtURL, '/signin');
    var response = await http.post(url,
        body: jsonEncode(<String, String>{
          'student_id': id,
          'age': age,
        }));
    var result = jsonDecode(response.body);
    if (response.statusCode != 404) {
      return result["data"]["message"];
    } else {
      return "no tokens";
    }
  }

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

  Future<Property> getProperty(studentId) async {
    final url = Uri.http(hgtURL, '/property/$studentId');
    var response = await http.get(url);
    var result = jsonDecode(response.body);
    final Property results;
    print(result["property"]);
    results = Property.fromJson(result["property"]);
    return results;
  }

  Future<int> updateProperty(studentId, property) async {
    final url = Uri.http(hgtURL, '/property/$studentId');
    var response = await http.put(
      url,
      body: jsonEncode(
        <String, dynamic>{
          "studentId": studentId,
          "mbti": property.mbti,
          "height": property.height,
          "smoke": property.smoke,
          "religion": property.religion,
          "keywords": property.keywords,
          "hobbies": property.hobbies,
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
