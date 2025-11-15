import axios from "axios";
 const apiUrl= `${import.meta.env.VITE_API_URL}/api`


 const getToken=()=>localStorage.getItem("auth_token")

export const axiosInstance = axios.create({
  baseURL:apiUrl,
  withCredentials: true, 
});


axiosInstance.interceptors.request.use((config)=>{  //Interceptor = a function that runs automatically before a request or after a response.
// config = Object that contains everything about the request Axios will send.
//   config = {
//   url: "/login",
//   method: "GET",
//   headers: {
//     Authorization: "Bearer token"
//   },
//   params: {},
//   data: {}
// }

  const token=getToken();
    if(token){
       config.headers = config.headers || {};
      config.headers.Authorization=`Bearer ${token}`
    }
    return config;
})
