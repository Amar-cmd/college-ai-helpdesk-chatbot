// "use client";

// import Link from "next/link";
// import { useRef, useState } from "react";
// import { SignOutButton } from "@/components/auth/SignOutButton";
// import { BrandMark } from "@/components/common/BrandMark";
// import { ROUTES } from "@/lib/routes";
// import type { ChatMessageItem } from "@/types/chat";
// import { ChatEmptyState } from "./ChatEmptyState";
// import { ChatInput } from "./ChatInput";
// import { ChatMessage } from "./ChatMessage";
// import { ProviderStatus } from "./ProviderStatus";
// import styles from "./ChatWindow.module.css";

// type ChatWindowProps = {
//   userEmail: string;
//   userRole: string;
//   sessionId: string;
//   initialMessages: ChatMessageItem[];
//   initialError?: string | null;
// };

// type ChatApiResponse =
//   | {
//       sessionId: string;
//       userMessage: ChatMessageItem;
//       assistantMessage: ChatMessageItem;
//     }
//   | {
//       error: string;
//     };

// export function ChatWindow({
//   userEmail,
//   userRole,
//   sessionId,
//   initialMessages,
//   initialError = null,
// }: ChatWindowProps) {
//   const [messages, setMessages] = useState<ChatMessageItem[]>(initialMessages);
//   const [isLoading, setIsLoading] = useState(false);
//   const [errorMessage, setErrorMessage] = useState(initialError);
//   const chatBodyRef = useRef<HTMLDivElement | null>(null);

//   function scrollToBottom() {
//     window.setTimeout(() => {
//       chatBodyRef.current?.scrollTo({
//         top: chatBodyRef.current.scrollHeight,
//         behavior: "smooth",
//       });
//     }, 50);
//   }

//   async function handleSendMessage(content: string) {
//     setIsLoading(true);
//     setErrorMessage(null);

//     try {
//       const response = await fetch("/api/chat", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           sessionId,
//           message: content,
//         }),
//       });

//       const result = (await response.json()) as ChatApiResponse;

//       if (!response.ok || "error" in result) {
//         const friendlyErrorMessage =
//           "error" in result
//             ? result.error
//             : "The message could not be sent. Please try again.";

//         const localUserMessage: ChatMessageItem = {
//           id: crypto.randomUUID(),
//           role: "user",
//           content,
//           createdAt: new Date().toISOString(),
//         };

//         const localAssistantMessage: ChatMessageItem = {
//           id: crypto.randomUUID(),
//           role: "assistant",
//           content: friendlyErrorMessage,
//           createdAt: new Date().toISOString(),
//         };

//         setMessages((currentMessages) => [
//           ...currentMessages,
//           localUserMessage,
//           localAssistantMessage,
//         ]);

//         setErrorMessage(null);
//         scrollToBottom();
//         return;
//       }

//       setMessages((currentMessages) => [
//         ...currentMessages,
//         result.userMessage,
//         result.assistantMessage,
//       ]);
//       scrollToBottom();
//     } catch {
//       const localAssistantMessage: ChatMessageItem = {
//         id: crypto.randomUUID(),
//         role: "assistant",
//         content: "The message could not be sent. Please try again.",
//         createdAt: new Date().toISOString(),
//       };

//       setMessages((currentMessages) => [
//         ...currentMessages,
//         localAssistantMessage,
//       ]);

//       setErrorMessage(null);
//       scrollToBottom();
//     } finally {
//       setIsLoading(false);
//     }
//   }

//   return (
//     <div className={styles.chatShell}>
//       <header className={styles.chatHeader}>
//         <BrandMark />

//         <div className={styles.headerContext}>
//           <span className={styles.contextLabel}>Current workspace</span>
//           <strong>AI Buddy</strong>
//         </div>

//         <div className={styles.headerActions}>
//           <ProviderStatus status={isLoading ? "thinking" : "ready"} />
//           {userRole === "admin" ? (
//             <Link className={styles.adminLink} href={ROUTES.adminKnowledge}>
//               Admin
//             </Link>
//           ) : null}
//           <div className={styles.account}>
//             <span className={styles.avatar} aria-hidden="true">
//               {userEmail.charAt(0).toUpperCase()}
//             </span>
//             <span className={styles.accountCopy}>
//               <strong>{userEmail}</strong>
//               <small>{userRole}</small>
//             </span>
//           </div>
//           <SignOutButton compact />
//         </div>
//       </header>

