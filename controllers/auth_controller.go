package controllers

import (
	"context"
	"fmt"
	"github.com/Todari/hgt-server/models"
	"github.com/Todari/hgt-server/services"
	"github.com/Todari/hgt-server/structs"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"net/http"
	"strconv"
	"strings"
	"time"
)

func SignIn() gin.HandlerFunc {
	return func(ginCtx *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		var userDto models.CreateUserDto

		bindUserDtoErr := ginCtx.BindJSON(&userDto)
		if bindUserDtoErr != nil {
			ginCtx.JSON(
				http.StatusInternalServerError,
				structs.HttpResponse{
					Success: false,
					Data: map[string]interface{}{
						"message": "[Bind UserDto Error] => " + bindUserDtoErr.Error(),
					},
				},
			)
			return
		}

		findUserResult := services.FindOneUser(ctx, bson.M{"student_id": userDto.StudentId})

		if findUserResult == nil {
			ageInt, strToIntErr := strconv.Atoi(userDto.Age)
			if strToIntErr != nil {
				ginCtx.JSON(
					http.StatusInternalServerError,
					structs.HttpResponse{
						Success: false,
						Data: map[string]interface{}{
							"message": "[Convert String to Int Error] => " + strToIntErr.Error(),
						},
					},
				)
				return
			}

			user := models.User{
				Name:      userDto.Name,
				StudentId: userDto.StudentId,
				Major:     userDto.Major,
				Age:       ageInt,
				Gender:    userDto.Gender == "남",
				Army:      userDto.Army == "필",
			}
			createUserResult, createUserErr := services.InsertOneUser(ctx, user)

			if createUserErr != nil {
				ginCtx.JSON(
					http.StatusInternalServerError,
					structs.HttpResponse{
						Success: false,
						Data: map[string]interface{}{
							"message": "[Insert User Error] => " + createUserErr.Error(),
						},
					},
				)
				return
			}

			ginCtx.JSON(
				http.StatusCreated,
				structs.HttpResponse{
					Success: true,
					Data:    createUserResult,
				},
			)
			return
		}

		ginCtx.JSON(
			http.StatusCreated,
			structs.HttpResponse{
				Success: true,
				Data:    findUserResult,
			},
		)
	}
}

func SignOut(ctx *gin.Context) {

}

func TokenValid(c *gin.Context) error {
	token := ExtractToken(c)
	fmt.Println(token)
	return nil
}

func ExtractToken(c *gin.Context) string {
	bearerToken := c.Request.Header.Get("Authorization")
	if len(strings.Split(bearerToken, " ")) == 2 {
		return strings.Split(bearerToken, " ")[1]
	}
	return ""
}
