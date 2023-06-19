package http

import (
	"errors"
	"net/http"

	"github.com/Todari/hgt-server/model"
	"github.com/Todari/hgt-server/repository"
	"github.com/gin-gonic/gin"
)

func (s Server) UpdateProperty(ctx *gin.Context) {
	studentId := ctx.Param("studentId")
	var property model.Property
	if err := ctx.ShouldBindJSON(&property); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
	}
	property, err := s.repository.UpdateProperty(ctx, studentId, property)
	if err != nil {
		if errors.Is(err, repository.ErrPropertyNotFound) {
			ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		ctx.JSON(http.StatusInternalServerError, err.Error())
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"property": property})
}
