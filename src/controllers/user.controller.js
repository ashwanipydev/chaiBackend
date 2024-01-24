import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"


//? Generating access and refresh tokens is a common task. You always make it, so now we'll create a separate method for it.
const generateAccessAndRefreshTokens = async(userId)=>{
    try {
        //* evey mongoDB have _id 
        const user = await User.findById(userId)
        //* access and refresh token refrcion store in variable
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        //* now refreshToken store in db . ues user to init
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false})

        //* return accessToken and refreshToken 
        return {accessToken, refreshToken}
        
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refersh and access token")
    }
}


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
    console.log(req.body)

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
    
    const existedUser = await User.findOne({
        $or : [{ username },{ email }] // kounki user mogooes s create hua h islya findone istamal kar pye or apni query likh paye hmm {username} de skthe tha par hmm username or email par check karna tha tho hmm ye snystax fowlo karna padha keyword "opretor like $or" or bhi h .
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already  exists")
    }

    // check for images, check for avater:  req.body jasi hmmme data deta h par hmne route me middlewear laga diya who bhi hmme option deta he like req.files
    
    const avatarLocalPath = req.files?.avatar[0]?.path //ye hmrhe localserver par h.
    console.log(avatarLocalPath);
    // const coverImageLocalPath = req.files?.coverImage[0]?.path //ye hmrhe localserver par h.
    // yhna par hmm check nhai kar ki req.files se hmm coverImage ki array mil bhi rhai h ya nhai    lakin hmm uska path le rhae h yhna par hmm error ka smana karna padhe ga so ⬇ niche diya code se solve ho gi 


    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

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

    const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()
   })

   //* check for usr creation : phela user create hua h ya nhai iske liya methed hai .findById because mongoDB add id too every user.
   //* remove password and refresh token field from response
   const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
   )
   
           

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    //* return res : is keliya bi apiresponse file import kari pade gi but ye ise thare se hogi
    return  res.status(201).json(
        new ApiResponse(200, createdUser, "user is created susscefull")
    )

})

// loginUser
//? In this section, we will discuss how to use access tokens and refresh tokens.

const loginUser = asyncHandler(async (req, res)=>{
    //* step:1 req.body 👉 get data
    const {email, username, password} = req.body

    //* Here is a logic for check user fil email and username fileds
    //* Decide which base to use for login: username, email, or both.
    if (!(username || email)) {
        throw new ApiError(400, "username and email filed is required")
    }

    const user = await User.findOne({
        $or: [{email}, {username}]
    })

    //* step:2 find the user and also check password
    //* check user find or not
    if (!user) {
        throw new ApiError(404, "User dose not exist")
    }

    //* If user is find so check the password. We have a methods in user.model file isPasswordCorrect.
    const isPasswordValid = await user.isPasswordCorrect(password) // return true or false

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials!")
    }

    //* step:3 Make access and refresh tokens in send the secure cookies.
    //* becous of it is db call it's take some time so use awit 
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    //* now if you want to update data in user but refreshToken fileds is emmpty. But we write another query . I'm stil confuesd

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken") //now we able to prevant password and refresh token not send to user.

    //* Cookies are modifiable on the frontend, so we provide options because we only want them to be modifiable on the server. 

    const options = {
        httpOnly: true,
        secure: true,
    }

    //* step:4 send response
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged in successFully!!!"
        )
    )
})


const logoutUser = asyncHandler(async(req, res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(
            200,
            {},
            "User logout SucessfullY!")
    )
})

//* create a endpoint where fontend developer hit to create and store new refreshAccessTOken req.
const refreshAccessToken = asyncHandler(async (req, res)=>{
    //* when someone hit endpoint it means he send me refreshToken becasue of tokens are in cookies.
    const incomingRefrehToken =  req.cookies.refreshToken || req.body.refreshToken

    //* check if not incomingRefreshToken 
    if (incomingRefrehToken) {
        throw new ApiError(401, "Unauthorized requsest")
    }
    
try {
        //* verify token useing jwt
        const decodedToken = jwt.verify(incomingRefrehToken,process.env.REFRESH_TOKEN_SECRET)
    
        //* find User
        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        //* to check incomng token and save refresh token are same
    
        if (incomingRefrehToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
        
        //* generate tokens
        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken, 
                    refreshToken: newRefreshToken
                },
                "Access token refresh token"
                
            )
        )
} catch (error) {
    throw new ApiError(401, error?.message || "Invalid Access Token")
}
})

export  { 
    registerUser, 
    loginUser,
    logoutUser,
    refreshAccessToken 
}