package model

type AdminRole struct {
	Id          int    `json:"id" gorm:"primaryKey;autoIncrement"`
	Name        string `json:"name" gorm:"not null"`
	Slug        string `json:"slug" gorm:"uniqueIndex;not null"`
	Description string `json:"description"`
	Permissions string `json:"permissions" gorm:"type:text"` // JSON encoded permissions
	CreatedAt   int64  `json:"createdAt" gorm:"autoCreateTime:milli"`
	UpdatedAt   int64  `json:"updatedAt" gorm:"autoUpdateTime:milli"`
}

func (AdminRole) TableName() string { return "admin_roles" }

type Admin struct {
	Id         int    `json:"id" gorm:"primaryKey;autoIncrement"`
	Username   string `json:"username" gorm:"uniqueIndex;not null"`
	Password   string `json:"password,omitempty"`
	RoleId     int    `json:"roleId" gorm:"column:role_id;index;default:0"`
	Status     string `json:"status" gorm:"default:active;index"`
	DataLimit  int64  `json:"dataLimit" gorm:"column:data_limit;default:0"`
	UsedBytes  int64  `json:"usedBytes" gorm:"column:used_bytes;default:0"`
	Note       string `json:"note"`
	CreatedAt  int64  `json:"createdAt" gorm:"autoCreateTime:milli"`
	UpdatedAt  int64  `json:"updatedAt" gorm:"autoUpdateTime:milli"`
}

func (Admin) TableName() string { return "admins" }
