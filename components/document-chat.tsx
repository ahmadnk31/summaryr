"use client"

import { useState, useRef, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Send, Loader2, Copy, Edit2, RotateCcw, Square, Check, X } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import type { ChatMessage } from "@/lib/types"

interface Message {
  role: "user" | "assistant"
  content: string
  id?: string
}

interface DocumentChatProps {
  documentId: string
  documentText: string
}

export function DocumentChat({ documentId, documentText }: DocumentChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [currentCompletion, setCurrentCompletion] = useState("")
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const lastUserMessageRef = useRef<string>("")
  const messageIdMapRef = useRef<Map<string, string>>(new Map()) // Maps message IDs to database IDs

  // Load chat history from database
  useEffect(() => {
    loadChatHistory()
  }, [documentId])

  const loadChatHistory = async () => {
    setIsLoadingHistory(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("document_id", documentId)
        .order("created_at", { ascending: true })

      if (error) {
        console.error("Error loading chat history:", error)
        setIsLoadingHistory(false)
        return
      }

      if (data && data.length > 0) {
        // Convert database format to Message format
        const loadedMessages: Message[] = []
        data.forEach((chatMsg: ChatMessage) => {
          // Add user message
          const userMsgId = `user-${chatMsg.id}`
          loadedMessages.push({
            role: "user",
            content: chatMsg.user_message,
            id: userMsgId,
          })
          messageIdMapRef.current.set(userMsgId, chatMsg.id)

          // Add assistant message
          const assistantMsgId = `assistant-${chatMsg.id}`
          loadedMessages.push({
            role: "assistant",
            content: chatMsg.assistant_message,
            id: assistantMsgId,
          })
          messageIdMapRef.current.set(assistantMsgId, chatMsg.id)
        })
        setMessages(loadedMessages)
      }
    } catch (error) {
      console.error("Error loading chat history:", error)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (!isLoadingHistory) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, currentCompletion, isLoadingHistory])

  // Update messages when completion streams
  useEffect(() => {
    if (currentCompletion) {
      // Update or add assistant message as it streams
      setMessages((prev) => {
        const newMessages = [...prev]
        const lastMessage = newMessages[newMessages.length - 1]
        if (lastMessage && lastMessage.role === "assistant") {
          // Update existing assistant message - create new object to trigger re-render
          newMessages[newMessages.length - 1] = {
            ...lastMessage,
            content: currentCompletion,
          }
        } else {
          // Add new assistant message
          newMessages.push({
            role: "assistant",
            content: currentCompletion,
          })
        }
        return newMessages
      })
    }
  }, [currentCompletion])

  const sendMessage = async (userMessage: string, messageHistory: Message[] = messages) => {
    // Clear previous completion when starting new message
    setCurrentCompletion("")

    // Add user message to history first
    const userMsg: Message = {
      role: "user" as const,
      content: userMessage.trim(),
      id: `user-${Date.now()}`,
    }
    const updatedMessages = [...messageHistory, userMsg]
    setMessages(updatedMessages)
    lastUserMessageRef.current = userMessage.trim()
    
    // Debug: Log to ensure message is added
    console.log("Added user message:", userMsg)

    // Start streaming
    setIsLoading(true)
    abortControllerRef.current = new AbortController()

    // Add placeholder assistant message immediately
    const assistantId = `assistant-${Date.now()}`
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: "",
        id: assistantId,
      },
    ])

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: userMessage,
          documentId,
          documentText,
          conversationHistory: updatedMessages,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error("No reader available")
      }

      let accumulatedText = ""
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        
        // toTextStreamResponse() sends text in format: "0:text\n" where text may be JSON-encoded
        // Process line by line
        const lines = chunk.split("\n")
        
        for (const line of lines) {
          if (!line) continue
          
          let textChunk = ""
          
          // AI SDK format: "0:text" where text is the actual content
          if (line.startsWith("0:")) {
            const content = line.slice(2)
            // Content might be JSON-encoded string
            if (content.startsWith('"') && content.endsWith('"')) {
              try {
                textChunk = JSON.parse(content)
              } catch {
                // If parsing fails, remove quotes manually
                textChunk = content.slice(1, -1).replace(/\\n/g, "\n").replace(/\\"/g, '"')
              }
            } else {
              textChunk = content
            }
          } else if (line.trim()) {
            // Fallback: treat as plain text
            textChunk = line
          }
          
          if (textChunk) {
            accumulatedText += textChunk
            // Update state with accumulated text
            setCurrentCompletion(accumulatedText)
          }
        }
      }
      
      // Ensure final text is set
      if (accumulatedText) {
        setCurrentCompletion(accumulatedText)
      }
      
      // Note: Message is saved to database by the API route's onFinish callback
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("Request aborted")
        // Remove the empty assistant message if aborted
        setMessages((prev) => prev.filter((m) => m.id !== assistantId || m.content))
      } else {
        console.error("Error:", error)
        setMessages((prev) => {
          const newMessages = [...prev]
          const lastMsg = newMessages[newMessages.length - 1]
          if (lastMsg && lastMsg.role === "assistant" && lastMsg.id === assistantId) {
            lastMsg.content = "Sorry, I encountered an error. Please try again."
          } else {
            newMessages.push({
              role: "assistant",
              content: "Sorry, I encountered an error. Please try again.",
              id: assistantId,
            })
          }
          return newMessages
        })
      }
    } finally {
      setIsLoading(false)
      // Don't clear currentCompletion here - let it stay in the message
      // It will be cleared when a new message starts
      abortControllerRef.current = null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")
    await sendMessage(userMessage)
  }

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsLoading(false)
    }
  }

  const handleRetry = async (messageIndex: number) => {
    // Find the user message before this assistant message
    const userMessage = messages[messageIndex - 1]
    const assistantMessage = messages[messageIndex]
    
    if (userMessage && userMessage.role === "user" && assistantMessage && assistantMessage.role === "assistant") {
      // Delete the old chat message pair from database
      const dbId = messageIdMapRef.current.get(assistantMessage.id || "")
      if (dbId) {
        try {
          const supabase = createClient()
          await supabase.from("chat_messages").delete().eq("id", dbId)
          // Remove from map
          messageIdMapRef.current.delete(assistantMessage.id || "")
          messageIdMapRef.current.delete(userMessage.id || "")
        } catch (err) {
          console.error("Error deleting message for retry:", err)
        }
      }

      // Remove the assistant message and any messages after it
      const messagesToKeep = messages.slice(0, messageIndex)
      setMessages(messagesToKeep)
      await sendMessage(userMessage.content, messagesToKeep)
    }
  }

  const handleRetryUserMessage = async (messageIndex: number) => {
    // Retry from a user message - regenerate the assistant response
    const userMessage = messages[messageIndex]
    
    if (userMessage && userMessage.role === "user") {
      // Delete the assistant response if it exists
      const assistantMessage = messages[messageIndex + 1]
      if (assistantMessage && assistantMessage.role === "assistant") {
        const dbId = messageIdMapRef.current.get(assistantMessage.id || "")
        if (dbId) {
          try {
            const supabase = createClient()
            await supabase.from("chat_messages").delete().eq("id", dbId)
            messageIdMapRef.current.delete(assistantMessage.id || "")
            messageIdMapRef.current.delete(userMessage.id || "")
          } catch (err) {
            console.error("Error deleting message for retry:", err)
          }
        }
      }

      // Remove the assistant message and any messages after it
      const messagesToKeep = messages.slice(0, messageIndex + 1)
      if (assistantMessage) {
        messagesToKeep.pop() // Remove assistant message
      }
      setMessages(messagesToKeep)
      await sendMessage(userMessage.content, messagesToKeep)
    }
  }

  const handleEdit = (messageIndex: number) => {
    const message = messages[messageIndex]
    if (message) {
      setEditingMessageId(message.id || `edit-${messageIndex}`)
      setEditContent(message.content)
    }
  }

  const handleSaveEdit = async () => {
    if (!editingMessageId || !editContent.trim()) return

    const messageIndex = messages.findIndex((m) => m.id === editingMessageId)
    if (messageIndex === -1) return

    const message = messages[messageIndex]
    const isUserMessage = message.role === "user"
    const dbId = messageIdMapRef.current.get(editingMessageId)

    // Update the message
    const updatedMessages = [...messages]
    updatedMessages[messageIndex] = {
      ...updatedMessages[messageIndex],
      content: editContent.trim(),
    }

    if (isUserMessage) {
      // If editing user message, delete old chat message pair and regenerate
      if (dbId) {
        try {
          const supabase = createClient()
          await supabase.from("chat_messages").delete().eq("id", dbId)
          // Also remove the assistant message ID from the map
          const assistantId = `assistant-${dbId}`
          messageIdMapRef.current.delete(assistantId)
          messageIdMapRef.current.delete(editingMessageId)
        } catch (err) {
          console.error("Error deleting old message:", err)
        }
      }

      // Remove assistant response if it exists
      if (updatedMessages[messageIndex + 1]?.role === "assistant") {
        const assistantMsg = updatedMessages[messageIndex + 1]
        if (assistantMsg.id) {
          const assistantDbId = messageIdMapRef.current.get(assistantMsg.id)
          if (assistantDbId) {
            try {
              const supabase = createClient()
              await supabase.from("chat_messages").delete().eq("id", assistantDbId)
              messageIdMapRef.current.delete(assistantMsg.id)
            } catch (err) {
              console.error("Error deleting assistant message:", err)
            }
          }
        }
        updatedMessages.splice(messageIndex + 1)
      }

      setMessages(updatedMessages)
      setEditingMessageId(null)
      setEditContent("")

      // Resend with edited user message
      await sendMessage(editContent.trim(), updatedMessages.slice(0, messageIndex + 1))
    } else {
      // If editing assistant message, just update the text and save to DB
      setMessages(updatedMessages)
      setEditingMessageId(null)
      setEditContent("")

      // Update in database if it exists
      if (dbId) {
        try {
          const supabase = createClient()
          // Find the user message before this assistant message
          const userMessage = updatedMessages[messageIndex - 1]
          if (userMessage && userMessage.role === "user") {
            await supabase
              .from("chat_messages")
              .update({
                assistant_message: editContent.trim(),
              })
              .eq("id", dbId)
          }
        } catch (err) {
          console.error("Error updating assistant message:", err)
        }
      }
    }
  }

  const handleCancelEdit = () => {
    setEditingMessageId(null)
    setEditContent("")
  }

  const handleCopy = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedMessageId(messageId)
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
        <div className="space-y-3 pb-4">
          {isLoadingHistory && (
            <div className="text-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-sm">Loading chat history...</p>
            </div>
          )}

          {!isLoadingHistory && messages.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Send className="h-8 w-8 text-primary" />
              </div>
              <p className="text-base font-medium">Ask questions about the document</p>
              <p className="text-sm mt-2 text-muted-foreground/80">
                The AI will use the document content to answer your questions
              </p>
            </div>
          )}

          {messages.map((message, index) => {
            const isEditing = editingMessageId === message.id
            const isUser = message.role === "user"
            const isLastAssistant = !isUser && index === messages.length - 1 && isLoading
            const messageId = message.id || `msg-${index}`
            
            // Check if this is an AI response following a user message
            const prevMessage = index > 0 ? messages[index - 1] : null
            const isResponseToUser = !isUser && prevMessage?.role === "user"
            
            // Check if this is a user message following an AI response
            const nextMessage = index < messages.length - 1 ? messages[index + 1] : null
            const isUserAfterAI = isUser && prevMessage?.role === "assistant"

            return (
              <div
                key={messageId}
                className={cn(
                  "flex gap-3 group",
                  isUser ? "justify-end" : "justify-start",
                  isResponseToUser && "mt-12", // Add extra space before AI response (48px)
                  isUserAfterAI && "mt-12" // Add extra space before user message after AI response (48px)
                )}
              >
                {!isUser && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                    <span className="text-xs font-semibold text-primary">AI</span>
                  </div>
                )}

                <div className={cn("flex flex-col gap-1", isUser ? "items-end max-w-[80%]" : "items-start max-w-[80%]")}>
                  <Card
                    className={cn(
                      "relative transition-all py-0",
                      isUser
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-muted border shadow-sm",
                      isEditing && "ring-2 ring-primary"
                    )}
                  >
                    <CardContent className="p-4">
                      {isEditing ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="min-h-[80px] bg-background text-foreground"
                            autoFocus
                          />
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleCancelEdit}
                              className="h-8"
                            >
                              <X className="h-3.5 w-3.5 mr-1" />
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleSaveEdit}
                              className="h-8"
                            >
                              <Check className="h-3.5 w-3.5 mr-1" />
                              {message.role === "user" ? "Save & Regenerate" : "Save"}
                            </Button>
                          </div>
                        </div>
                      ) : message.role === "assistant" ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="mb-2 last:mb-0 text-sm leading-relaxed">{children}</p>,
                              h1: ({ children }) => <h1 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-sm font-semibold mb-1 mt-2 first:mt-0">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 mt-2 first:mt-0">{children}</h3>,
                              ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1 text-sm">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1 text-sm">{children}</ol>,
                              li: ({ children }) => <li className="ml-4">{children}</li>,
                              code: ({ children, className }) =>
                                className ? (
                                  <code className="bg-background/80 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
                                ) : (
                                  <code className="bg-background/80 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
                                ),
                              pre: ({ children }) => (
                                <pre className="bg-background/80 p-3 rounded-lg overflow-x-auto mb-2 text-xs border">
                                  {children}
                                </pre>
                              ),
                              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                              em: ({ children }) => <em className="italic">{children}</em>,
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                          {isLastAssistant && currentCompletion && (
                            <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse" />
                          )}
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {message.content || "(No content)"}
                          </p>
                          
                        </div>
                      )}
                    </CardContent>

                    {/* Action buttons */}
                    {!isEditing && (
                      <div
                        className={cn(
                          "absolute -bottom-8 flex gap-1 z-10",
                          isUser ? "right-0" : "left-0"
                        )}
                      >
                        {isUser && (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 bg-background/95 backdrop-blur-sm hover:bg-background border shadow-md hover:shadow-lg transition-all text-foreground"
                              onClick={() => handleEdit(index)}
                              title="Edit message"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 bg-background/95 backdrop-blur-sm hover:bg-background border shadow-md hover:shadow-lg transition-all text-foreground"
                              onClick={() => handleRetryUserMessage(index)}
                              disabled={isLoading}
                              title="Retry"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 bg-background/95 backdrop-blur-sm hover:bg-background border shadow-md hover:shadow-lg transition-all text-foreground"
                              onClick={() => handleCopy(message.content, messageId)}
                              title="Copy"
                            >
                              {copiedMessageId === messageId ? (
                                <Check className="h-3.5 w-3.5 text-green-600" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </>
                        )}
                        {!isUser && (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 bg-background/95 backdrop-blur-sm hover:bg-background border shadow-md hover:shadow-lg transition-all"
                              onClick={() => handleEdit(index)}
                              title="Edit AI response"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 bg-background/95 backdrop-blur-sm hover:bg-background border shadow-md hover:shadow-lg transition-all"
                              onClick={() => handleRetry(index)}
                              disabled={isLoading}
                              title="Retry"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 bg-background/95 backdrop-blur-sm hover:bg-background border shadow-md hover:shadow-lg transition-all"
                              onClick={() => handleCopy(message.content, messageId)}
                              title="Copy"
                            >
                              {copiedMessageId === messageId ? (
                                <Check className="h-3.5 w-3.5 text-green-600" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </Card>
                </div>

                {isUser && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mt-1">
                    <span className="text-xs font-semibold text-primary">You</span>
                  </div>
                )}
              </div>
            )
          })}

          {isLoading && messages.length > 0 && !currentCompletion && (
            <div className="flex justify-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-semibold text-primary">AI</span>
              </div>
              <Card className="bg-muted border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="mt-4 space-y-2">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about the document..."
              className="min-h-[60px] resize-none pr-12 border-2 focus:border-primary/50"
              disabled={isLoading}
            />
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
              {input.length > 0 && `${input.length} chars`}
            </div>
          </div>
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            size="icon"
            className="flex-shrink-0 h-[60px] w-[60px] shadow-md hover:shadow-lg transition-shadow"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </form>

        {isLoading && (
          <Button
            onClick={handleStop}
            variant="destructive"
            size="sm"
            className="w-full shadow-sm"
          >
            <Square className="h-4 w-4 mr-2" />
            Stop Generating
          </Button>
        )}
      </div>
    </div>
  )
}

