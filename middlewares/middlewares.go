package middlewares

import (
	"github.com/Todari/hgt-server/controllers"
	"github.com/gin-gonic/gin"
	"net/http"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(ginContext *gin.Context) {
		err := controllers.TokenValid(ginContext)
		if err != nil {
			ginContext.String(http.StatusUnauthorized, "Token expired")
			ginContext.Abort()
			return
		}
		ginContext.Next()
	}
}
