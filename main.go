package main

import (
	"net/http"

	"github.com/Todari/hgt-server/configs"
	"github.com/Todari/hgt-server/routes"
	"github.com/gin-gonic/gin"
)

func main() {
	router := gin.Default()

	// Connect Database
	configs.ConnectDB()

	// Hello, World!
	router.GET("/", func(ctx_ *gin.Context) {
		ctx_.String(http.StatusOK, "Hello, World!")
	})

	// routers
	routes.UserRouter(router)

	router.Run("192.168.0.15:8080")
}
