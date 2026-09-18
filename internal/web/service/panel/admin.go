package panel

import (
	"errors"
	"gorm.io/gorm"

	"github.com/GALEXY-PANEL/3x-ui/v3/internal/database"
	"github.com/GALEXY-PANEL/3x-ui/v3/internal/database/model"
	"github.com/GALEXY-PANEL/3x-ui/v3/internal/util/crypto"
)

type AdminService struct{}

func (s *AdminService) GetAllRoles() ([]model.AdminRole, error) {
	db := database.GetDB()
	var roles []model.AdminRole
	err := db.Model(&model.AdminRole{}).Find(&roles).Error
	if err != nil {
		return nil, err
	}
	if len(roles) == 0 {
		// Initialize default roles
		defaultRoles := []model.AdminRole{
			{Name: "Super Admin", Slug: "super_admin", Description: "Full access to all resources", Permissions: `["*"]`},
			{Name: "Reseller / Operator", Slug: "reseller", Description: "Manage own clients and view stats", Permissions: `["clients:read","clients:create","clients:update","inbounds:read"]`},
		}
		for i := range defaultRoles {
			_ = db.Create(&defaultRoles[i]).Error
		}
		return defaultRoles, nil
	}
	return roles, nil
}

func (s *AdminService) CreateRole(role *model.AdminRole) error {
	db := database.GetDB()
	return db.Create(role).Error
}

func (s *AdminService) UpdateRole(role *model.AdminRole) error {
	db := database.GetDB()
	return db.Save(role).Error
}

func (s *AdminService) DeleteRole(id int) error {
	db := database.GetDB()
	return db.Delete(&model.AdminRole{}, id).Error
}

func (s *AdminService) GetAllAdmins() ([]model.Admin, error) {
	db := database.GetDB()
	var admins []model.Admin
	err := db.Model(&model.Admin{}).Find(&admins).Error
	return admins, err
}

func (s *AdminService) CreateAdmin(admin *model.Admin) error {
	db := database.GetDB()
	if admin.Password != "" {
		hash, err := crypto.HashPasswordAsBcrypt(admin.Password)
		if err != nil {
			return err
		}
		admin.Password = hash
	}
	return db.Create(admin).Error
}

func (s *AdminService) UpdateAdmin(admin *model.Admin) error {
	db := database.GetDB()
	var existing model.Admin
	if err := db.First(&existing, admin.Id).Error; err != nil {
		return err
	}
	if admin.Password != "" {
		hash, err := crypto.HashPasswordAsBcrypt(admin.Password)
		if err != nil {
			return err
		}
		admin.Password = hash
	} else {
		admin.Password = existing.Password
	}
	return db.Save(admin).Error
}

func (s *AdminService) DeleteAdmin(id int) error {
	db := database.GetDB()
	return db.Delete(&model.Admin{}, id).Error
}

func (s *AdminService) CheckAdminLogin(username string, password string) (*model.Admin, error) {
	db := database.GetDB()
	var admin model.Admin
	err := db.Where("username = ?", username).First(&admin).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, errors.New("admin not found")
	} else if err != nil {
		return nil, err
	}
	if !crypto.CheckPasswordHash(admin.Password, password) {
		return nil, errors.New("invalid credentials")
	}
	return &admin, nil
}
