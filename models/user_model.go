package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type User[T int8 | Hobby] struct {
	Id          primitive.ObjectID `bson:"_id" json:"id,omitempty"`
	Name        string             `json:"name,omitempty" validate:"required"`
	Description string             `json:"description,omitempty"`
	StudentId   string             `json:"location,omitempty" validate:"required"`
	Major       string             `json:"major,omitempty" validate:"required"`
	Gender      int8               `json:"gender,omitempty" validate:"required"`
	Height      int8               `json:"height,omitempty" validate:"required"`
	Smoke       int8               `json:"smoke,omitempty" validate:"required"`
	Religion    int8               `json:"religion,omitempty" validate:"required"`
	Age         int8               `json:"age,omitempty" validate:"required"`
	MBTI        int8               `json:"mbti,omitempty" validate:"required"`
	Properties  []Property         `json:"properties"`
	Hobbies     []Hobby            `json:"hobbies"`
	Targets     []T                `json:"targets"`
}
