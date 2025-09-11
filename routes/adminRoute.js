const express = require("express");
const multer = require("multer");
const fs = require("fs");
const { protect, adminProtect, dashboardProtect } = require("../middleware/authMiddleware");
const AdminController = require("../controllers/Admin/AdminController");
const RoleController = require("../controllers/Admin/roleController");
const { roleCreate } = require('../utils/validator/role.validation');
const { userCreate } = require('../utils/validator/admin/user.validation');
const EventController = require("../controllers/Admin/eventController");
const PollController = require("../controllers/Admin/pollController");
const TaskController = require("../controllers/Admin/taskController");
const BillController = require("../controllers/Admin/billController");
const ShopCategoryController = require("../controllers/Admin/shoppingCategoryController");

const router = express.Router();

// Multer storage setup (for single and multiple uploads)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "uploads/";

    // Decide folder based on field name
    if (file.fieldname === "profilePic" || file.fieldname === "selfie") {
      folder += "profiles";
    } else if (file.fieldname === "media") {
      folder += "media";
    }

    // Ensure the folder exists
    fs.mkdirSync(folder, { recursive: true });

    cb(null, folder);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const uploadSingle = multer({ storage });
const uploadMulti = multer({ storage }).array("files", 10); 

router.get("/dashboard", protect, adminProtect, AdminController.userList);
router.get("/profile", protect, adminProtect, AdminController.userProfile);
router.get("/users/list", protect, adminProtect, dashboardProtect, AdminController.userList);
router.get("/business/users/list", protect, adminProtect, dashboardProtect, AdminController.businessUserList);
router.get("/users/admin/list", protect, adminProtect, dashboardProtect, AdminController.adminUserList);
router.post("/user/create", protect, uploadSingle.single('profilePic'), userCreate, AdminController.userCreate);
router.put("/user/update/:id",protect, uploadSingle.single("profilePic"), userCreate, AdminController.userUpdate);
router.get("/user/details/:id",protect, adminProtect, AdminController.userDetail);
router.get("/user/delete/:id",protect, adminProtect, AdminController.userDelete);
router.put('/user/restore/:id', protect, adminProtect, AdminController.restoreUser);
router.get("/user/change/status/:id",protect, adminProtect, AdminController.userChangeStatus);
router.put("/user/:userId/shopping-feed/status", protect, adminProtect, AdminController.updateShoppingFeedStatus);
router.get("/dashboard-user/role", protect, AdminController.dashboardUserRoleGet); // For routes middleware chaeck
router.get("/dashboard-user/role/details", protect, AdminController.dashboardUserRoleDetails); // For permission frontend
// Events/Polls/Survey/Tasks Management Route
router.get("/events", protect, adminProtect, EventController.eventList);
router.get("/poll-and-survay", protect, adminProtect, PollController.pollSurvaytList);
router.get("/tasks", protect, adminProtect, TaskController.taskList);
// Bill Management
router.get("/bills", adminProtect, BillController.getAllBills);
router.get("/bills/:id", adminProtect, BillController.getBillDetails);
router.put("/bills/:id", adminProtect, BillController.updateBill);
router.delete("/bills/:id", adminProtect, BillController.deleteBill);
// shopping category ROute
router.post("/category", ShopCategoryController.createCategory);
router.get("/categories", ShopCategoryController.listCategories);
router.put("/category/:categoryId", ShopCategoryController.updateCategory);
router.delete("/category/:categoryId", ShopCategoryController.deleteCategory);
// Roles & Permission
router.get('/role/all/role', protect, dashboardProtect, RoleController.getAllRole);
router.get('/role/view/role/:_id', protect, RoleController.getRoleById);
router.get('/role/get-all-inactive/role', protect, RoleController.getAllInactiveRole);
router.get('/role/get-all-deleted/role',protect, RoleController.getAllDeletedRole);
router.post('/role/create/role', protect, roleCreate, RoleController.createRole);
router.patch('/role/update/role', protect, RoleController.updateRole);
router.delete('/role/delete/role/:_id', protect, RoleController.deleteRole);

module.exports = router;
