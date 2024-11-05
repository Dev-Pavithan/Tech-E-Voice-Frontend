// "use client";
// import React, { useEffect, useState } from 'react';
// import chatgptlogo from '@/assets/chatgptlogo.png';
// import Image from 'next/image';
// import styles from '@/styles/LeftSection.module.css';

// interface Chat {
//   _id: string;
//   chatName: string;
//   messages: any[]; // Define this as per the structure of your messages
// }

// interface LeftSectionProps {
//   setSelectedChat: (chat: Chat) => void; // Function to pass selected chat to parent
// }

// const LeftSection: React.FC<LeftSectionProps> = ({ setSelectedChat }) => {
//   const [allChats, setAllChats] = useState<Chat[]>([]);

//   const fetchChats = async () => {
//     try {
//       const response = await fetch('http://localhost:5000/api/messages'); // Update the endpoint as needed
//       if (!response.ok) {
//         throw new Error(`HTTP error! Status: ${response.status}`);
//       }
//       const data = await response.json();

//       if (Array.isArray(data.messages)) {
//         setAllChats(data.messages); 
//       } else {
//         setAllChats([]); 
//       }
//     } catch (error) {
//       console.error('Error fetching chats:', error);
//       setAllChats([]); 
//     }
//   };

//   useEffect(() => {
//     fetchChats();
//   }, []);

//   return (
//     <div className={styles.leftSection}>
//       <div className={styles.newChat}>
//         <div>
//           <Image src={chatgptlogo} alt="ChatGPT" width={120} height={120} />
//           <p className={styles.text01}>Tech-E</p>
//         </div>

//         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
//           <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
//         </svg>
//       </div>

//       <div className={styles.allChats}>
//         {Array.isArray(allChats) && allChats.length > 0 ? (
//           allChats.map((chat, index) => (
//             <div
//               key={chat._id || index}
//               className={styles.chat}
//               onClick={() => setSelectedChat(chat)} // Set selected chat on click
//             >
//               <p className={styles.text1}>{chat.chatName}</p>
//             </div>
//           ))
//         ) : (
//           <p>No chats available</p>
//         )}
//       </div>
//     </div>
//   );
// };

// export default LeftSection;
