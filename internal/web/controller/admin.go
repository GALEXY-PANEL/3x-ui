package controller

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/GALEXY-PANEL/3x-ui/v3/internal/database/model"
	"github.com/GALEXY-PANEL/3x-ui/v3/internal/web/service/panel"
)

type AdminController struct {
	BaseController
	adminService panel.AdminService
}

func NewAdminController(g *gin.RouterGroup) *AdminController {
	a := &AdminController{}
	a.initRouter(g)
	return a
}

func (a *AdminController) initRouter(g *gin.RouterGroup) {
	adminGroup := g.Group("/admins")
	adminGroup.Use(checkLogin)

	adminGroup.GET("/roles", a.getRoles)
	adminGroup.POST("/roles/create", a.createRole)
	adminGroup.POST("/roles/update/:id", a.updateRole)
	adminGroup.POST("/roles/delete/:id", a.deleteRole)

	adminGroup.GET("/list", a.getAdmins)
	adminGroup.POST("/create", a.createAdmin)
	adminGroup.POST("/update/:id", a.updateAdmin)
	adminGroup.POST("/delete/:id", a.deleteAdmin)
}

func (a *AdminController) getRoles(c *gin.Context) {
	roles, err := a.adminService.GetAllRoles()
	if err != nil {
		jsonMsg(c, "Failed to get roles", err)
		return
	}
	jsonObj(c, roles, nil)
}

func (a *AdminController) createRole(c *gin.Context) {
	var role model.AdminRole
	if err := c.ShouldBindJSON(&role); err != nil {
		jsonMsg(c, "Invalid input", err)
		return
	}
	if err := a.adminService.CreateRole(&role); err != nil {
		jsonMsg(c, "Failed to create role", err)
		return
	}
	jsonObj(c, role, nil)
}

func (a *AdminController) updateRole(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		jsonMsg(c, "Invalid ID", err)
		return
	}
	var role model.AdminRole
	if err := c.ShouldBindJSON(&role); err != nil {
		jsonMsg(c, "Invalid input", err)
		return
	}
	role.Id = id
	if err := a.adminService.UpdateRole(&role); err != nil {
		jsonMsg(c, "Failed to update role", err)
		return
	}
	jsonObj(c, role, nil)
}

func (a *AdminController) deleteRole(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		jsonMsg(c, "Invalid ID", err)
		return
	}
	if err := a.adminService.DeleteRole(id); err != nil {
		jsonMsg(c, "Failed to delete role", err)
		return
	}
	jsonMsg(c, "Role deleted successfully", nil)
}

func (a *AdminController) getAdmins(c *gin.Context) {
	admins, err := a.adminService.GetAllAdmins()
	if err != nil {
		jsonMsg(c, "Failed to get admins", err)
		return
	}
	jsonObj(c, admins, nil)
}

func (a *AdminController) createAdmin(c *gin.Context) {
	var admin model.Admin
	if err := c.ShouldBindJSON(&admin); err != nil {
		jsonMsg(c, "Invalid input", err)
		return
	}
	if err := a.adminService.CreateAdmin(&admin); err != nil {
		jsonMsg(c, "Failed to create admin", err)
		return
	}
	admin.Password = ""
	jsonObj(c, admin, nil)
}

func (a *AdminController) updateAdmin(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		jsonMsg(c, "Invalid ID", err)
		return
	}
	var admin model.Admin
	if err := c.ShouldBindJSON(&admin); err != nil {
		jsonMsg(c, "Invalid input", err)
		return
	}
	admin.Id = id
	if err := a.adminService.UpdateAdmin(&admin); err != nil {
		jsonMsg(c, "Failed to update admin", err)
		return
	}
	admin.Password = ""
	jsonObj(c, admin, nil)
}

func (a *AdminController) deleteAdmin(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		jsonMsg(c, "Invalid ID", err)
		return
	}
	if err := a.adminService.DeleteAdmin(id); err != nil {
		jsonMsg(c, "Failed to delete admin", err)
		return
	}
	jsonMsg(c, "Admin deleted successfully", nil)
}
