class HgtUser {
  String name;
  String studentId;
  String major;
  String age;
  String gender;
  String army;
  String session;

  HgtUser(this.name, this.studentId, this.major, this.age, this.gender,
      this.army, this.session);
  @override
  String toString() =>
      '$name , $studentId, $major, $age, $gender, $army, $session';
}
