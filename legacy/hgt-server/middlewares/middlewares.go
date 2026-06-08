package middlewares

import (
	"github.com/Todari/hgt-server/structs"
	"github.com/Todari/hgt-server/utils/token"
	"github.com/gin-gonic/gin"
	"net/http"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(ginCtx *gin.Context) {
		err := token.CheckTokenValidation(ginCtx)
		if err != nil {
			ginCtx.JSON(
				http.StatusUnauthorized,
				structs.HttpResponse{
					Success: false,
					Data: map[string]interface{}{
						"message": "Token expired",
					},
				},
			)
			ginCtx.Abort()
			return
		}
		ginCtx.Next()
	}
}