//       {errorMessage ? (
//         <div className={styles.errorBanner} role="alert">
//           {errorMessage}
//         </div>
//       ) : null}

//       <div className={styles.chatBody} ref={chatBodyRef}>
//         {messages.length === 0 ? (
//           <ChatEmptyState onSelectQuestion={handleSendMessage} />
//         ) : (
//           <div className={styles.messageList}>
//             {messages.map((message) => (
//               <ChatMessage key={message.id} message={message} />
//             ))}

//             {isLoading ? (
//               <div className={styles.typingIndicator} aria-live="polite">
//                 <span />
//                 <span />
//                 <span />
//                 <em>Checking information</em>
//               </div>
//             ) : null}
//           </div>
//         )}
//       </div>

//       <ChatInput isLoading={isLoading} onSendMessage={handleSendMessage} />
//     </div>
//   );
// }

"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { BrandMark } from "@/components/common/BrandMark";
import {
  getOrCreateGuestClientId,
  getStoredGuestSessionId,
  storeGuestSessionId,
} from "@/lib/browser/guestChatStorage";
import { ROUTES } from "@/lib/routes";
import type { ChatMessageItem } from "@/types/chat";
import { ChatEmptyState } from "./ChatEmptyState";
import { ChatInput } from "./ChatInput";
import { ChatMessage } from "./ChatMessage";
import { ProviderStatus } from "./ProviderStatus";
import styles from "./ChatWindow.module.css";

type ChatWindowProps = {
  userEmail: string;
  userRole: string;
  sessionId?: string | null;
  initialMessages: ChatMessageItem[];
  initialError?: string | null;
  isGuestMode?: boolean;
};

type ChatApiResponse =
  | {
      sessionId: string;
      userMessage: ChatMessageItem;
      assistantMessage: ChatMessageItem;
    }
  | {
      error: string;
    };

