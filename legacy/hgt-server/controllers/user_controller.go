package controllers

import (
	"context"
	"fmt"
	"github.com/Todari/hgt-server/services"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"log"
	"net/http"
	"time"

	"github.com/Todari/hgt-server/models"
	"github.com/Todari/hgt-server/structs"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

var validate = validator.New()

//func CreateUser() gin.HandlerFunc {
//	return func(ctx_ *gin.Context) {
//		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
//		defer cancel()
//
//		var userDto models.CreateUserDto
//
//		bindUserDtoErr := ctx_.BindJSON(&userDto)
//		if bindUserDtoErr != nil {
//			fmt.Println("bindUserDtoErr ====================================> ")
//			fmt.Println(bindUserDtoErr)
//			ctx_.JSON(
//				http.StatusInternalServerError,
//				structs.HttpResponse{
//					Success: false,
//					Data: map[string]interface{}{
//						"message": "[Bing UserDto Error] => " + bindUserDtoErr.Error(),
//					},
//				},
//			)
//			return
//		}
//
//		var user models.User
//
//		// get new Object Id
//		id := primitive.NewObjectID()
//		user.Id = id
//
//		// TODO: get Secure Key
//		currTime := time.Now().Unix()
//		hash := sha256.New()
//		hashString := id.Hex() + strconv.Itoa(int(currTime))
//		hash.Write([]byte(hashString))
//		md := hash.Sum([]byte(configs.HashKey()))
//		user.Session = hex.EncodeToString(md)
//
//		user.Name = userDto.Name
//		user.StudentId = userDto.StudentId
//		user.Major = userDto.Major
//
//		ageInt, strToIntErr := strconv.Atoi(userDto.Age)
//		if strToIntErr != nil {
//			fmt.Println("strToIntErr  ====================================> ")
//			fmt.Println(strToIntErr)
//			ctx_.JSON(
//				http.StatusInternalServerError,
//				structs.HttpResponse{
//					Success: false,
//					Data: map[string]interface{}{
//						"message": "[Convert String to Int Error] => " + strToIntErr.Error(),
//					},
//				},
//			)
//			return
//		}
//		user.Age = ageInt
//		user.Gender = userDto.Gender == "남"
//		user.Army = userDto.Army == "필"
//
//		// get Property Age
//		//var age models.Property
//
//		//findPropertyErr := services.FindOneProperty(ctx, models.Age, userDto.Age).Decode(&age)
//		//if findPropertyErr != nil {
//		//	fmt.Println("findPropertyErr ====================================> ")
//		//	fmt.Println(findPropertyErr)
//		//	ctx_.JSON(
//		//		http.StatusInternalServerError,
//		//		structs.HttpResponse{
//		//			Success: false,
//		//			Data: map[string]interface{}{
//		//				"message": findPropertyErr.Error(),
//		//			},
//		//		},
//		//	)
//		//	return
//		//}
//
//		//user.Age = age
//
//		// use the validator library to validate required fields
//		//if validationErr := validate.Struct(&user); validationErr != nil {
//		//	fmt.Println("validationErr ====================================> ")
//		//	fmt.Println(validationErr)
//		//	ctx_.JSON(
//		//		http.StatusBadRequest,
//		//		structs.HttpResponse{
//		//			Success: false,
//		//			Data: map[string]interface{}{
//		//				"data": validationErr.Error(),
//		//			},
//		//		},
//		//	)
//		//	return
//		//}
//
//		result, insertUserErr := services.InsertOneUser(ctx, user)
//
//		if insertUserErr != nil {
//			ctx_.JSON(
//				http.StatusInternalServerError,
//				structs.HttpResponse{
//					Success: false,
//					Data: map[string]interface{}{
//						"message": "[Insert User Error] => " + insertUserErr.Error(),
//					},
//				},
//			)
//			return
//		}
//
//		ctx_.JSON(
//			http.StatusCreated,
//			structs.HttpResponse{
//				Success: true,
//				Data:    result,
//			},
//		)
//	}
//}

func UpdateUserById() gin.HandlerFunc {
	return func(ctx_ *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		var userDto models.CreateUserDto

		//var age models.Property
		bindUserDtoErr := ctx_.BindJSON(&userDto)
		fmt.Println("bindUserDtoErr ====================================> ")
		fmt.Println(bindUserDtoErr)

		var user models.User
		user.Name = userDto.Name
		user.StudentId = userDto.StudentId
		user.Major = userDto.Major
		user.Gender = userDto.Gender == "남"
		user.Army = userDto.Army == "필"

		//findPropertyErr := services.FindOneProperty(ctx, models.Age, userDto.Age).Decode(&age)
		//fmt.Println("findPropertyErr ====================================> ")
		//fmt.Println(findPropertyErr)

		//user.Age = age

		// use the validator library to validate required fields
		//if validationErr := validate.Struct(&user); validationErr != nil {
		//	fmt.Println("validationErr ====================================> ")
		//	fmt.Println(validationErr)
		//	ctx_.JSON(
		//		http.StatusBadRequest,
		//		structs.HttpResponse{
		//			Success: false,
		//			Data: map[string]interface{}{
		//				"data": validationErr.Error(),
		//			},
		//		},
		//	)
		//	return
		//}

		result, insertUserErr := services.InsertOneUser(ctx, user)

		if insertUserErr != nil {
			fmt.Println("insertUserErr ====================================> ")
			fmt.Println(insertUserErr)
			ctx_.JSON(
				http.StatusInternalServerError,
				structs.HttpResponse{
					Success: false,
					Data: map[string]interface{}{
						"message": insertUserErr.Error(),
					},
				},
			)
			return
		}

		ctx_.JSON(
			http.StatusCreated,
			structs.HttpResponse{
				Success: true,
				Data:    result,
			},
		)
	}
}
func GetUsers() gin.HandlerFunc {
	return func(ctx_ *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		var users []models.User
		defer cancel()

		results, err := services.FindManyUsers(ctx)
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
			return
		}(results, ctx)

		for results.Next(ctx) {
			var user models.User
			if err = results.Decode(&user); err != nil {
				ctx_.JSON(
					http.StatusInternalServerError,
					structs.HttpResponse{
						Success: false,
						Data: map[string]interface{}{
							"message": err.Error(),
						},
					},
				)
				return
			}
			users = append(users, user)
		}

		ctx_.JSON(
			http.StatusOK,
			structs.HttpResponse{
				Success: true,
				Data:    users,
			},
		)
	}
}

func GetUserById() gin.HandlerFunc {
	return func(ctx_ *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)

		// get userId from params
		userId := ctx_.Param("userId")

		var user models.User
		defer cancel()

		objectId, objectIdErr := primitive.ObjectIDFromHex(userId)
		if objectIdErr != nil {
			ctx_.JSON(
				http.StatusBadRequest,
				structs.HttpResponse{
					Success: false,
					Data: map[string]interface{}{
						"message": objectIdErr.Error(),
					},
				},
			)
			return
		}

		err := services.FindOneUser(ctx, bson.M{"_id": objectId}).Decode(&user)
		if err != nil {
			ctx_.JSON(
				http.StatusInternalServerError,
				structs.HttpResponse{
					Success: false,
					Data: map[string]interface{}{
						"message": err.Error(),
					},
				},
			)
			return
		}

		ctx_.JSON(
			http.StatusOK,
			structs.HttpResponse{
				Success: true,
				Data:    user,
			},
		)
	}
}
