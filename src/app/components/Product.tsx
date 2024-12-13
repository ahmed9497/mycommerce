import Image from "next/image";
import Link from "next/link";
import React from "react";
import { PiShoppingCartLight } from "react-icons/pi";
import AddToCartButton from "./AddToCartButton";
import { ProductProps } from "../types/types";

const Product = ({
  product,
  quickAddBtn,
}: {
  product: ProductProps;
  quickAddBtn: boolean;
}) => {
  return (
    <div
      key={product.id}
      className="group col-span-1 overflow-hidden cursor-pointer relative"
    >
      <AddToCartButton product={product} btnType="cartBtn" />
      <Link
        href={"/product/" + product?.title?.replaceAll(" ", "-")}
        className="w-full"
        key={product.id}
      >
        {product?.discount ? (
          <div className="absolute text-sm top-2 z-10 left-2 py-[1px] text-white rounded-sm px-2 bg-red-600">
            -54%
          </div>
        ) : null}
        <div className="relative overflow-hidden">
          <Image
            // src={`${product?.image}`}
            src="/chair1.webp"
            alt={product?.title}
            layout="responsive"
            width={100}
            height={100}
            className="max-h-[260px] object-cover transition-opacity duration-700 ease-in-out group-hover:opacity-0"
          />
          {/* <Image
            src="/chair1.webp"
            alt="cat"
            layout="responsive"
            width={100}
            height={100}
            className="absolute inset-0 w-full h-full object-cover opacity-0 duration-700 ease-in-out group-hover:opacity-100 group-hover:scale-125 transition-all "
          /> */}
        </div>
        <div className="text-center">
          <h1 className="font-Poppins">{product?.title} <span className="text-[12px] text-slate-500">({product?.variant?.length} Sizes)</span></h1>
          <div className="flex justify-center">
            {product?.discount ? (
              <>
                <h2 className="text-primary">{product?.discountedPrice}</h2>

                <h2 className="text-gray-300 line-through ml-3">
                  {product?.price}
                </h2>
              </>
            ) : (
              <h2 className="text-primary">{product?.price}</h2>
            )}
          </div>
        </div>
      </Link>
      {quickAddBtn && <AddToCartButton product={product} />}
    </div>
  );
};

export default Product;
