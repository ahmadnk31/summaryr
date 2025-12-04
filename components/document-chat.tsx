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
  const messageIdMapRef = useRef<Map<string, string>>(new Map())

  useEffect(() => {
    loadChatHistory()
  }, [documentId])

  useEffect(() => {
    if (!isLoadingHistory) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, currentCompletion, isLoadingHistory])

  useEffect(() => {
    if (currentCompletion) {
      setMessages((prev) => {
        const newMessages = [...prev]
        const lastMessage = newMessages[newMessages.length - 1]
        
        if (lastMessage?.role === "assistant") {
          newMessages[newMessages.length - 1] = {
            ...lastMessage,
            content: currentCompletion,
          }
        } else {
          newMessages.push({
            role: "assistant",
            content: currentCompletion,
          })
        }
        return newMessages
      })
    }
  }, [currentCompletion])

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
        return
      }

      if (data?.length) {
        const loadedMessages: Message[] = []
        data.forEach((chatMsg: ChatMessage) => {
          const userMsgId = `user-${chatMsg.id}`
          const assistantMsgId = `assistant-${chatMsg.id}`
          
          loadedMessages.push({
            role: "user",
            content: chatMsg.user_message,
            id: userMsgId,
          })
          messageIdMapRef.current.set(userMsgId, chatMsg.id)

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

  const sendMessage = async (userMessage: string, messageHistory: Message[] = messages) => {
    setCurrentCompletion("")
    
    const userMsg: Message = {
      role: "user",
      content: userMessage.trim(),
      id: `user-${Date.now()}`,
    }
    const updatedMessages = [...messageHistory, userMsg]
    setMessages(updatedMessages)
    lastUserMessageRef.current = userMessage.trim()

    setIsLoading(true)
    abortControllerRef.current = new AbortController()

    const assistantId = `assistant-${Date.now()}`
    // Don't add assistant message here - let the useEffect handle it when streaming starts

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userMessage,
          documentId,
          documentText,
          conversationHistory: updatedMessages,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const reader = response.body?.getReader()
      if (!reader) throw new Error("No reader available")

      const decoder = new TextDecoder()
      let accumulatedText = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (!line) continue

          let textChunk = ""
          if (line.startsWith("0:")) {
            const content = line.slice(2)
            if (content.startsWith('"') && content.endsWith('"')) {
              try {
                textChunk = JSON.parse(content)
              } catch {
                textChunk = content.slice(1, -1)
                  .replace(/\\n/g, "\n")
                  .replace(/\\"/g, '"')
              }
            } else {
              textChunk = content
            }
          } else if (line.trim()) {
            textChunk = line
          }

          if (textChunk) {
            accumulatedText += textChunk
            setCurrentCompletion(accumulatedText)
          }
        }
      }

      if (accumulatedText) {
        setCurrentCompletion(accumulatedText)
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        setMessages((prev) => prev.filter((m) => m.id !== assistantId || m.content))
      } else {
        console.error("Error:", error)
        setMessages((prev) => {
          const newMessages = [...prev]
          const lastMsg = newMessages[newMessages.length - 1]
          
          if (lastMsg?.role === "assistant" && lastMsg.id === assistantId) {
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
    abortControllerRef.current?.abort()
    setIsLoading(false)
  }

  const deleteMessageFromDB = async (messageId: string) => {
    const dbId = messageIdMapRef.current.get(messageId)
    if (!dbId) return

    try {
      const supabase = createClient()
      await supabase.from("chat_messages").delete().eq("id", dbId)
      messageIdMapRef.current.delete(messageId)
    } catch (err) {
      console.error("Error deleting message:", err)
    }
  }

  const handleRetry = async (messageIndex: number) => {
    const userMessage = messages[messageIndex - 1]
    const assistantMessage = messages[messageIndex]

    if (userMessage?.role === "user" && assistantMessage?.role === "assistant") {
      await deleteMessageFromDB(assistantMessage.id || "")
      await deleteMessageFromDB(userMessage.id || "")

      const messagesToKeep = messages.slice(0, messageIndex)
      setMessages(messagesToKeep)
      await sendMessage(userMessage.content, messagesToKeep)
    }
  }

  const handleRetryUserMessage = async (messageIndex: number) => {
    const userMessage = messages[messageIndex]
    if (!userMessage || userMessage.role !== "user") return

    const assistantMessage = messages[messageIndex + 1]
    if (assistantMessage?.role === "assistant") {
      await deleteMessageFromDB(assistantMessage.id || "")
      await deleteMessageFromDB(userMessage.id || "")
    }

    const messagesToKeep = messages.slice(0, messageIndex + 1)
    if (assistantMessage) messagesToKeep.pop()
    
    setMessages(messagesToKeep)
    await sendMessage(userMessage.content, messagesToKeep)
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
    const updatedMessages = [...messages]
    updatedMessages[messageIndex] = {
      ...updatedMessages[messageIndex],
      content: editContent.trim(),
    }

    if (isUserMessage) {
      await deleteMessageFromDB(editingMessageId)

      const assistantMsg = updatedMessages[messageIndex + 1]
      if (assistantMsg?.role === "assistant") {
        await deleteMessageFromDB(assistantMsg.id || "")
        updatedMessages.splice(messageIndex + 1)
      }

      setMessages(updatedMessages)
      setEditingMessageId(null)
      setEditContent("")
      await sendMessage(editContent.trim(), updatedMessages.slice(0, messageIndex + 1))
    } else {
      setMessages(updatedMessages)
      setEditingMessageId(null)
      setEditContent("")

      const dbId = messageIdMapRef.current.get(editingMessageId)
      if (dbId) {
        try {
          const supabase = createClient()
          await supabase
            .from("chat_messages")
            .update({ assistant_message: editContent.trim() })
            .eq("id", dbId)
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

  const renderMessage = (message: Message, index: number) => {
    const isEditing = editingMessageId === message.id
    const isUser = message.role === "user"
    const isLastAssistant = !isUser && index === messages.length - 1 && isLoading
    const messageId = message.id || `msg-${index}`

    const prevMessage = index > 0 ? messages[index - 1] : null
    const isResponseToUser = !isUser && prevMessage?.role === "user"
    const isUserAfterAI = isUser && prevMessage?.role === "assistant"

    return (
      <div
        key={messageId}
        className={cn(
          "flex gap-3 group",
          isUser ? "justify-end" : "justify-start",
          (isResponseToUser || isUserAfterAI) && "mt-8 sm:mt-6"
        )}
      >
        {!isUser && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-1">
            <span className="text-[10px] font-semibold text-primary">AI</span>
          </div>
        )}

        <div className={cn(
          "flex flex-col gap-2",
          isUser ? "items-end max-w-[85%]" : "items-start max-w-[85%]"
        )}>
          <Card className={cn(
            "relative transition-all py-0 my-3",
            isUser
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-muted/50 border-muted-foreground/10 shadow-sm",
            isEditing && "ring-2 ring-primary/50"
          )}>
            <CardContent className="p-4">
              {isEditing ? (
                <div className="space-y-3">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[100px] bg-background text-foreground"
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancelEdit}
                      className="h-8"
                    >
                      <X className="h-3.5 w-3.5 mr-1.5" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveEdit}
                      className="h-8"
                    >
                      <Check className="h-3.5 w-3.5 mr-1.5" />
                      {message.role === "user" ? "Save & Regenerate" : "Save"}
                    </Button>
                  </div>
                </div>
              ) : message.role === "assistant" ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => (
                        <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
                      ),
                      h1: ({ children }) => (
                        <h1 className="text-lg font-bold mb-3 mt-4 first:mt-0">{children}</h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-base font-semibold mb-2 mt-3 first:mt-0">{children}</h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-sm font-semibold mb-2 mt-3 first:mt-0">{children}</h3>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc list-inside mb-3 space-y-1.5">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal list-inside mb-3 space-y-1.5">{children}</ol>
                      ),
                      li: ({ children }) => <li className="ml-4">{children}</li>,
                      code: ({ className, children }) => (
                        <code className="bg-background/80 px-1.5 py-0.5 rounded text-xs font-mono">
                          {children}
                        </code>
                      ),
                      pre: ({ children }) => (
                        <pre className="bg-background/80 p-3 rounded-lg overflow-x-auto mb-3 text-xs border">
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
                    <span className="inline-block w-1.5 h-4 bg-current ml-1 animate-pulse" />
                  )}
                </div>
              ) : (
                <p className="whitespace-pre-wrap leading-relaxed break-words">
                  {message.content}
                </p>
              )}
            </CardContent>

            {!isEditing && (
              <div className={cn(
                "absolute -bottom-3 flex gap-1",
                isUser ? "right-0" : "left-0"
              )}>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-foreground bg-background/95 backdrop-blur-sm hover:bg-background border shadow-sm"
                  onClick={() => handleEdit(index)}
                  title="Edit"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                {isUser && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-foreground bg-background/95 backdrop-blur-sm hover:bg-background border shadow-sm"
                    onClick={() => handleRetryUserMessage(index)}
                    disabled={isLoading}
                    title="Retry"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                )}
                {!isUser && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-foreground bg-background/95 backdrop-blur-sm hover:bg-background border shadow-sm"
                    onClick={() => handleRetry(index)}
                    disabled={isLoading}
                    title="Retry"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-foreground bg-background/95 backdrop-blur-sm hover:bg-background border shadow-sm"
                  onClick={() => handleCopy(message.content, messageId)}
                  title="Copy"
                >
                  {copiedMessageId === messageId ? (
                    <Check className="h-3.5 w-3.5 text-green-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            )}
          </Card>
        </div>

        {isUser && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mt-1">
            <span className="text-[10px] font-semibold text-primary">You</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
        <div className="space-y-4 pb-4">
          {isLoadingHistory && (
            <div className="text-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading chat history...</p>
            </div>
          )}

          {!isLoadingHistory && messages.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Send className="h-8 w-8 text-primary" />
              </div>
              <p className="font-medium text-lg mb-2">Ask questions about the document</p>
              <p className="text-sm text-muted-foreground/70">
                The AI will use the document content to answer your questions
              </p>
            </div>
          )}

          {messages.map(renderMessage)}

          {isLoading && messages.length > 0 && !currentCompletion && (
            <div className="flex justify-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-[10px] font-semibold text-primary">AI</span>
              </div>
              <Card className="bg-muted/50 border-muted-foreground/10 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
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
            {input.length > 0 && (
              <div className="absolute bottom-2 right-2 text-xs text-muted-foreground pointer-events-none">
                {input.length}
              </div>
            )}
          </div>
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-[60px] w-[60px] shadow-md hover:shadow-lg transition-all"
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
            className="w-full"
          >
            <Square className="h-4 w-4 mr-2" />
            Stop Generating
          </Button>
        )}
      </div>
    </div>
  )
}