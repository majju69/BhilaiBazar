import Product from "../models/product.model.js";

export const getCartProducts=async (req,res)=>  // untested 2:13:21
{
    try
    {
        const products=await Product.find({_id:{$in:req.user.cartItems}});
        const cartItems=products.map(product=>
        {
            const item=req.user.cartItems.find(cartItem=>cartItem.id===product.id);
            return {...product.toJSON(),quantity:item.quantity};
        });
        res.status(200).json(cartItems);
    }
    catch(error)
    {
        console.log(`\nError in getCartItems controller: ${error.message}\n`);
        res.status(500).json({message:`Internal server error ${error.message}`});
    }
}

export const addToCart=async (req,res)=>        // untested 2:07:40
{
    try
    {
        const {productId}=req.body;
        const user=req.user;
        const existingItem=user.cartItems.find(item=>item.id===productId);
        if(existingItem)
        {
            existingItem.quantity++;
        }
        else
        {
            user.cartItems.push(productId);
        }
        await user.save();
        res.status(200).json(user.cartItems);
    }
    catch(error)
    {
        console.log(`\nError in addToCart controller: ${error.message}\n`);
        res.status(500).json({message:`Internal server error ${error.message}`});
    }
}

export const removeAllFromCart=async (req,res)=>        // untested 2:08:27
{
    try
    {
        const {productId}=req.body;
        const user=req.user;
        if(!productId)
        {
            user.cartItems=[];
        }
        else
        {
            user.cartItems=user.cartItems.filter(item=>item.id!==productId);
        }
        await user.save();
        res.status(200).json(user.cartItems);
    }
    catch(error)
    {
        console.log(`\nError in removeAllFromCart controller: ${error.message}\n`);
        res.status(500).json({message:`Internal server error ${error.message}`});
    }
}

export const updateQuantity=async (req,res)=>       // untested 2:10:27
{
    try
    {
        const {id:productId}=req.params;
        const {quantity}=req.body;
        const user=req.user;
        const existingItem=user.cartItems.find(item=>item.id===productId);
        if(existingItem)
        {
            if(quantity===0)
            {
                user.cartItems=user.cartItems.filter(item=>item.id!==productId);
                await user.save();
                return res.status(200).json(user.cartItems);
            }
            existingItem.quantity=quantity;
            await user.save();
            res.status(200).json(user.cartItems);
        }
        else
        {
            res.status(404).json({message:"Product not found"});
        }
    }
    catch
    {
        console.log(`\nError in updateQuantity controller: ${error.message}\n`);
        res.status(500).json({message:`Internal server error ${error.message}`});
    }
}