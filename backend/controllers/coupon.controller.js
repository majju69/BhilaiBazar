import Coupon from "../models/coupon.model.js";

export const getCoupon=async (req,res)=>        // untested 2:18:43
{
    try
    {
        const coupons=await Coupon.findOne({userId:req.user._id,isActive:true});
        res.status(200).json(coupons||null);
    }
    catch(error)
    {
        console.log(`\nError in getCoupon controller: ${error.message}\n`);
        res.status(500).json({message:`Internal server error ${error.message}`});
    }
}

export const validateCoupon=async (req,res)=>       // untested 2:22:19
{
    try
    {
        const {code}=req.body;
        const coupon=await Coupon.findOne({code:code,userId:req.user._id,isActive:true});
        if(!coupon)
        {
            return res.status(404).json({message:"Coupon not found"});
        }
        if(coupon.expirationDate<new Date())
        {
            coupon.isActive=false;
            await coupon.save();
            return res.status(400).json({message:"Coupon has expired"});
        }
        res.status(200).json(
            {
                message:"Coupon is valid",
                code:coupon.code,
                discountPercentage:coupon.discountPercentage
            }
        );
    }
    catch(error)
    {
        console.log(`\nError in validateCoupon controller: ${error.message}\n`);
        res.status(500).json({message:`Internal server error ${error.message}`});
    }
}