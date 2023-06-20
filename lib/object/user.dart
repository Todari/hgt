class HgtUser {
  String name;
  String studentId;
  String major;
  String age;
  String gender;

  HgtUser(this.name, this.studentId, this.major, this.age, this.gender);
  @override
  String toString() => '$name , $studentId, $major, $age, $gender';
}
