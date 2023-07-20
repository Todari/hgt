import 'package:flutter/cupertino.dart';
import 'dart:async';
import 'package:get_it/get_it.dart';
import 'package:hgt/const/box_style.dart';
import 'package:hgt/const/text_style.dart';
import 'package:hgt/const/color_style.dart';
import 'package:hgt/http/customException.dart';
import 'package:hgt/http/http.dart';
import 'package:hgt/object/user.dart';
import 'package:hgt/screens/home.dart';
import 'package:hgt/services/login_data_control.dart';
import '../http/Crawl.dart';

class Login extends StatefulWidget {
  const Login({super.key});

  @override
  State<Login> createState() => _LoginState();
}

class _LoginState extends State<Login> {
  late TextEditingController _idController;
  late TextEditingController _pwController;
  late FocusNode _pwFocusNode;
  // NyanUser userInfo = NyanUser('', '');
  // List<Lecture> classesInfo = [];
  String savedId = "", savedPw = "";
  HgtUser userInfo = HgtUser("", "", "", "", "");

  var ctrl = LoginDataCtrl();
  bool _isChecked = false;
  bool _isLogined = false;
  // bool _loadingVisible = false;

  @override
  void initState() {
    _loginCheck();
    _idController = TextEditingController();
    _pwController = TextEditingController();
    _pwFocusNode = FocusNode();

    super.initState();
  }

  @override
  void dispose() {
    _idController.dispose();
    _pwController.dispose();
    _pwFocusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return loginScreen();
  }

  Future<void> _loginCheck() async {
    print("### login check!! ${_isLogined}");

    // await ctrl.saveLoginData("b513077", "Suramjam0428");
    var assurance = await ctrl.loadLoginData();
    savedId = assurance["user_id"] ?? "";
    savedPw = assurance["user_pw"] ?? "";
    print("### saved id????? ${savedId}");

    if (savedId == "") {
      setState(() {
        _isLogined = false;
      });
    } else {
      setState(() {
        _isLogined = true;
      });
      _login(savedId, savedPw);
    }
  }

  Future<void> _login(id, pw) async {
    Crawl.id = id;
    Crawl.pw = pw;
    var crawl = Crawl();
    var http = HgtHttp();

    try {
      try {
        userInfo = GetIt.I<HgtUser>(instanceName: "userInfo");
      } catch (e) {
        await crawl.crawlUser();
        userInfo = GetIt.I<HgtUser>(instanceName: "userInfo");
      }
    } on CustomException {
      print("customexception");
    }
    print(userInfo);
    if (userInfo.name != "") {
      await http.addUser(userInfo);
      //@*TODO: DB 정보가 최신화 되어있지 않을때 최신화 시키기
      if (!context.mounted) return;
      Navigator.push(
        context,
        CupertinoPageRoute(
          builder: (context) => const Home(),
        ),
      );
    } else {
      print("학번 / 비밀번호를 확인하세요");
    }
  }

  Widget loginScreen() {
    return CupertinoPageScaffold(
      child: GestureDetector(
        onTap: () {
          FocusScope.of(context).unfocus();
        },
        child: Container(
          // decoration: HgtBox.test,
          alignment: Alignment.center,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                width: 240,
                height: 120,
                decoration: HgtBox.test,
              ),
              const SizedBox(
                height: 64,
              ),
              SizedBox(
                height: 48,
                child: Column(
                  children: [
                    Text(
                      "* 클래스넷 로그인 정보는 저장되지 않으며",
                      style: HgtText.medium(HgtColor.grey),
                    ),
                    const SizedBox(
                      height: 4,
                    ),
                    Text(
                      "홍익대 학생임을 증명하는데만 사용돼요 :)",
                      style: HgtText.medium(HgtColor.grey),
                    )
                  ],
                ),
              ),
              SizedBox(
                width: 240,
                child: CupertinoTextField(
                  controller: _idController,
                  style: HgtText.large(HgtColor.black),
                  placeholder: "학번",
                  clearButtonMode: OverlayVisibilityMode.editing,
                  maxLength: 8,
                  textCapitalization: TextCapitalization.characters,
                  // inputFormatters: [],
                  onSubmitted: (value) {
                    if (value != "") {
                      _pwFocusNode.requestFocus();
                    }
                  },
                ),
              ),
              const SizedBox(
                height: 16,
              ),
              SizedBox(
                width: 240,
                child: CupertinoTextField(
                  controller: _pwController,
                  style: HgtText.large(HgtColor.black),
                  placeholder: "클래스넷 비밀번호",
                  obscureText: true,
                  clearButtonMode: OverlayVisibilityMode.editing,
                  focusNode: _pwFocusNode,
                ),
              ),
              // SizedBox(
              //   height: 16,
              // ),
              Container(
                width: 240,
                // decoration: HgtBox.test,
                alignment: Alignment.centerRight,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    GestureDetector(
                      onTap: () {
                        setState(() {
                          if (_isChecked == true) {
                            _isChecked = false;
                          } else {
                            _isChecked = true;
                          }
                        });
                      },
                      child: Text(
                        "로그인 상태 유지",
                        style: HgtText.medium(HgtColor.grey),
                      ),
                    ),
                    CupertinoCheckbox(
                      value: _isChecked,
                      onChanged: (value) async {
                        setState(() {
                          _isChecked = value!;
                        });
                        print(_isChecked);
                      },
                    )
                  ],
                ),
              ),
              const SizedBox(
                height: 16,
              ),
              SizedBox(
                width: 240,
                // height: 48,
                child: CupertinoButton.filled(
                  child: Text(
                    "로그인",
                    style: HgtText.large(HgtColor.black),
                  ),
                  onPressed: () async {
                    print(_idController.text + _pwController.text);
                    if (_isChecked == true) {
                      await ctrl.saveLoginData(
                          _idController.text, _pwController.text);
                    }
                    try {
                      await _login(_idController.text, _pwController.text);
                    } on CustomException catch (e) {
                      print("${e.code} ${e.message}");
                    }
                  },
                ),
              )
            ],
          ),
        ),
      ),
    );
  }
}
