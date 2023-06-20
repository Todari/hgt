package http

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/Todari/hgt-server/model"
	"github.com/Todari/hgt-server/repository"
)

func (s Server) GetChatroom(ctx *gin.Context) {
	studentId := ctx.Param("studentId")
	if studentId == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid argument studentId"})
		return
	}
	chatroom, err := s.repository.GetChatroom(ctx, studentId)
	if chatroom.Users == nil {
		chatroom.Users = []string{}
	}
	if err != nil {
		if errors.Is(err, repository.ErrChatroomNotFound) {
			ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		ctx.JSON(http.StatusInternalServerError, err.Error())
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"chatroom": chatroom})
}

func (s Server) GetChats(ctx *gin.Context) {
	studentId := ctx.Param("studentId")
	if studentId == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid argument studentId"})
		return
	}
	chatroom, err := s.repository.GetChatroom(ctx, studentId)
	if err != nil {
		if errors.Is(err, repository.ErrChatroomNotFound) {
			ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		ctx.JSON(http.StatusInternalServerError, err.Error())
		return
	}
	fmt.Println("###chatroom : ", chatroom)
	chats, err := s.repository.GetChatsInChatroom(ctx, chatroom)
	if err != nil {
		if errors.Is(err, repository.ErrChatroomNotFound) {
			ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		ctx.JSON(http.StatusInternalServerError, err.Error())
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"chatroom": chatroom, "chats": chats})
}

func (s Server) SendChat(ctx *gin.Context) {
	var chat model.Chat
	if err := ctx.ShouldBindJSON(&chat); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}
	chat, err := s.repository.SendChatInChatroom(ctx, chat)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, err.Error())
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"chat": chat})
}
