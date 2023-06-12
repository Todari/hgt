import 'dart:convert';

import 'package:hgt/object/user.dart';
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
          }));
      print(response.body);
      return response.statusCode;
    } else {
      print("existed user");
      return 808;
    }
  }

  Future<int> getUser(id) async {
    final url = Uri.http(hgtURL, '/user/$id');
    print("sending getUserGet");
    print(id);
    var response = await http.get(url);
    print(response.body);
    return response.statusCode;
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
