"use client"

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { MutableRefObject, useEffect, useRef, useState } from "react";
import { connectToDatabase } from "./lib/database/supabase";
import { chatPayload, messagePayload } from "./lib/payloadsInterfaces/payload";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { generateToken } from "./lib/jwtMiddleware";


const database_history_table = "rag_history"
const SUPABASE_URL="https://msrtvvrxipekveyghgwu.supabase.co"
const SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zcnR2dnJ4aXBla3ZleWdoZ3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTk1NTQyNDcsImV4cCI6MjAzNTEzMDI0N30.iSYldNBVqsOQB9EQEvpylwHKoyHdiboXsKnI5jLxojI"
const supabase:SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
// const database_embeddings_table = process.env.DATABASE_EMBEDDINGS_TABLE!


const userId:string = '67890aabb'

export default function Home() {
  const [chatHistory, setChatHistory] = useState<chatPayload[]>([])
  const [inputQuery, setInputQuery] = useState<string>("Hello")
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const messagesEndRef: MutableRefObject<HTMLDivElement | null> = useRef(null);

  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 0);
  }, [chatHistory]);

  useEffect(()=>{
    sendPayload()
  },[])

  useEffect(()=>{
    localStorage.removeItem("sessionToken")
    const handleInserts = (payload: { new: chatPayload }) => {
      setChatHistory((prevMessages) => {
        const lastMessage = prevMessages[prevMessages.length - 1];
        const isSameType =
          lastMessage?.title === "GPT" && payload.new.title === "GPT";
        return isSameType
          ? [...prevMessages.slice(0, -1), payload.new]
          : [...prevMessages, payload.new];
      });
    };

    const subscription = supabase.channel(database_history_table).on('postgres_changes', {
      event: "INSERT",
      schema: "public",
      table: database_history_table,
    },handleInserts).subscribe();

    supabase
          .from(database_history_table)
          .select("*")
          .order("created_at", { ascending: true })
          .eq('session_id', localStorage.getItem('sessionToken'))
          .then(({ data, error }) => {
            if (error) {
              console.log("Error fetching data:", error);
            } else {
              setChatHistory(data || []);
              setIsLoading(false);
            }
          })

          console.log("data: ", chatHistory)
        return () => {
          subscription.unsubscribe();
        };
  },[]);

  const sendPayload = async() => {
    try {
      console.log("Clicked")
      if(!inputQuery) return null
      const body = JSON.stringify({userId: localStorage.getItem('sessionToken'), message: inputQuery});
      setInputQuery("")
      console.log(body)
      const response = await fetch('/api/backend', {
        method: 'POST',
        body,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if(!response.ok){
        throw new Error(`Error: ${response}`);
      }

      const responseData = await response.json();
    localStorage.setItem('sessionToken', responseData.message);

      console.log("Data: ", response)
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <main className="flex min-h-screen w-screen flex-col items-center justify-center p-24 bg-black">
      {/* Chat box */}
      <div className="w-[450px] gap-4 h-[450px] bg-white rounded-3xl py-4 px-4 inner-shadow flex flex-col">
        <div className="w-full h-fit flex items-center justify-center text-xl font-bold"><h2>User Guide Bot</h2></div>
        <div className="flex flex-1 w-full h-full overflow-auto">
          {isLoading && <div>Loading</div>}
          {!isLoading && <div className="gap-4 flex flex-col">
            {chatHistory.map((item, index)=>{
              return <div key={index} className="w-full h-fit">
                {item.title==='GPT'&&<div className="w-full justify-end flex pl-4 text-green-800"><p>{item.payload}</p></div>}
                {item.title==='Query'&&<div className="w-full justify-start flex pr-4 text-blue-800"><p>{item.payload}</p></div>}
              </div>
            })}
            </div>}
            <div ref={messagesEndRef}></div>
        </div>
        <div className="bg-transparent w-full items-center flex h-fit flex-row text-black gap-2">
            <input placeholder="Ask for guidance..." value={inputQuery} onChange={(e)=>setInputQuery(e.target.value)} className="bg-transparent rounded-full w-full h-12 shadow-2xl shadow-black text-black p-3 focus:outline-none border-2 border-slate-300 focus:ring-0"/>
            <Button onClick={sendPayload} className="bg-blue-700 shadow-2xl">Send</Button>
        </div>
      </div>
    </main>
  );
}
