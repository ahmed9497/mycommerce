// types/cart.ts
export interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }
  
  export interface CartContextType {
    items: CartItem[];
    totalAmount: number;
    addItemToCart: (item: CartItem) => void;
    removeItemFromCart: (id: string) => void;
    increaseQuantity: (itemId: string) => void;
    decreaseQuantity: (itemId: string) => void;
    updateQuantity: (productId:any,amount:any) => void;
    clearCart: () => void;
  }
  
  export interface ProductProps {
    id: string;
    name: string;
    price: number;
    description:string;
    image:string;
    discountedPrice:string;
    discount:boolean;
    rating:number;
  }