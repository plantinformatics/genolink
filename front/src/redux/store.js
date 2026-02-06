import { combineReducers, configureStore } from "@reduxjs/toolkit";
import passportReducer from "../redux/passport/passportReducer";
import genotypeReducer from "../redux/genotype/genotypeReducer";

const rootReducer = combineReducers({
  passport: passportReducer,
  genotype: genotypeReducer,
});

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    }),
});

export default store;
