import { redis } from "../lib/redis.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

const generateTokens=(userId)=>
{
    const accessToken=jwt.sign({userId},process.env.ACCESS_TOKEN_SECRET,{expiresIn:"15m"});
    const refreshToken=jwt.sign({userId},process.env.REFRESH_TOKEN_SECRET,{expiresIn:"7d"});
    return {accessToken,refreshToken};
}

const storeRefreshToken=async (userId,refreshToken)=>
{
    await redis.set(`refresh_token:${userId}`,refreshToken,{ex:7*24*60*60});
}

const setCookies=(res,accessToken,refreshToken)=>
{
    res.cookie("accessToken",accessToken,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",maxAge:15*60*1000});
    res.cookie("refreshToken",refreshToken,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",maxAge:7*24*60*60*1000});
}

export const signup=async (req,res)=>
{
    const {email,password,name}=req.body;
    try
    {
        const userExists=await User.findOne({email});
        if(userExists)
        {
            return res.status(400).send("User already exists");
        }
        const user=await User.create({name,email,password}); 
        const {accessToken,refreshToken}=generateTokens(user._id);
        await storeRefreshToken(user._id,refreshToken);
        setCookies(res,accessToken,refreshToken);
        res.status(201).send({
            _id:user._id
            ,name:user.name
            ,email:user.email
            ,role:user.role
            ,message:"User created successfully"});
    } 
    catch (error)
    {
        console.log(`Error in signup controller: ${error.message}\n`);
        res.status(500).json({message:`Internal server error ${error.message}`});
    }
}

export const login=async (req,res)=>
{
    try
    {
        const {email,password}=req.body;
        const user=await User.findOne({email});
        if(user&&(await user.comparePassword(password)))
        {
            const {accessToken,refreshToken}=generateTokens(user._id);
            await storeRefreshToken(user._id,refreshToken);
            setCookies(res,accessToken,refreshToken);
            res.status(200).send({
                _id:user._id
                ,name:user.name
                ,email:user.email
                ,role:user.role
                ,message:"Login successful"});
        }
        else
        {
            res.status(400).send("Invalid email or password");
        }
    }
    catch (error)
    {
        console.log(`Error in login controller: ${error.message}\n`);
        res.status(500).json({message:`Internal server error ${error.message}`});
    }
}

export const logout=async (req,res)=>
{
    try
    {
        const refreshToken=req.cookies.refreshToken;
        if(refreshToken)
        {
            const decoded=jwt.verify(refreshToken,process.env.REFRESH_TOKEN_SECRET);
            const key=`refresh_token:${decoded.userId}`;
            // console.log(`\nval: ${await redis.get(key)}\n`);
            const cntDel=await redis.del(key);
            console.log(`\n${cntDel} refresh token deleted\n`);
        }
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        // res.clearCookie("jwt");
        res.status(200).json({message:"Logout successful"});
    }
    catch(error)
    {
        console.log(`\nError in logout controller: ${error.message}\n`);
        res.status(500).json({message:`Internal server error ${error.message}`});
    }
}

export const refreshToken=async (req,res)=>
{
    try
    {
        const refreshToken=req.cookies.refreshToken;
        if(!refreshToken)
        {
            return res.status(401).json({message:"No refresh token provided"});
        }
        const decoded=jwt.verify(refreshToken,process.env.REFRESH_TOKEN_SECRET);
        const key=`refresh_token:${decoded.userId}`;
        const storedToken=await redis.get(key);
        if(storedToken!==refreshToken)
        {
            return res.status(401).json({message:"Invalid refresh token"});
        }
        const accessToken=jwt.sign({userId:decoded.userId},process.env.ACCESS_TOKEN_SECRET,{expiresIn:"15m"});
        res.cookie("accessToken",accessToken,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",maxAge:15*60*1000});
        res.status(200).json({message:"Token refreshed successfully"});
    }
    catch(error)
    {
        console.log(`\nError in refreshToken controller: ${error.message}\n`);
        res.status(500).json({message:`Internal server error ${error.message}`});
    }
}

export const getProfile=async (req,res)=>
{
    try
    {
        const user=req.user;
        res.status(200).json(user);
    }
    catch(error)
    {
        console.log(`\nError in getProfile controller: ${error.message}\n`);
        res.status(500).json({message:`Internal server error ${error.message}`});
    }
}