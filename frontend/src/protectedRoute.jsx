import { useEffect, useState } from "react"
import { Outlet, useLocation } from "react-router-dom"
import useUserStore from "./store/useUserStore"
import { checkUserAuth } from "./pages/services/user.services"
import Loader from './utils/Loader'
import { Navigate } from "react-router-dom"

export const ProtectedRoute = () => {
    const location = useLocation()  //useLocation React Router ka hook hai jo aapko current route ka location object deta hai
    const [ischecking, setIsChecking] = useState(true)
    const { isAuthenticated, setUser, clearUser } = useUserStore()

    useEffect(() => {
        const verifyAuth = async () => {
            try {
                const result = await checkUserAuth();
                if (result?.isAuthenticated) {
                    setUser(result.user)
                } else {
                    clearUser()
                }
            } catch (error) {
                console.log(error);
                clearUser()
            } finally {
                setIsChecking(false)
            }
        }
        verifyAuth();

    }, [setUser, clearUser])
    if (ischecking) {
        return <Loader />
    }
    if (!isAuthenticated) {

        return <Navigate to="/user-login" state={{ from: location }} replace />; 
        // navigate ke parameter hai
         //to → jahan redirect karna hai (string path)
        // replace → true/false, decide karta hai history stack me entry add hogi ya replace
        // state → extra data pass kar sakte ho new route  me and access  uselocation me milaiga


        //(replace = false)
        // eg:-<Navigate to="/user-login" />
        //Jab user redirect hota hai, React Router history me naya entry add karta hai.
        // Matlab browser ka back button se user redirected page se pehle ke page pe wapas ja sakta hai.
        //   replace=false → naya page “stack” me add karo
        //   replace=true → current page ko “stack” me replace karo
        // Matlab browser ka back button se user redirected page pe hi ra hai ga
        //  replace likhne ka matlab automatic true hai

        //location


    }

    //user is auth -render protected route '
    return <Outlet />

}

export const PublicRoute = () => {
    const { isAuthenticated, setUser, clearUser } = useUserStore()
    if (isAuthenticated) {
        return <Navigate to="/" replace />
    }
    return <Outlet />
}