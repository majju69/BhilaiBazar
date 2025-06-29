import cloudinary from "../lib/cloudinary.js";
import { redis } from "../lib/redis.js";
import Product from "../models/product.model.js";

export const getAllProducts=async (req,res)=>
{
    try
    {
        const products=await Product.find({});
        res.status(200).json({products});
    }
    catch(error)
    {
        console.log(`\nError in getAllProducts controller: ${error.message}\n`);
        res.status(500).json({message:`Internal server error ${error.message}`});
    }
}

export const getFeaturedProducts=async (req,res)=>
{
    try
    {
        const key="featured_products";
        let featuredProducts=await redis.get(key);
        // console.log("featured products",featuredProducts);
        if(featuredProducts)
        {
            // return res.status(200).json(JSON.parse(featuredProducts));
            return res.status(200).json(featuredProducts);
        }
        featuredProducts=await Product.find({isFeatured:true}).lean();
        if(!featuredProducts)
        {
            return res.status(404).json({message:"No featured products found"});
        }
        await redis.set(key,JSON.stringify(featuredProducts));
        res.status(200).json(featuredProducts);
    }
    catch(error)
    {
        console.log(`\nError in getFeaturedProducts controller: ${error.message}\n`);
        res.status(500).json({message:`Internal server error ${error.message}`});
    }
}

export const createProduct=async (req,res)=>        // untested
{
    try
    {
        const {name,description,price,image,category}=req.body;
        let cloudinaryResponse=null;
        if(image)
        {
            cloudinaryResponse=await cloudinary.uploader.upload(image,{folder:"products"});
        }
        const product=await Product.create(
            {
                name,
                description,
                price,
                image:cloudinaryResponse?.secure_url?cloudinaryResponse.secure_url:"",
                category
            }
        );
        res.status(201).json(product);
    }
    catch(error)
    {
        console.log(`\nError in createProduct controller: ${error.message}\n`);
        res.status(500).json({message:`Internal server error ${error.message}`});
    }
}

export const deleteProduct=async (req,res)=>    // untested 1:52:58
{
    try
    {
        const product=await Product.findById(req.params.id);
        if(!product)
        {
            return res.status(404).json({message:"Product not found"});
        }
        if(product.isFeatured)      // remove if error shown
        {
            product.isFeatured=!product.isFeatured;
            await product.save();
            await updateFeaturedProductsCache();
        }
        if(product.image)
        {
            const publicId=product.image.split("/").pop().split(".")[0];
            try
            {
                await cloudinary.uploader.destroy(`products/${publicId}`);
                console.log("\nImage deleted from cloudinary\n");
            }
            catch(error)
            {
                console.log(`\nError in deleteProduct controller while deleting from cloudinary: ${error.message}\n`);
                res.status(500).json({message:`Internal server error ${error.message}`});
            }
        }
        await Product.findByIdAndDelete(req.params.id);
        res.status(200).json({message:"Product deleted successfully"});
    }
    catch(error)
    {
        console.log(`\nError in deleteProduct controller: ${error.message}\n`);
        res.status(500).json({message:`Internal server error ${error.message}`});
    }
}

export const getRecommendedProducts=async (req,res)=>       // untested 1:55:27
{
    try
    {
        const products=await Product.aggregate(
            [
                {
                    $sample:{size:3}
                },
                {
                    $project:{_id:1,name:1,description:1,image:1,price:1}
                }
            ]
        );
        res.status(200).json(products);
    }
    catch(error)
    {
        console.log(`\nError in getRecommendedProducts controller: ${error.message}\n`);
        res.status(500).json({message:`Internal server error ${error.message}`});
    }
}

export const getProductsByCategory=async (req,res)=>        // untested 1:57:04
{
    const {category}=req.params;
    try
    {
        const products=await Product.find({category});
        res.status(200).json({products});
    }
    catch(error)
    {
        console.log(`\nError in getProductsByCategory controller: ${error.message}\n`);
        res.status(500).json({message:`Internal server error ${error.message}`});
    }
}

export const toggleFeaturedProduct=async (req,res)=>        // untested 2:01:33
{
    try
    {
        const product=await Product.findById(req.params.id);
        if(product)
        {
            product.isFeatured= !product.isFeatured;
            const updatedProduct=await product.save();
            await updateFeaturedProductsCache();
            res.status(200).json(updatedProduct);
        }
        else
        {
            res.status(404).json({message:"Product not found"});
        }
    }
    catch(error)
    {
        console.log(`\nError in toggleFeaturedProduct controller: ${error.message}\n`);
        res.status(500).json({message:`Internal server error ${error.message}`});
    }
}

async function updateFeaturedProductsCache()
{
    try
    {
        const key="featured_products";
        await redis.del(key);           // delete this line if any errors
        const featuredProducts=await Product.find({isFeatured:true}).lean();
        await redis.set(key,JSON.stringify(featuredProducts));
    }
    catch(error)
    {
        console.log(`\nError in updateFeaturedProductsCache function : ${error.message}\n`);
    }
}