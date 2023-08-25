package controllers

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"strings"
)

func SignIn(ctx *gin.Context) {

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
