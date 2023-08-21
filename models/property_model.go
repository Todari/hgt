package models

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Property struct {
	Id    primitive.ObjectID `bson:"_id" json:"id,omitempty"`
	Type  PropertyType       `json:"type,omitempty" validate:"required"`
	Value string             `json:"value,omitempty" validate:"required"`
}

type PropertyType string

const (
	Age   PropertyType = "age"
	Smoke PropertyType = "smoke"
)

var (
	propertyTypeMap = map[string]PropertyType{
		"age":   Age,
		"smoke": Smoke,
	}
)

func StringToPropertyType(v_ string) PropertyType {
	return propertyTypeMap[v_]
}
