import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"



const registerUser = asyncHandler( async (req, res)=>{
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username , email 
    // check for images, check for avater 
    // upload them to cloudinary, avater 
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for usr creation 
    // return res


    const {fullName, email, username, password} = req.body // this line only hendal data not files.
    console.log("email: ", email);
    console.log("password: ", password)

    // file upload ke liya multer ues kar rhae hani  tho upload ko rutes m imort kana padhe ga iska code hmne routes wali file m kiya .

    // validation ke liya code iss ke liya hmme phle apiErorr wali file ko import krana pdhe ga

    /** 
     * this is also fine but to time taking and pepole asum you are a beggner let's chack new and addvasn methods to validated
    if (fullName === "") {
        throw new ApiError(400, 'This feilds is required!!')
    }
    */

    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, 'All feilds is required!!')
    }

    // check if user already exists: username , email is ke liya user chaiy or ya h models k pass import karo phele kounki user mogooes s bana h isliy y possbil h.
    
    const existedUser = User.findOne({
        $or : [{ username },{ email }] // kounki user mogooes s create hua h islya findone istamal kar pye or apni query likh paye hmm {username} de skthe tha par hmm username or email par check karna tha tho hmm ye snystax fowlo karna padha keyword "opretor like $or" or bhi h .
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already  exists")
    }

    // check for images, check for avater:  req.body jasi hmmme data deta h par hmne route me middlewear laga diya who bhi hmme option deta he like req.files
    
    const avatarLocalPath = req.files?.avatar[0]?.path //ye hmrhe localserver par h.
    console.log(avatarLocalPath);
    const coverImageLocalPath = req.files?.coverImage[0]?.path //ye hmrhe localserver par h.
    console.log(coverImageLocalPath);

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avater is required")
    }

    // upload them to cloudinary, avater: upload ke liya cloudinary wali file import kana padag karo phis 

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avater is required")
    }

    // create user object - create entry in db: User.creatae({})

    const user = User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage.url || "",
    email,
    password,
    username: username.toLowerCase()
   })
})

export  { registerUser }