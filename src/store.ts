import { configureStore } from '@reduxjs/toolkit'
import editorReducer from './reducers/editor';
import objectReducer from './reducers/object';
import typeReducer from './reducers/type';
import relationReducer from './reducers/relation';
import templateReducer from './reducers/template';
import queryReducer from './reducers/query';
import appReducer from './reducers/app';

const store = configureStore({
  reducer: {
    editor: editorReducer,
    object: objectReducer,
    type: typeReducer,
    relation: relationReducer,
    template: templateReducer,
    query: queryReducer,
    app: appReducer
  }
});

export type StoreState = ReturnType<typeof store.getState>
export default store;