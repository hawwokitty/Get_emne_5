import Login from './components/LoginSignup/Login.jsx';
import Signup from './components/LoginSignup/Signup.jsx';
import Map from './components/Map.jsx';
import {RouterProvider, createBrowserRouter } from "react-router-dom";

function App() {
const route = createBrowserRouter([
  {
    path:"/",
    element:<Signup />
  },
  {
    path:"/login",
    element:<Login />
  },
  {
    path:"/map",
    element:     <Map/>

  }
])
  return (
    <>
    <RouterProvider router={route} />
    </>
  )
}

export default App
