import { createSlice } from "@reduxjs/toolkit";

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    products: [],
    quantity: 0,
    total: 0,
    // shipping:100,
    // discount:0,
    // grandTotal:0
  },
  reducers: {
    addProduct: (state, action) => {
      state.quantity += 1;
      state.products.push(action.payload);
      state.total += action.payload.price * action.payload.quantity;
      // state.shipping += action.payload.shipping  ;
      // state.discount += action.payload.discount  ;
      // state.grandTotal += (state.total+state.shipping)-state.discount;
    },cartReset: (state) => {
      state.products= [];
      state.quantity= 0;
      state.total= 0;
    }
  },
});

export const { addProduct, cartReset } = cartSlice.actions;
export default cartSlice.reducer;