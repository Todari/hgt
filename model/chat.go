package model

type Chat struct {
	ID         string `json:"id"`
	ChatroomID string `json:"chatroomId"`
	CreatedAt  string `json:"createdAt"`
	Sender     string `json:"sender"`
	Content    string `json:"content"`
}
