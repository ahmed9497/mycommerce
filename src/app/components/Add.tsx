"use client";
import React, { FC, useState } from "react";
import { FaMinus, FaPlus } from "react-icons/fa";
import { ProductProps } from "../types/types";
import { useCart } from "../context/CartContext";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";



interface AddToCartButtonProps {
    product: ProductProps;
    // btnType?:string
  }

const Add: FC<AddToCartButtonProps|any> = ({product}) => {
  const { addItemToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const router = useRouter();

  const handleAddToCart = () => {
    const p = {
      id: product.id,
      title: product.title,
      quantity: 1,
      price: parseInt(product.variant[0].price[0]),
      image: product.image,
    };
    addItemToCart(p);
    toast.info("Product Added To Cart", {
      theme: "colored",
      hideProgressBar: true,
    });
    const audio = new Audio('/add-to-basket.mp3');
    audio.play().catch((err) => console.error('Failed to play sound:', err));
  };


  return (
    <>
      <div className="flex gap-x-4 my-5">
        <div className="flex items-center border rounded px-3">
          <FaMinus
            //   color="gray"
            size={10}
            className="cursor-pointer h-full text-gray-500 hover:text-red-500 hover:scale-125"
            onClick={(e) => setQuantity(quantity - 1)}
          />
          <input
            className=" w-12 text-center focus:outline-none"
            type="text"
            value={quantity}
            onChange={(e) => setQuantity(+e.target.value)}
          />
          <FaPlus
            //   color="gray"
            size={10}
            className="cursor-pointer h-full text-gray-500 hover:text-green-500 hover:scale-125"
            onClick={(e) => setQuantity(quantity + 1)}
          />
        </div>
        <div className="grow">
          <button
            onClick={handleAddToCart}
            className="bg-primary py-2 rounded w-full hover:bg-[#082e21] text-white"
          >
            Add To Bag
          </button>
        </div>
      </div>
      <div>
        <button 
        onClick={()=>{
          handleAddToCart();
          router.push('/checkout')
        }}
        className="bg-white py-2 rounded w-full border-2 border-primary hover:text-white hover:bg-primary text-primary">
          Buy It Now
        </button>
      </div>
    </>
  );
};

export default Add;
