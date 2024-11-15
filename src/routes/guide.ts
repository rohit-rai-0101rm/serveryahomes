import express from "express"
import { deleteUser, getAllUsers, getUser, loginUser, newUser, updateUserRole } from "../controllers/user.js";
import { authorizeRoles, isAuthenticated, } from "../middlewares/auth.js";
import { getAllGuides, getGuideDetails, newGuidePost } from "../controllers/guide.js";







const router = express.Router();

router.route("/new").post(isAuthenticated, authorizeRoles("superadmin"), newGuidePost);
router.route("/list").get(getAllGuides);


router.route("/:title").get(getGuideDetails);







// router.route("/super-admin/user/:id").get(getUser).delete(isAuthenticated, authorizeRoles("superadmin"), deleteUser);




export default router