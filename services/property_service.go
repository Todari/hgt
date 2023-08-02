package services

import (
	"context"
	"fmt"
	"github.com/Todari/hgt-server/configs"
	"github.com/Todari/hgt-server/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

var propertyCollection = configs.GetCollection(configs.DB, "hgtProperty")

func CreateProperty(ctx_ context.Context, property_ models.Property) (*mongo.InsertOneResult, error) {
	newProperty := models.Property{
		Id:    primitive.NewObjectID(),
		Type:  property_.Type,
		Value: property_.Value,
	}

	return propertyCollection.InsertOne(ctx_, newProperty)
}

func FindProperty(ctx_ context.Context, propertyType_ models.PropertyType, value_ string) *mongo.SingleResult {
	fmt.Println("Come to here")
	return propertyCollection.FindOne(ctx_, bson.M{
		"type":  propertyType_.String(),
		"value": value_,
	})
}

func FindProperties(ctx_ context.Context) (*mongo.Cursor, error) {
	return propertyCollection.Find(ctx_, bson.M{})
}
