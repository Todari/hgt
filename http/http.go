package http

import (
	"github.com/Todari/go-mongo-crud/repository"
)

type Server struct {
	repository repository.Repository
}

func NewServer(repository repository.Repository) *Server {
	return &Server{repository: repository}
}
