"use client";
import { useCart } from "@/app/context/CartContext";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { FieldError, useForm } from "react-hook-form";

import { db, auth } from "@/app/firebase/config";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  useAuthState,
  useCreateUserWithEmailAndPassword,
} from "react-firebase-hooks/auth";
import { generateStrongPassword } from "@/app/utils/helper";
import { toast } from "react-toastify";
import Link from "next/link";
import PaymentMethod from "@/app/components/PaymentMethod";
import { useRouter } from "next/navigation";

const Checkout = () => {
  // const [createUserWithEmailAndPassword] =
  //   useCreateUserWithEmailAndPassword(auth);
  const [user] = useAuthState(auth);
  const [profile, setProfile] = useState<any>();
  const [isDisable, setIsDisable] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState("card");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
  } = useForm({
    defaultValues: {
      email: "",
      name: "",
      phone: "",
      address: "",
      country: "UAE",
      state: null,
    },
  });

  const { items, totalAmount } = useCart();
  useEffect(() => {
    if (user?.uid) {
      const fetchProfile = async () => {
        setLoading(true);
        const q = query(
          collection(db, "users"),
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          let profile = querySnapshot.docs[0].data();

          setProfile(profile);
          setValue("name", profile?.name);
          setValue("email", profile?.email);
          setValue("phone", profile?.phone);
          setValue("address", profile?.address);
          setValue("country", profile?.country);
          setValue("state", profile?.state);
          setIsDisable(true);
          setLoading(false);
        } else {
          console.log("No user found with the given email.");
          setLoading(false);

          return null;
        }
        // setLoading(false);
      };

      fetchProfile();
    }
  }, [user]);
  const handleFormSubmit = async (data: any) => {
    try {
      setLoading(true);
      if (!user?.uid) {
        const password = generateStrongPassword(16);
        const userCredential: any = await createUserWithEmailAndPassword(
          auth,
          data.email,
          password
        );

        const user = userCredential.user;

        data.userId = user.uid;

        await setDoc(doc(db, "users", user.uid), {
          ...data,
          createdAt: new Date(),
        });
      } else {
        data.userId = profile?.userId;
      }

      // if (selectedMethod === "cod") {
      //   const response = await fetch("/api/order", {
      //     method: "POST",
      //     headers: { "Content-Type": "application/json" },
      //     body: JSON.stringify({ items, data, totalAmount }),
      //   });

      //   const { message } = await response.json();
      //   router.push("/account/orders");
      //   return;
      // }

      if (selectedMethod === "tabby") {
        const payload = {
          amount: 200,
          currency: "AED",
          buyer: {
            email: "customer@example.com",
            phone: "+971501234567",
            name: "John Doe",
          },
          products: [
            {
              title: "Leather Jacket",
              description: "Black premium leather jacket",
              quantity: 1,
              unit_price: 200,
            },
          ],
        };
        const response = await fetch("/api/tabby", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload }),
        });

        const data = await response.json();

        if (
          data.configuration &&
          data.configuration?.available_products?.installments
        ) {
          const checkoutUrl =
            data.configuration.available_products?.installments[0].web_url;
          window.location.href = checkoutUrl;
        } else {
          alert("Tabby checkout is not available for this order.");
        }
        return;
      }

      // Handle Stripe payment
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, data, totalAmount, selectedMethod }),
      });

      const { url } = await response.json();
      window.location.href = url; // Redirect to Stripe Checkout
    } catch (error: any) {
      console.log("Error:", error);
      if (error.code === "auth/email-already-in-use") {
        toast.error(
          "This email is already in use. Please try logging in or use a different email.",
          { hideProgressBar: true }
        );
      }

      // Handle other Firebase error messages
      if (error.message.includes("EMAIL_EXISTS")) {
        toast.error(
          "This email is already registered. Please log in instead.",
          { hideProgressBar: true }
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container page pb-20">
      {items?.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br rounded-md from-green-100 to-blue-200 p-6">
          <div className="bg-white p-8 rounded-2xl shadow-lg flex flex-col items-center">
            {/* Empty Checkout Illustration */}
            <Image
              src={"/empty-cart.svg"}
              alt="Empty Cart"
              width={300}
              height={300}
            />
            {/* Message */}
            <h2 className="text-2xl font-bold text-gray-700 mt-4">
              Your Checkout is Empty
            </h2>
            <p className="text-gray-500 mt-2 text-center max-w-md">
              You haven’t added any items yet. Browse our amazing collection and
              add something to your cart!
            </p>
            {/* Continue Shopping Button */}
            <Link
              href={"/shop/all-products"}
              className="mt-6 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 py-6">
          <div className="order-2 sm:order-1 p-2 pb-0 sm:px-6">
            <form
              onSubmit={handleSubmit(handleFormSubmit)}
              className="space-y-4"
            >
              <h1 className="text-2xl font-bold">Contact</h1>
              {/* Email */}
              <div>
                <div className="flex justify-between">
                  <label htmlFor="email">Email</label>
                  {!user?.uid && (
                    <Link href={"/auth/login"} className="underline">
                      Login
                    </Link>
                  )}
                </div>
                <input
                  id="email"
                  type="email"
                  disabled={isDisable}
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Enter a valid email address",
                    },
                  })}
                  className="border p-2 rounded w-full"
                />
                {errors.email && (
                  <p className="text-red-500">
                    {(errors.email as FieldError).message}
                  </p>
                )}
              </div>

              <h1 className="text-2xl font-bold">Delivery</h1>

              {/* Full Name */}
              <div>
                <label htmlFor="name">Full Name</label>
                <input
                  id="name"
                  type="text"
                  {...register("name", { required: "Full name is required" })}
                  className="border p-2 rounded w-full"
                />
                {errors.name && (
                  <p className="text-red-500">
                    {(errors.name as FieldError).message}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  type="tel"
                  {...register("phone", {
                    required: "Phone number is required",
                  })}
                  className="border p-2 rounded w-full"
                />
                {errors.phone && (
                  <p className="text-red-500">
                    {(errors.phone as FieldError).message}
                  </p>
                )}
              </div>

              {/* Address */}
              <div>
                <label htmlFor="address">Address</label>
                <input
                  id="address"
                  type="text"
                  {...register("address", { required: "Address is required" })}
                  className="border p-2 rounded w-full"
                />
                {errors.address && (
                  <p className="text-red-500">
                    {(errors.address as FieldError).message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-x-3">
                <div>
                  <label htmlFor="country">Country</label>
                  <select
                    id="country"
                    {...register("country", {
                      required: "Country is required",
                    })}
                    className="border p-2 rounded w-full"
                    disabled
                  >
                    {/* <option value="">Select a country</option> */}
                    <option value="UAE">United Arab Emirates</option>
                  </select>
                  {errors.country && (
                    <p className="text-red-500">
                      {(errors.country as FieldError).message}
                    </p>
                  )}
                </div>

                <div className="">
                  <label htmlFor="state">State</label>
                  <select
                    id="state"
                    {...register("state", { required: "State is required" })}
                    className="border p-2 rounded w-full"
                  >
                    <option value="">Select a state</option>
                    <option value="Abu Dhabi">Abu Dhabi</option>
                    <option value="Dubai">Dubai</option>
                    <option value="Sharjah">Sharjah</option>
                    <option value="Ajman">Ajman</option>
                    <option value="Umm Al Quwain">Umm Al Quwain</option>
                    <option value="Fujairah">Fujairah</option>
                    <option value="Ras Al Khaimah">Ras Al Khaimah</option>
                  </select>
                  {errors.state && (
                    <p className="text-red-500">
                      {(errors.state as FieldError).message}
                    </p>
                  )}
                </div>
              </div>

              <h1 className="text-2xl font-bold">Payment Methods:</h1>
              <PaymentMethod
                selectedMethod={selectedMethod}
                setSelectedMethod={setSelectedMethod}
              />

              <button
                name="submit-btn"
                type="submit"
                className="bg-primary text-white flex justify-center gap-x-2 items-center text-xl !mt-8 py-3  rounded w-full  border-primary border-2 transition"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 mr-2 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      ></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    {selectedMethod === "card" && `Pay ${totalAmount} Aed`}
                    {selectedMethod === "cod" && `Pay ${totalAmount / 2} Aed`}
                    {selectedMethod === "tabby" && "Proceed to Checkout"}
                    {selectedMethod === "tamara" && "Proceed to Checkout"}
                    {selectedMethod === "gpay" && `Pay ${totalAmount} Aed`}
                    {selectedMethod === "apple_pay" && `Pay ${totalAmount} Aed`}
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="order-1 sm:order-2 bg-slate-200 rounded-md p-3 sm:p-10 ">
            <div className="sticky top-[100px]">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between  rounded mb-4 items-center"
                >
                  <div className="flex items-center gap-x-3">
                    <div className="relative">
                      <div className="absolute bg-primary text-white -top-2 -right-1 rounded-full flex justify-center items-center size-5 text-sm">
                        {item.quantity}
                      </div>

                      <Image
                        src={item.image}
                        alt={item.title}
                        width={80}
                        height={80}
                        className="rounded size-[80px] object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-slate-500 text-sm">{item.title}</h4>
                      <p className="text-gray-600">Aed {item.price}</p>
                      <div className="flex gap-x-3">
                        {item?.selectedSize && (
                          <p className="text-gray-600 text-[12px]">
                            {item?.selectedSize}
                          </p>
                        )}
                        {item?.selectedColor && (
                          <>
                            <div className="h-4 w-[1px] bg-black transition"></div>
                            <p className="text-gray-600 text-[12px]">
                              {item?.selectedColor}
                            </p>
                          </>
                        )}
                        {item?.selectedFeature && (
                          <>
                            <div className="h-4 w-[1px] bg-black transition"></div>
                            <p className="text-gray-600 text-[12px]">
                              {item?.selectedFeature}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {selectedMethod === "cod" ? (
                    <div className="basis-52 text-right">
                      <p>Subtotal: Aed {(item.price / 2) * item.quantity}</p>
                    </div>
                  ) : (
                    <div className="basis-52 text-right">
                      <p>Subtotal: Aed {item.price * item.quantity}</p>
                    </div>
                  )}
                </div>
              ))}
              <div className="h-[1px] mb-2 bg-gray-400" />

              <div>
                <div className="grid grid-cols-2">
                  <div>
                    Subtotal .{" "}
                    {items?.length > 0 &&
                      items?.reduce((prev, cur) => {
                        return prev + cur.quantity;
                      }, 0)}{" "}
                    Items
                  </div>
                  {selectedMethod === "cod" ? (
                    <div className="text-right">Aed {totalAmount / 2}</div>
                  ) : (
                    <div className="text-right">Aed {totalAmount}</div>
                  )}
                </div>
                <div className="grid grid-cols-2">
                  {totalAmount > 100 ? (
                    <>
                      <div>Shipping: </div>
                      <div className="text-right">Free</div>
                    </>
                  ) : (
                    <>
                      <div>Standard Shipping: </div>
                      <div className="text-right">
                        Aed {process.env.NEXT_PUBLIC_SHIPPING_CHARGES}
                      </div>
                    </>
                  )}
                </div>
                {selectedMethod === "cod" ? (
                  <>
                    <div className="grid grid-cols-2 text-xl text-red-500  my-6 font-extrabold">
                      <div className="">Remaining via COD</div>
                      <div className="text-right">Aed {totalAmount / 2}</div>
                    </div>
                    <div className="grid grid-cols-2 text-xl text-green-500  my-6 font-extrabold">
                      <div className="">Pay Now</div>
                      <div className="text-right">Aed {totalAmount / 2}</div>
                    </div>
                  </>
                ) : null}
                <div className="grid grid-cols-2 text-2xl  my-6 font-extrabold">
                  <div className="">Total</div>
                  <div className="text-right">
                    Aed{" "}
                    {totalAmount > 100
                      ? totalAmount
                      : totalAmount +
                        parseInt(process.env.NEXT_PUBLIC_SHIPPING_CHARGES!)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
