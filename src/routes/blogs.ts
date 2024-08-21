import express from "express"
import { deleteUser, getAllUsers, getUser, loginUser, newUser, updateUserRole } from "../controllers/user.js";
import { authorizeRoles, isAuthenticated, } from "../middlewares/auth.js";
import { newBlogPost } from "../controllers/blogs.js";




const router = express.Router();

router.route("/new").post(isAuthenticated, authorizeRoles("superadmin"), newBlogPost);



// router.route("/super-admin/user/:id").get(getUser).delete(isAuthenticated, authorizeRoles("superadmin"), deleteUser);




export default router