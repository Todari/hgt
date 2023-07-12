package models

type Property struct {
	Name string `json:"name,omitempty" validate:"required"`
}
