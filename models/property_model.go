package models

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Property struct {
	Id    primitive.ObjectID `bson:"_id" json:"id,omitempty"`
	Type  PropertyType       `json:"type,omitempty" validate:"required"`
	Value string             `json:"value,omitempty" validate:"required"`
}

type PropertyType int

const (
	Age PropertyType = iota
	Smoke
)

var (
	propertyTypeArray = [...]string{
		"age",
		"smoke",
	}
	propertyTypeMap = map[string]PropertyType{
		"age":   Age,
		"smoke": Smoke,
	}
)

func (t_ PropertyType) String() string {
	return propertyTypeArray[t_%4]
}

func (t_ PropertyType) Int() int {
	for i_, v_ := range propertyTypeArray {
		if v_ == t_.String() {
			return i_
		}
	}
	return -1
}

func StringToPropertyType(v_ string) PropertyType {
	return propertyTypeMap[v_]
}
