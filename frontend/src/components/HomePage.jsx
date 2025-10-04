import React, { useEffect, useState } from 'react'
import Layout from './Layout.JSX'
import {motion} from "framer-motion"
import  ChatList from "../pages/chatSection/ChatList"
import { getAllUsers } from '../pages/services/user.services'

function HomePage() {
   
    const [allUsers,setAllUser]=useState([]);
    const getAllUser=async()=>{
      try {
       const result =await getAllUsers()
       if(result.status === "success"){
        setAllUser(result.data);
       }
      } catch (error) {
        console.log(error);
      }
    }

    useEffect(()=>{
       getAllUser()
    },[])

  return (
    <>
      <Layout>
      <motion.div
      initial={{opacity:0}}
      animate={{opacity:1}}
      transition={{duration:0.5}}
      className=' h-full'
      >
        <ChatList contacts={allUsers}/>
      </motion.div>
      </Layout>
     

    </>
  )
}

export default HomePage