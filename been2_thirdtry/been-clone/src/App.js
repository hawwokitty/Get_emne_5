import Login from './components/LoginSignup/Login.jsx';
import Signup from './components/LoginSignup/Signup.jsx';
import Map from './components/Map.jsx';
import {RouterProvider, createBrowserRouter } from "react-router-dom";
import { AuthProvider } from './context/AuthContext.jsx';

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
    <AuthProvider>
      <RouterProvider router={route} />
    </AuthProvider>

  )
}

export default App
