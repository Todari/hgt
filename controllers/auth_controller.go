package controllers

import (
	"bytes"
	"context"
	"crypto/aes"
	"crypto/cipher"
	"encoding/base64"
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

type cryptoKeys struct {
	cipherKey   string
	cipherIvKey string
}

func (c cryptoKeys) encrypter(plainText string) (string, error) {
	if strings.TrimSpace(plainText) == "" {
		return plainText, nil
	}

	block, err := aes.NewCipher([]byte(c.cipherIvKey))
	if err != nil {
		return "", err
	}

	encrypter := cipher.NewCBCEncrypter(block, []byte(c.cipherIvKey))
	paddedPlainText := padPKCS7([]byte(plainText), encrypter.BlockSize())

	cipherText := make([]byte, len(paddedPlainText))
	// CryptBlocks 함수에 데이터(paddedPlainText)와 암호화 될 데이터를 저장할 슬라이스(cipherText)를 넣으면 암호화가 된다.
	encrypter.CryptBlocks(cipherText, paddedPlainText)

	return base64.StdEncoding.EncodeToString(cipherText), nil
}

func (c cryptoKeys) decrypt(cipherText string) (string, error) {
	if strings.TrimSpace(cipherText) == "" {
		return cipherText, nil
	}

	decodedCipherText, err := base64.StdEncoding.DecodeString(cipherText)
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher([]byte(c.cipherKey))
	if err != nil {
		return "", err
	}

	decrypter := cipher.NewCBCDecrypter(block, []byte(c.cipherIvKey))
	plainText := make([]byte, len(decodedCipherText))

	decrypter.CryptBlocks(plainText, decodedCipherText)
	trimmedPlainText := trimPKCS5(plainText)

	return string(trimmedPlainText), nil
}

func padPKCS7(plainText []byte, blockSize int) []byte {
	padding := blockSize - len(plainText)%blockSize
	padText := bytes.Repeat([]byte{byte(padding)}, padding)
	return append(plainText, padText...)
}

func trimPKCS5(text []byte) []byte {
	padding := text[len(text)-1]
	return text[:len(text)-int(padding)]
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
