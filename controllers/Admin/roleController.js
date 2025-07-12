const controller = {};
const Role = require("../../models/Role");
const ApiError = require("../../utils/ApiError");
const ApiResponse = require("../../utils/ApiResponse");
const { validationResult } = require("express-validator");
const routesPermission = require("../../utils/routePermission/routes.json")

controller.getAllRole = async (req, res) => {
  try {
    const roles = await Role.find({ isDeleted: false });
    res.json(new ApiResponse(200, roles, "All roles fetched successfully"));
  } catch (error) {
    res.status(500).json(new ApiError(500, "Failed to fetch roles", [error.message]));
  }
};

controller.getRoleById = async (req, res) => {
  try {
    const role = await Role.findById(req.params._id);
    if (!role) return res.status(404).json(new ApiError(404, "Role not found"));

    res.json(new ApiResponse(200, role, "Role fetched successfully"));
  } catch (error) {
    res.status(500).json(new ApiError(500, "Failed to fetch role", [error.message]));
  }
};

controller.getAllInactiveRole = async (req, res) => {
  try {
    const roles = await Role.find({ isDeleted: false, status: "0" });
    res.json(new ApiResponse(200, roles, "Inactive roles fetched"));
  } catch (error) {
    res.status(500).json(new ApiError(500, "Failed to fetch inactive roles", [error.message]));
  }
};

controller.getAllDeletedRole = async (req, res) => {
  try {
    const roles = await Role.findDeleted();
    res.json(new ApiResponse(200, roles, "Deleted roles fetched"));
  } catch (error) {
    res.status(500).json(new ApiError(500, "Failed to fetch deleted roles", [error.message]));
  }
};

controller.createRole = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(new ApiError(422, "Validation error", errors.array()));
    }

    const { name, permissions } = req.body;
    const routes =  getPermissionRoutes(req.body)
    const existing = await Role.findOne({ name });
    if (existing) {
      return res.status(400).json(new ApiError(400, "Role with this name already exists"));
    }

    const newRole = await Role.create({ name, permissions, routes });
    res.status(201).json(new ApiResponse(201, newRole, "Role created successfully"));
  } catch (error) {
    res.status(500).json(new ApiError(500, "Failed to create role", [error.message]));
  }
};

controller.updateRole = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(new ApiError(422, "Validation error", errors.array()));
    }
    const { _id, name, permissions } = req.body;
    const routes =  getPermissionRoutes(req.body)

    const updated = await Role.findByIdAndUpdate(
      _id,
      { name, permissions, routes },
      { new: true }
    );

    if (!updated) return res.status(404).json(new ApiError(404, "Role not found"));

    res.json(new ApiResponse(200, updated, "Role updated successfully"));
  } catch (error) {
    res.status(500).json(new ApiError(500, "Failed to update role", [error.message]));
  }
};

controller.deleteRole = async (req, res) => {
  try {
    const { _id } = req.params;

    const deleted = await Role.deleteById(_id);
    if (!deleted) return res.status(404).json(new ApiError(404, "Role not found"));

    res.json(new ApiResponse(200, null, "Role deleted successfully"));
  } catch (error) {
    res.status(500).json(new ApiError(500, "Failed to delete role", [error.message]));
  }
};

module.exports = controller;

// Permission Routes function
function getPermissionRoutes(data) {
  const originRoutesArr = [];
  data.permissions.forEach((module) => {
    const moduleKey = module.module.toLowerCase();
    const moduleRoutes = routesPermission[moduleKey];
    if (moduleRoutes) {
      module.submodules.forEach((submodule) => {
        Object.entries(submodule.actions).forEach(([actionKey, isAllowed]) => {
          if (isAllowed) {
            moduleRoutes.routes.forEach((route) => {
              if (route.key === actionKey) {
                if (Array.isArray(route.route)) {
                  originRoutesArr.push(...route.route);
                } else {
                  originRoutesArr.push(route.route);
                }
              }
            });
          }
        });
      });
    }
  });
  const predefinedRoutes = [
    "/api/auth/admin-login",
    "/api/auth/admin-forgot-password",
    "/api/auth/admin-reset-password",
    "/api/admin/dashboard-user/role",
    "/dashboard-user/role/details",
    "/api/admin/dashboard",
    "/api/admin/profile",    
  ];
  originRoutesArr.push(...predefinedRoutes);
  const updatedRoutes = originRoutesArr.map(route => route);
  return Array.from(new Set(updatedRoutes));
}