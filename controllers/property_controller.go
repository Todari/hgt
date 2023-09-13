package controllers

import (
	"context"
	"github.com/Todari/hgt-server/models"
	"github.com/Todari/hgt-server/services"
	"github.com/Todari/hgt-server/structs"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
	"log"
	"net/http"
	"time"
)

func CreateProperty() gin.HandlerFunc {
	return func(ctx_ *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		var newProperty models.Property

		if err := ctx_.BindJSON(&newProperty); err != nil {
			ctx_.JSON(
				http.StatusBadRequest,
				structs.HttpResponse{
					Success: false,
					Data: map[string]interface{}{
						"type":   "Bind property error",
						"result": err.Error(),
					},
				},
			)
			return
		}

		// use the validator library to validate required fields
		if validationErr := validate.Struct(&newProperty); validationErr != nil {
			ctx_.JSON(
				http.StatusBadRequest,
				structs.HttpResponse{
					Success: false,
					Data: map[string]interface{}{
						"type":   "Validate error",
						"result": validationErr.Error(),
					},
				},
			)
			return
		}

		result, err := services.InsertOneProperty(ctx, newProperty)
		if err != nil {
			ctx_.JSON(
				http.StatusInternalServerError,
				structs.HttpResponse{
					Success: false,
					Data: map[string]interface{}{
						"type":   "InsertOneProperty error",
						"result": err.Error(),
					},
				},
			)
			return
		}

		ctx_.JSON(
			http.StatusCreated,
			structs.HttpResponse{
				Success: true,
				Data: map[string]interface{}{
					"result": result.InsertedID,
				},
			},
		)
	}
}

func GetProperties() gin.HandlerFunc {
	return func(ctx_ *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		var properties []models.Property
		defer cancel()

		results, err := services.SelectManyProperties(ctx)
		if err != nil {
			ctx_.JSON(
				http.StatusInternalServerError,
				structs.HttpResponse{
					Success: false,
					Data: map[string]interface{}{
						"data": err.Error(),
					},
				},
			)
			return
		}

		defer func(results_ *mongo.Cursor, ctx_ context.Context) {
			err := results_.Close(ctx_)
			if err != nil {
				log.Fatal(err)
			}
		}(results, ctx)

		for results.Next(ctx) {
			var property models.Property
			if err = results.Decode(&property); err != nil {
				ctx_.JSON(
					http.StatusInternalServerError,
					structs.HttpResponse{
						Success: false,
						Data: map[string]interface{}{
							"data": err.Error(),
						},
					},
				)
			}
			properties = append(properties, property)
		}

		ctx_.JSON(
			http.StatusOK,
			structs.HttpResponse{
				Success: true,
				Data: map[string]interface{}{
					"data": properties,
				},
			},
		)
	}
}

func GetProperty() gin.HandlerFunc {
	return func(ctx_ *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		propertyType := models.StringToPropertyType(ctx_.Param("type"))
		value := ctx_.Query("value")

		var property models.Property

		err := services.SelectOneProperty(ctx, propertyType, value).Decode(&property)

		if err != nil {
			ctx_.JSON(
				http.StatusInternalServerError,
				structs.HttpResponse{
					Success: false,
					Data: map[string]interface{}{
						"type":   "FindOneProperty error",
						"result": err.Error(),
					},
				},
			)
			return
		}

		ctx_.JSON(
			http.StatusOK,
			structs.HttpResponse{
				Success: true,
				Data: map[string]interface{}{
					"result": property,
				},
			},
		)
	}
}

//func GetProperty(type_ string, value_ string) gin.HandlerFunc {
//	return func(ctx_ *gin.Context) {
//		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
//
//		// get userId from params
//		userId := ctx_.Param("userId")
//
//		var user models.User
//		defer cancel()
//
//		_id, objectIdErr := primitive.ObjectIDFromHex(userId)
//		if objectIdErr != nil {
//			ctx_.JSON(
//				http.StatusBadRequest,
//				structs.HttpResponse{
//					Success: false,
//					Data: map[string]interface{}{
//						"data": objectIdErr.Error(),
//					},
//				},
//			)
//			return
//		}
//
//		err := service.FindOne(ctx, bson.M{"_id": _id}).Decode(&user)
//		if err != nil {
//			ctx_.JSON(
//				http.StatusInternalServerError,
//				structs.HttpResponse{
//					Success: false,
//					Data: map[string]interface{}{
//						"data": err.Error(),
//					},
//				},
//			)
//			return
//		}
//
//		fmt.Println(user)
//		ctx_.JSON(
//			http.StatusOK,
//			structs.HttpResponse{
//				Success: true,
//				Data: map[string]interface{}{
//					"data": user,
//				},
//			},
//		)
//	}
//}