export function ChatWindow({
  userEmail,
  userRole,
  sessionId = null,
  initialMessages,
  initialError = null,
  isGuestMode = false,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessageItem[]>(initialMessages);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(
    sessionId
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(initialError);
  const chatBodyRef = useRef<HTMLDivElement | null>(null);

  const accountLabel = isGuestMode ? "Guest student" : userEmail;

  function scrollToBottom() {
    window.setTimeout(() => {
      chatBodyRef.current?.scrollTo({
        top: chatBodyRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 50);
  }

  function buildRequestBody(content: string) {
    if (!isGuestMode) {
      return {
        sessionId: activeSessionId,
        message: content,
      };
    }

    const guestClientId = getOrCreateGuestClientId();
    const storedSessionId = getStoredGuestSessionId();

    return {
      sessionId: storedSessionId ?? activeSessionId,
      message: content,
      isGuestMode: true,
      guestClientId,
    };
  }

  // async function handleSendMessage(content: string) {
  //   setIsLoading(true);
  //   setErrorMessage(null);

  //   try {
  //     const response = await fetch("/api/chat", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify(buildRequestBody(content)),
  //     });

  //     const result = (await response.json()) as ChatApiResponse;

  //     if (!response.ok || "error" in result) {
  //       const friendlyErrorMessage =
  //         "error" in result
  //           ? result.error
  //           : "The message could not be sent. Please try again.";

  //       const localUserMessage: ChatMessageItem = {
  //         id: crypto.randomUUID(),
  //         role: "user",
  //         content,
  //         createdAt: new Date().toISOString(),
  //       };

  //       const localAssistantMessage: ChatMessageItem = {
  //         id: crypto.randomUUID(),
  //         role: "assistant",
  //         content: friendlyErrorMessage,
  //         createdAt: new Date().toISOString(),
  //       };

  //       setMessages((currentMessages) => [
  //         ...currentMessages,
  //         localUserMessage,
  //         localAssistantMessage,
  //       ]);

  //       setErrorMessage(null);
  //       scrollToBottom();
  //       return;
  //     }

  //     if (isGuestMode) {
  //       setActiveSessionId(result.sessionId);
  //       storeGuestSessionId(result.sessionId);
  //     }

  //     setMessages((currentMessages) => [
  //       ...currentMessages,
  //       result.userMessage,
  //       result.assistantMessage,
  //     ]);
  //     scrollToBottom();
  //   } catch {
  //     const localAssistantMessage: ChatMessageItem = {
  //       id: crypto.randomUUID(),
  //       role: "assistant",
  //       content: "The message could not be sent. Please try again.",
  //       createdAt: new Date().toISOString(),
  //     };

  //     setMessages((currentMessages) => [
  //       ...currentMessages,
  //       localAssistantMessage,
  //     ]);

  //     setErrorMessage(null);
  //     scrollToBottom();
  //   } finally {
  //     setIsLoading(false);
  //   }
  // }

    async function handleSendMessage(content: string) {
    const localUserMessage: ChatMessageItem = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };

    setMessages((currentMessages) => [...currentMessages, localUserMessage]);
    setIsLoading(true);
    setErrorMessage(null);
    scrollToBottom();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildRequestBody(content)),
      });

      const result = (await response.json()) as ChatApiResponse;

      if (!response.ok || "error" in result) {
        const friendlyErrorMessage =
          "error" in result
            ? result.error
            : "The message could not be sent. Please try again.";

        const localAssistantMessage: ChatMessageItem = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: friendlyErrorMessage,
          createdAt: new Date().toISOString(),
        };

        setMessages((currentMessages) => [
          ...currentMessages,
          localAssistantMessage,
        ]);

        setErrorMessage(null);
        scrollToBottom();
        return;
      }

      if (isGuestMode) {
        setActiveSessionId(result.sessionId);
        storeGuestSessionId(result.sessionId);

        setMessages((currentMessages) => [
          ...currentMessages,
          result.assistantMessage,
        ]);
      } else {
        setMessages((currentMessages) => [
          ...currentMessages.map((message) =>
            message.id === localUserMessage.id ? result.userMessage : message
          ),
          result.assistantMessage,
        ]);
      }

      scrollToBottom();
    } catch {
      const localAssistantMessage: ChatMessageItem = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "The message could not be sent. Please try again.",
        createdAt: new Date().toISOString(),
      };

      setMessages((currentMessages) => [
        ...currentMessages,
        localAssistantMessage,
      ]);

      setErrorMessage(null);
      scrollToBottom();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.chatShell}>
      <header className={styles.chatHeader}>
        <BrandMark />

        <div className={styles.headerContext}>
          <span className={styles.contextLabel}>Current workspace</span>
          <strong>AI Buddy</strong>
        </div>

        <div className={styles.headerActions}>
          <ProviderStatus status={isLoading ? "thinking" : "ready"} />
          {userRole === "admin" ? (
            <Link className={styles.adminLink} href={ROUTES.adminKnowledge}>
              Admin
            </Link>
          ) : null}
          <div className={styles.account}>
            <span className={styles.avatar} aria-hidden="true">
              {accountLabel.charAt(0).toUpperCase()}
            </span>
            <span className={styles.accountCopy}>
              <strong>{accountLabel}</strong>
              <small>{userRole}</small>
            </span>
          </div>
          {isGuestMode ? null : <SignOutButton compact />}
        </div>
      </header>

      {errorMessage ? (
        <div className={styles.errorBanner} role="alert">
          {errorMessage}
        </div>
      ) : null}

      <div className={styles.chatBody} ref={chatBodyRef}>
        {messages.length === 0 ? (
          <ChatEmptyState onSelectQuestion={handleSendMessage} />
        ) : (
          <div className={styles.messageList}>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {isLoading ? (
              <div className={styles.typingIndicator} aria-live="polite">
                <span />
                <span />
                <span />
                <em>Checking information</em>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <ChatInput isLoading={isLoading} onSendMessage={handleSendMessage} />
    </div>
  );
}