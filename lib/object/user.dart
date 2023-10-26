class HgtUser {
  String id;
  String name;
  String studentId;
  String major;
  String age;
  String gender;
  String army;
  String session;

  HgtUser(this.id, this.name, this.studentId, this.major, this.age, this.gender,
      this.army, this.session);
  @override
  String toString() =>
      '$id, $name , $studentId, $major, $age, $gender, $army, $session';
}
