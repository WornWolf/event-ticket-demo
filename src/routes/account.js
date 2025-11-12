const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middleware/auth");
const upload = require("../middleware/upload");
const accountController = require("../controllers/accountController");

router.get("/me", isAuthenticated, accountController.getAccount);
router.post("/me", isAuthenticated, upload.single("avatar"), accountController.updateAccount);
router.post("/me/password", isAuthenticated, accountController.changePassword);

module.exports = router;
