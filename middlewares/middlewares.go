package middlewares

import (
	"fmt"
	"github.com/Todari/hgt-server/utils/token"
	"github.com/gin-gonic/gin"
	"net/http"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(ginContext *gin.Context) {
		fmt.Println("Check Token Middleware ====================================> ")
		err := token.CheckTokenValidation(ginContext)
		if err != nil {
			ginContext.String(http.StatusUnauthorized, "Token expired")
			ginContext.Abort()
			return
		}
		ginContext.Next()
	}
}
