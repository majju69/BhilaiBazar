import toast from "react-hot-toast";
import { create } from "zustand";
import axios from "../lib/axios";

export const useProductStore=create((set,get)=>(
    {
        products:[],
        loading:false,
        setProducts:(products)=>set({products}),
        createProduct:async (productData)=>{
            set({loading:true});
            try{
                const res=await axios.post("/products",productData);
                set((previousState)=>({
                    products:[...previousState.products,res.data],
                    loading:false
                }));
                toast.success("Product created successfully");
            }catch(error){
                toast.error(error.response.data.message||"An error occurred");
                set({loading:false});
            }
        },
        fetchAllProducts:async ()=>{
            set({loading:true});
            try{
                const response=await axios.get("/products");
                set({products:response.data.products,loading:false});
                toast.success("Products fetched successfully",{id:"fetchAllProducts"});    // remove the id part if neccasary
            }catch(error){
                toast.error(error.message||"An error occurred");
                set({error:"Failed to fetch products",loading:false});
            }
        },
        fetchProductsByCategory:async (category)=>{
            set({loading:true});
            try{
                const response=await axios.get(`/products/category/${category}`);
                set({products:response.data.products,loading:false});
                toast.success("Products fetched successfully",{id:"fetchProductsByCategory"});  // remove the id part if neccasary
            }catch(error){
                toast.error(error.message||"An error occurred");
                set({error:"Failed to fetch products",loading:false});
            }
        },
        deleteProduct:async (productId)=>{
            set({loading:true});
            try{
                await axios.delete(`/products/${productId}`);
                set((prevProducts) => ({
                    products: prevProducts.products.filter((product) => product._id !== productId),
                    loading: false,
                }));
                toast.success("Product deleted successfully");
            }catch(error){
                toast.error(error.message||"An error occurred");
                set({loading:false});
            }
        },
        toggleFeaturedProduct:async (productId)=>{
            set({loading:true});
            try{
                const response=await axios.patch(`/products/${productId}`);
                set((prevProducts) => ({
                    products: prevProducts.products.map((product) =>
                        product._id === productId ? { ...product, isFeatured: response.data.isFeatured } : product
                    ),
                    loading: false,
                }));
                toast.success("Product featured toggled successfully");
            }catch(error){
                console.log("error",error);
                toast.error(error.message||"An error occurred");
                set({loading:false});
            }
        },
        fetchFeaturedProducts: async () => {
            set({ loading: true });
            try {
                const response = await axios.get("/products/featured");
                set({ products: response.data, loading: false });
            } catch (error) {
                set({ error: "Failed to fetch products", loading: false });
                console.log("Error fetching featured products:", error);
            }
        },
    }
));