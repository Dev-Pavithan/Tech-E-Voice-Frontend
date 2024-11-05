"use client";

import React, { useState, useEffect, useRef } from 'react';
import styles from '@/styles/RightSection.module.css';
import chatgptlogo2 from '@/assets/chatgptlogo2.png';
import nouserlogo from '@/assets/nouserlogo.png';
import Image from 'next/image';
import logo from '@/assets/chatgptlogo.png';
import Link from 'next/link';
import { HashLoader } from 'react-spinners';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API; // Ensure this is set correctly in .env.local

const MAX_CHUNK_LENGTH = 200; // Set maximum chunk length for speech synthesis

// Extend the Window interface for SpeechRecognition support
declare global {
    interface Window {
        SpeechRecognition: typeof window.SpeechRecognition;
        webkitSpeechRecognition: typeof window.SpeechRecognition;
    }
}

const RightSection: React.FC<{ selectedChat: { _id: string; chatName: string; messages: any[] } | null }> = ({ selectedChat }) => {
    const [message, setMessage] = useState<string>('');
    const [isSent, setIsSent] = useState<boolean>(true);
    const [allMessages, setAllMessages] = useState<any[]>([]);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const speechQueueRef = useRef<string[]>([]); // Queue for speech synthesis
    const [isSpeaking, setIsSpeaking] = useState<boolean>(false); // State for managing speech
    const [isListening, setIsListening] = useState<boolean>(false); // State for managing speech-to-text
    const recognitionRef = useRef<SpeechRecognition | null>(null); // Reference for SpeechRecognition

    const trainingPrompt = [
        {
            role: "user",
            parts: [{ text: "This is Introductory dialogue for any prompt: 'Hello, my dear friend, I am the Tech-E. I will be happy to help you.'" }]
        },
        {
            role: "model",
            parts: [{ text: "okay" }]
        }
    ];

    useEffect(() => {
        if (window.SpeechRecognition || window.webkitSpeechRecognition) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognitionInstance = new SpeechRecognition(); // Use a constant instead of recognitionRef
            recognitionInstance.continuous = false;
            recognitionInstance.interimResults = false;
            recognitionInstance.lang = 'en-US';
    
            recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
                const transcript = event.results[0][0].transcript;
                setMessage(transcript); // Set the recognized speech as the message input
                setIsListening(false);
            };
    
            recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
            };
    
            // Set it to recognitionRef so that it can be controlled elsewhere if needed
            recognitionRef.current = recognitionInstance;
        }
    }, []);
    
    
    const sendMessage = async () => {
        if (!message.trim()) return;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=` + API_KEY;

        const messagesToSend = [
            ...trainingPrompt,
            ...allMessages,
            { role: "user", parts: [{ text: message }] }
        ];
        

        setIsSent(false);

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: messagesToSend })
            });

            const resjson: any = await res.json(); // Use any type for dynamic API response
            console.log('API Response:', resjson);

            setIsSent(true);

            // Check if response structure is valid
            if (res.ok && resjson.candidates && Array.isArray(resjson.candidates) && resjson.candidates.length > 0) {
                const apiResponseMessage = resjson.candidates[0].content?.parts?.[0]?.text; // Adjust the path based on the structure
                if (!apiResponseMessage) {
                    console.error('Invalid response structure: No content found', resjson);
                    return;
                }

                const newAllMessages = [
                    ...allMessages,
                    { role: "user", parts: [{ text: message }] },
                    { role: "model", parts: [{ text: apiResponseMessage }] }
                ];

                await saveMessage('user', message);
                await saveMessage('model', apiResponseMessage);

                setAllMessages(newAllMessages);
                setMessage('');

                // Speak the response immediately after receiving it
                speakText(apiResponseMessage);
            } else {
                console.error('Invalid response structure:', resjson);
                throw new Error('Failed to get valid response from AI');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setIsSent(true);
        }
    };

    const saveMessage = async (role: string, text: string): Promise<void> => {
        try {
            const response = await fetch('http://localhost:5000/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role, text })
            });

            if (!response.ok) {
                const errorMsg = await response.json();
                console.error('Error saving message:', errorMsg);
            }
        } catch (error) {
            console.error('Error during saveMessage:', error);
        }
    };

    const sanitizeAndRenderMessage = (message: string): string => {
        const rawHTML: any = marked(message);
        return DOMPurify.sanitize(rawHTML);
    };

    const speakText = (text: string) => {
        if ('speechSynthesis' in window) {
            // Break the text into chunks
            const chunks = splitTextIntoChunks(text, MAX_CHUNK_LENGTH);
            // Add each chunk to the queue
            speechQueueRef.current.push(...chunks);
            processSpeechQueue();
        } else {
            console.error("Speech synthesis is not supported in this browser.");
        }
    };

    const splitTextIntoChunks = (text: string, maxLength: number): string[] => {
        const chunks: string[] = [];
        let currentIndex = 0;

        while (currentIndex < text.length) {
            const chunk = text.slice(currentIndex, currentIndex + maxLength);
            chunks.push(chunk);
            currentIndex += maxLength;
        }

        return chunks;
    };

    const processSpeechQueue = () => {
        if (isSpeaking || speechQueueRef.current.length === 0) return;

        setIsSpeaking(true);
        const textToSpeak = speechQueueRef.current.shift()!; // Get the first text from the queue

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        const selectedVoice = speechSynthesis.getVoices().find(voice => voice.lang === 'en-US') || null;
        utterance.voice = selectedVoice;

        utterance.onend = () => {
            console.log('Speech has finished');
            setIsSpeaking(false);
            processSpeechQueue(); // Process the next item in the queue
        };

        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            setIsSpeaking(false);
            // Handle the interrupted error
            if (event.error === 'interrupted') {
                console.log('Speech was interrupted. Resuming next item in queue.');
            }
            processSpeechQueue(); // Continue processing the queue
        };

        speechSynthesis.speak(utterance);
    };

    const toggleSpeech = () => {
        if (isSpeaking) {
            speechSynthesis.cancel(); // Stops any ongoing speech
            setIsSpeaking(false);
            speechQueueRef.current = []; // Clear the queue
        }
    };

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    useEffect(() => {
        if (selectedChat) {
            setAllMessages(selectedChat.messages || []);
        } else {
            setAllMessages([]);
        }
    }, [selectedChat]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [allMessages]); // Trigger this effect when allMessages changes

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    };

    return (
        <div className={styles.rightSection}>
            <div className={styles.rightin}>
                <div className={styles.chatgptversion}>
                    <Link href="http://localhost:3000/"> {/* Wrap the Image with Link */}
                        <Image src={logo} width={150} height={150} alt="Logo Image" />
                    </Link>
                </div>

                {Array.isArray(allMessages) && allMessages.length > 0 ? (
                    <div className={styles.messages}>
                        {allMessages.map((msg, index) => (
                            <div key={index} className={`${styles.message} ${msg.role === 'user' ? styles.userMessage : styles.modelMessage}`}>
                                <Image src={msg.role === 'user' ? nouserlogo : chatgptlogo2} width={50} height={50} alt="" />
                                <div className={styles.details}>
                                    <h2>{msg.role === 'user' ? 'You' : 'TECH-E'}</h2>
                                    <p dangerouslySetInnerHTML={{ __html: sanitizeAndRenderMessage(msg.parts[0].text) }}></p>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} /> {/* This div will be scrolled into view */}
                    </div>
                ) : (
                    <div className={styles.nochat}>
                        <Image src={chatgptlogo2} width={120} height={120} alt="" />
                        <h3 className={styles.IntroHeading}>Start a conversation...</h3>
                    </div>
                )}

                <div className={styles.bottomsection}>
                    <div className={styles.messagebar}>
                        <input
                            type="text"
                            placeholder="Type your message here..."
                            onChange={(e) => setMessage(e.target.value)}
                            value={message}
                            onKeyDown={handleKeyDown}
                            className={styles.inputField}
                        />
                        {isSent ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.sendIcon}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 15l7.5-4.5M12 15v-9" />
                            </svg>
                        ) : (
                            <HashLoader color="#36d7b7" />
                        )}
                    </div>
                    <div className={styles.buttonsContainer}>
                        <div className={styles.speechButton} onClick={toggleSpeech}>
                            {isSpeaking ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.icon}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 15V9.75M15 9.75v6.75M12 3v9" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 17.25c-2.45 0-4.5 1.56-4.5 4.5h9c0-2.94-2.05-4.5-4.5-4.5z" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.icon}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v8.25M9 9h6M12 21a9 9 0 100-18 9 9 0 000 18z" />
                                </svg>
                            )}
                            {isSpeaking ? 'Stop Speaking' : 'Speak Response'}
                        </div>

                        <div className={styles.speechButton} onClick={toggleListening}>
                            {isListening ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.icon}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 15V9.75M15 9.75v6.75M12 3v9" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 17.25c-2.45 0-4.5 1.56-4.5 4.5h9c0-2.94-2.05-4.5-4.5-4.5z" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.icon}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                                </svg>
                            )}
                            {isListening ? 'Stop Listening' : 'Speak to Type'}
                        </div>
                    </div><p>Tech-E can make mistakes. Consider checking important information.</p>
                </div>
            </div>
        </div>
    );
};

export default RightSection;
