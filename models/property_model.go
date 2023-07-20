package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type Property struct {
	Id    primitive.ObjectID `bson:"_id" json:"id,omitempty"`
	Type  string             `json:"type,omitempty" validate:"required"`
	Value string             `json:"value,omitempty" validate:"required"`
}
