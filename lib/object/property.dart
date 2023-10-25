class Property {
  List<dynamic> mbti;
  String height;
  String smoke;
  String religion;
  List<dynamic> keywords;
  List<dynamic> hobbies;

  Property(this.mbti, this.height, this.smoke, this.religion, this.keywords,
      this.hobbies);

  Property.fromJson(Map<dynamic, dynamic> json)
      : mbti = List<String>.from(json["mbti"].map((x) => x as String)),
        height = json["height"],
        smoke = json["smoke"],
        religion = json["religion"],
        // keywords = json["keywords"],
        // hobbies = json["hobbies"];
        keywords = List<String>.from(json["keywords"].map((x) => x as String)),
        hobbies = List<String>.from(json["hobbies"].map((x) => x as String));
  Map<String, dynamic> toJson() => {
        "mbti": mbti,
        "height": height,
        "smoke": smoke,
        "religion": religion,
        "keywords": keywords,
        "hobbies": hobbies
      };

  @override
  String toString() => '$mbti, $height, $smoke, $religion, $keywords, $hobbies';
}
