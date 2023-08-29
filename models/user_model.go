package models

import (
	"fmt"
	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"os"
	"time"
)

var (
	jwtKey    = os.Getenv("jwtKey")
	expiredAt = time.Date(9999, time.December, 31, 0, 0, 0, 0, time.UTC)
)

type User struct {
	// 보안
	Session string `bson:"session,omitempty"` // login 시 갱신, session 유지 확인, Header Auth 통해 수신

	// 기본
	Id        primitive.ObjectID `bson:"_id"`
	Name      string             `bson:"name" validate:"required"`
	StudentId string             `bson:"student_id" validate:"required"`
	Major     string             `bson:"major" validate:"required"`
	Gender    bool               `bson:"gender" validate:"required"` // 필수
	Army      bool               `bson:"army" validate:"required"`   // 필수
	Age       Property           `bson:"age" validate:"required"`    // 필수

	// 옵션
	Description string `bson:"description,omitempty"`

	// 필수
	Explore bool `bson:"explore,omitempty"`

	// 우선 property
	Height   Property `bson:"height,omitempty"`
	Smoke    Property `bson:"smoke,omitempty"`
	Religion Property `bson:"religion,omitempty"`
	MBTI     Property `bson:"mbti,omitempty"`

	// 필수 조건
	CanCC bool `bson:"canCC,omitempty"` // 동일 Major 허용

	// 2차 우선
	Hobbies  []Property `bson:"hobbies,omitempty"`
	Keywords []Property `bson:"keywords,omitempty"`

	// Target
	Target []Property `bson:"target,omitempty"`

	// 제외
	ExPartner []User `bson:"exPartner,omitempty"`

	Partner *User `bson:"partner,omitempty"`
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

type Claims struct {
	UserId primitive.ObjectID
	jwt.MapClaims
}

func (user *User) GenerateJwtToken() (string, error) {
	claims := &Claims{
		UserId: user.Id,
		MapClaims: jwt.MapClaims{
			"exp": expiredAt,
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodRS256, claims.MapClaims)
	tokenString, err := token.SignedString(jwtKey)

	if err != nil {
		return "", fmt.Errorf("jwt sign token error")
	}

	return tokenString, nil
}
