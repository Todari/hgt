import 'dart:io';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:html/parser.dart' show parse;
import 'package:cookie_jar/cookie_jar.dart';
import 'package:get_it/get_it.dart';
import 'package:dio/dio.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';
import 'customException.dart';
import '../object/user.dart';

class Crawl with ChangeNotifier {
  String cookie = '';
  static String id = "", pw = "";
  static String name = "", studentId = "", major = "", age = "", gender = "";

  final List<Cookie> cookies = [];

  Future<http.StreamedResponse> _getResponse(String method, String url,
      [Map<String, String> headers = const {},
      Map<String, String> body = const {}]) {
    http.Request request = http.Request(method, Uri.parse(url));
    request.headers.addAll(headers);
    request.bodyFields = body;
    return request.send();
  }

  Future<void> _login() async {
    final headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    final body = {
      'USER_ID': id,
      'PASSWD': pw,
      'Refer': 'https://cn.hongik.ac.kr',
    };

    const url = 'https://ap.hongik.ac.kr/login/LoginExec3.php';
    final response = await _getResponse("POST", url, headers, body);
    final rBody = await response.stream.bytesToString();
    int index = rBody.indexOf('SetCookie');

    try {
      final list = rBody.substring(index).split("'");
      for (int i = 0; i < 12; i++) {
        cookie = list[6 * i + 1] +
            '=' +
            Uri.encodeComponent(list[6 * i + 3]) +
            '; ' +
            cookie;
        cookies
            .add(Cookie(list[6 * i + 1], Uri.encodeComponent(list[6 * i + 3])));
        cookies[i].httpOnly = false;
      }
    } catch (e) {
      print("학번 / 비밀번호를 확인하세요");
    }
    print("내가만든 쿠키 : $cookie");
  }

  Future<Map<String, dynamic>> crawlUser() async {
    final cookieJar = CookieJar();
    final dio = Dio()
      ..interceptors.add(CookieManager(cookieJar))
      ..options.followRedirects = false
      ..options.validateStatus =
          (status) => status != null && status >= 200 && status < 400;
    // final finalDio = Dio()..interceptors.add(CookieManager(cookieJar));

    await _login();
    if (cookie.length < 10) {
      print("학번 / 비밀번호를 확인하세요");
    } else {
      final url1 = 'https://cn.hongik.ac.kr/';
      final url2 = 'https://cn.hongik.ac.kr/stud/';
      final url3 = 'https://cn.hongik.ac.kr/stud/A/01000/01000.jsp';

      await cookieJar.saveFromResponse(Uri.parse(url2), cookies);
      // final directed = await dio.get(url2);
      await cookieJar.saveFromResponse(Uri.parse(url1), cookies);
      final redirected = await dio.get(url1);
      final finalresponse = await Future.wait([
        dio.get(redirected.headers.value(HttpHeaders.locationHeader)!),
        dio.get(url3)
      ]);

      // print(finalresponse[1]);
      final document = parse(finalresponse[1].toString());
      var content = document.querySelectorAll(
          "#body > div.table1.mato10 > table > tbody > tr > td");
      var contents = [];
      for (var i in content) {
        contents.add(i.text);
      }
      // print(contents);
      !contents.contains("군복무여부") ? gender = "여" : gender = "남";
      print(gender);
      studentId = contents[1];
      name = contents[3];
      major = contents[9];
      print(contents[7].toString().trim().substring(0, 4));
      age = (2024 - int.parse(contents[7].toString().trim().substring(0, 4)))
          .toString();
      // print(
      //     "학번 : $studentId, 이름 : $name, 만 나이 : $age, 전공 : $major, 성별 : $gender");
    }
    Map<String, dynamic> user = {
      'name': name,
      'studentId': studentId,
      'major': major,
      'age': age,
      'gender': gender,
    };
    GetIt.I.registerSingleton<HgtUser>(
        HgtUser(user["name"], user["studentId"], user["major"], user["age"],
            user["gender"]),
        instanceName: "userInfo");
    print(user);
    return user;
  }

  Future<void> _logout() async {
    if (this.cookie == '')
      throw new CustomException(300, 'Already Logout');
    else
      this.cookie = '';
  }
}
