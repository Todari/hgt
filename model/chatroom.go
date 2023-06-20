package model

type Chatroom struct {
	ID    string   `json:"id"`
	Users []string `json:"users"`
}
