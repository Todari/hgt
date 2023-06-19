package model

type Property struct {
	ID       string   `json:"id"`
	UserID   string   `json:"userId"`
	Height   string   `json:"height"`
	Religion string   `json:"religion"`
	Smoke    string   `json:"smoke"`
	P        []string `json:"p"`
}
