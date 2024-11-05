"use client"; // Add this to make the component a Client Component

import React, { useState } from "react";
import styles from "./page.module.css";
// import LeftSection from "@/components/LeftSection";
import RightSection from "@/components/RightSection";

interface Chat {
  _id: string;
  chatName: string;
  messages: any[]; // You can define this further as per your message structure
}

export default function Home() {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null); // Set type to Chat | null

  return (
    <div className={styles.mainpage}>
      <div className={styles.leftOut}>
        {/* Pass setSelectedChat to LeftSection */}
        {/* <LeftSection setSelectedChat={setSelectedChat} /> */}
      </div>
      <div className={styles.rightOut}>
        {/* Pass the selectedChat state to RightSection */}
        <RightSection selectedChat={selectedChat} />
      </div>
    </div>
  );
}
