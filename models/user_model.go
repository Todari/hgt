package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type User struct {
	// 보안
	Session string `json:"session,omitempty"` // login 시 갱신, session 유지 확인, Header Auth 통해 수신

	// 기본
	Id        primitive.ObjectID `bson:"_id" json:"id,omitempty"`
	Name      string             `json:"name,omitempty" validate:"required"`
	StudentId string             `bson:"student_id" json:"studentId,omitempty" validate:"required"`
	Major     string             `json:"major,omitempty" validate:"required"`
	Gender    bool               `json:"gender,omitempty" validate:"required"` // 필수
	Army      bool               `json:"army,omitempty" validate:"required"`   // 필수
	Age       Property           `json:"age,omitempty" validate:"required"`    // 필수

	// 옵션
	Description string `json:"description,omitempty"`

	// 필수
	Explore bool `json:"explore,omitempty"`

	// 우선 property
	Height   Property `json:"height,omitempty"`
	Smoke    Property `json:"smoke,omitempty"`
	Religion Property `json:"religion,omitempty"`
	MBTI     Property `json:"mbti,omitempty"`

	// 필수 조건
	CanCC bool `json:"canCC,omitempty"` // 동일 Major 허용

	// 2차 우선
	Hobbies  []Property `json:"hobbies,omitempty"`
	Keywords []Property `json:"keywords,omitempty"`

	// Target
	Target []Property `json:"target,omitempty"`

	// 제외
	ExPartner []User `json:"exPartner,omitempty"`

	Partner *User `json:"partner,omitempty"`
}

type CreateUserDto struct {
	Name      string
	StudentId string
	Major     string
	Age       string
	Gender    string
	Army      string
}

type UpdateUserDto struct {
	Id          string
	Height      string
	Smoke       string
	Religion    string
	MBTI        string
	Description string
	CanCC       bool
	Explore     bool
	Hobbies     []string
	Keywords    []string
	Target      []string
}
