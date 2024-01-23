import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router()

router.route('/register').post(
    upload.fields([
        // '/register' par hmm ek method run hotha registerUser tho hmm iss phale ek middleware use karna h or konki upload mullter se bana h iss liya is ke pass bhout se option hote h exmple like 'any', array ,fields , nono, single upload.fields
        {
            name : "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
    )

export default router;