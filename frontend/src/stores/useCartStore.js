import toast from "react-hot-toast";
import { create } from "zustand";
import axios from "../lib/axios";

export const useCartStore=create((set,get)=>(
    {
        cart:[],
        coupon:null,
        total:0,
        subtotal:0,
        isCouponApplied:false,
        checkCartSizeIsZero:()=>{
            return get().cart.length===0;
        },
        getMyCoupon: async () => {
            try {
                const response = await axios.get("/coupons");
                set({ coupon: response.data });
            } catch (error) {
                console.error("Error fetching coupon:", error);
            }
        },
        applyCoupon: async (code) => {
            try {
                const response = await axios.post("/coupons/validate", { code });
                set({ coupon: response.data, isCouponApplied: true });
                get().calculateTotals();
                toast.success("Coupon applied successfully");
            } catch (error) {
                toast.error(error.response?.data?.message || "Failed to apply coupon");
            }
        },
        removeCoupon: () => {
            set({ coupon: null, isCouponApplied: false });
            get().calculateTotals();
            toast.success("Coupon removed");
        },
        getCartItems: async () => {
            try {
                const res = await axios.get("/cart");
                set({ cart: res.data });
                get().calculateTotals();
                toast.success("Cart items fetched successfully");
            } catch (error) {
                set({ cart: [] });
                toast.error(error.response?.data?.message || "An error occurred while fetching cart items");
            }
        },
        clearCart: async () => {
            try {
                const productId=null;
                set({ cart: [], coupon: null, total: 0, subtotal: 0 });
                await axios.delete(`/cart`, { data: { productId } });
                toast.success("Cart cleared successfully");
            } catch (error) {
                toast.error(error.response?.data?.message || "An error occurred while clearing cart");
            }
            // set({ cart: [], coupon: null, total: 0, subtotal: 0 });
        },
        addToCart: async (product) => {
            try {
                await axios.post("/cart", { productId:product._id });
                toast.success("Product added to cart successfully");
                set((prevState) => {
                    // console.log("prevState : ",prevState.cart);
                    const existingItem = prevState.cart.find((item) => item._id === product._id);
                    const newCart = existingItem
                        ? prevState.cart.map((item) =>
                                item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
                        )
                        : [...prevState.cart, { ...product, quantity: 1 }];
                    return { cart: newCart };
                });
                get().calculateTotals();
            } catch (error) {
                console.log("error",error);
                toast.error(error.response?.data?.message || "An error occurred while adding product to cart");
            }
        }, 
        removeFromCart: async (productId) => {
            try {
                await axios.delete(`/cart`, { data: { productId } });
                toast.success("Product removed from cart successfully");
                set((prevState) => ({
                    cart: prevState.cart.filter((item) => item._id !== productId),
                }));
                get().calculateTotals();
            } catch (error) {
                console.log("error",error);
                toast.error(error.response?.data?.message || "An error occurred while removing product from cart");
            }
        },
        updateQuantity: async (productId, quantity) => {
            if(quantity===0){
                get().removeFromCart(productId);
                return;
            }
            try {
                await axios.put(`/cart/${productId}`, {  quantity });
                toast.success("Product quantity updated successfully");
                set((prevState) => ({
                    cart: prevState.cart.map((item) =>
                        item._id === productId ? { ...item, quantity } : item
                    ),
                }));
                get().calculateTotals();
            } catch (error) {
                console.log("error",error);
                toast.error(error.response?.data?.message || "An error occurred while updating product quantity");
            }
        },
        calculateTotals: () => {
            const {cart,coupon}=get();
            const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
            let total = subtotal;
            if(coupon)
            {
                const discount=subtotal*(coupon.discountPercentage/100);
                total=subtotal-discount;
            }
            set({subtotal,total});
        },
    }
));