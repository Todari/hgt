package models

type Hobby struct {
	Name string `json:"name,omitempty" validate:"required"`
}
