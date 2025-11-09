import axios from "axios";
 const apiUrl= `${import.meta.env.VITE_API_URL}/api`

 const getToken=()=>localStorage.getItem("auth-token");

export const axiosInstance = axios.create({
  baseURL:apiUrl,
  withCredentials: true, 
});
