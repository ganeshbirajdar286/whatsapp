import { createBrowserRouter, RouterProvider, createRoutesFromElements, Route } from 'react-router-dom'
import './App.css'
import Login from './pages/user-login/Login.jsx'
import { ToastContainer } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import { ProtectedRoute, PublicRoute } from './protectedRoute.jsx';
import HomePage from './components/HomePage';
import UserDetail from './components/UserDetail.jsx';
import Status from './pages/statusSection/status.jsx';
import Settinng from './pages/settingSection/Settinng.jsx';


function App() {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <>
        <Route element={<PublicRoute />}>
          <Route path="/user-login" element={<Login />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path='/' element={<HomePage/>}></Route>
          <Route path='/user-profile' element={<UserDetail/>}/>
          <Route  path='/status' element={<Status/>}/>
          <Route  path="/setting" element={<Settinng/>}/>
        </Route>
      </>
    )
  )
  const api = `${import.meta.env.VITE_API_URL}/api`

  return (
    <>
      <ToastContainer position='top-right' autoClose={3000} />
      <RouterProvider router={router} />
   
      
    </>
  )
}

export default App
