import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { loginUser, logoutUser } from "../controllers/user.controller.js";
import { refreshAccessToken } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/register").post(upload.fields([
  { name: "avatar", maxCount: 1 },
  { name: "coverImage", maxCount: 1 }
]),
 registerUser);

 router.route("/login").post(loginUser);

 //secure route
 router.route("/logout").post(verifyJWT, logoutUser);
 router.route("/refresh-token").post(refreshAccessToken);

export default router;