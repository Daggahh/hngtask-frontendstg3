"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import "@/app/styles/welcomePage.css";
import Header from "@/components/Header";
import Footer from "../components/Footer";
import { useToast } from "@/hooks/use-toast"

export default function Home() {
  const [name, setName] = useState<string>("");
  const router = useRouter();
  const { toast } = useToast()

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleStartProcessing = () => {
    if (name) {
      localStorage.setItem("userName", name);
      router.push("/chat");
    }
  };

  return (
    <>
      <Header />
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-lg w-full p-8 rounded-lg shadow-xl bg-white dark:bg-gray-800">
          <h1 className="text-4xl font-extrabold text-gray-800 dark:text-white mb-4 font-primary">
            Welcome to AIFlow!
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6 font-secondary">
            Revolutionize the way you work with AI-powered text summarization,
            translation, and language detection.
          </p>
          <p className="text-gray-600 dark:text-gray-300 mb-6 text-left">
            Let's create your profile, enter your username:
          </p>
          <input
            type="text"
            className="border-2 p-3 rounded-md mb-4 w-full text-gray-800 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-700 dark:focus:ring-gray-300"
            placeholder="Enter your username"
            value={name}
            onChange={handleNameChange}
          />
          <button
            className="cssbuttons-io-button flex mx-auto"
            onClick={() => {
              handleStartProcessing();
              toast({
                description: "Welcome to AIFlow!",
              });
            }}
          >
            Get started
            <div className="icon">
              <svg
                height="24"
                width="24"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M0 0h24v24H0z" fill="none"></path>
                <path
                  d="M16.172 11l-5.364-5.364 1.414-1.414L20 12l-7.778 7.778-1.414-1.414L16.172 13H4v-2z"
                  fill="currentColor"
                ></path>
              </svg>
            </div>
          </button>
        </div>
      </div>
      <Footer />
    </>
  );
}
