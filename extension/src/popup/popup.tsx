import React, { useEffect, useState } from "react"
import Login from "./components/login"
import { Session } from './types'
import CreateSong from "./components/create";

const Popup = () => {
  const [ session, setSession ] = useState<Session>()

  useEffect(() => {
    chrome.runtime.sendMessage(
      {action: 'AUTH_CHECK'},
      (session) => {    
          if (session) {
              //user is logged in
              console.log(session)
              setSession(session)
          } else {
              //no session means user not logged in
              chrome.tabs.create({
                  url: 'http://localhost:3000/login'
                }); 
          }
      }
  )
  }, [])

  return <div style={{width: 448}} className="bg-white shadow dark:bg-gray-700">
    {!session && <Login /> }
    { session && <CreateSong session={session} /> }
  </div>
};

export default Popup;