
import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { MessageCircle, Send, X as CloseIcon, Bot, User, AlertTriangle } from 'lucide-react';
import Button from './Button';
import { generateUniqueId } from '../utils/helpers';
import { useAuth } from '../hooks/useAuth';
import { createOrder } from '../services/orderService';
import { NewOrderFormData } from '../../types';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const Chatbot = (): JSX.Element => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoadingResponse, setIsLoadingResponse] = useState<boolean>(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const inputRef = useRef<null | HTMLInputElement>(null);

  const { user } = useAuth();
  const API_KEY = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : undefined;

  useEffect(() => {
    const initializeChat = async () => {
      if (!API_KEY) {
        console.error("API_KEY not found. Chatbot will not function.");
        setChatError("Chatbot is unavailable: API Key is missing or not configured correctly in the environment.");
        setIsLoadingResponse(false);
        return;
      }
      
      setIsLoadingResponse(true); 
      setChatError(null);
      try {
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        
        const baseSystemInstruction = `You are NexusHelper, a friendly and efficient AI assistant for the Nexus Order Management client portal.
Your goal is to help clients manage their ICT services.
When the chat starts, provide a brief welcome message and mention a few things you can help with (e.g., "Hello! I'm NexusHelper. I can help you place new service orders, check on existing orders, or answer questions about your services. How can I assist you today?").

You can:
- Answer questions about our services, subscriptions, your orders, and invoices.
- Guide users on how to navigate the client portal.
- Help users choose a subscription that fits their needs.`;

        let systemInstructionText = baseSystemInstruction;

        if (user && user.name && user.username) {
            const userInfoForPrompt = `CONTEXT: The user is currently logged in. Their name is "${user.name}" and their email is "${user.username}". Use these as the default client name and email for new orders, but always confirm with the user.`;
            systemInstructionText = `${userInfoForPrompt}\n\n${baseSystemInstruction}`;
        }
        
        systemInstructionText += `

**Placing a New Service Order (Agentic Task):**
If a user wants to place a new service order, follow these steps carefully:
1.  Ask for the general service category they are interested in (e.g., Fibre, Web Hosting, Cloud Services). Refer to the SERVICE_CATALOG for available categories if needed.
2.  Once they provide a category, ask for the specific product or package name they want. If they are unsure, you can list a few popular options for that category or suggest they browse the 'New Service Order' page in the portal. Refer to SERVICE_CATALOG product names.
3.  Confirm their full name. If you have it from the login context (e.g., "${user?.name || 'the user'}"), confirm it like: "I have your name as ${user?.name || 'our records'}. Is this correct for the order?" If not, or if they correct you, ask for their full name.
4.  Confirm their email address. If you have it from the login context (e.g., "${user?.username || 'the user\'s email'}"), confirm it like: "And your email as ${user?.username || 'our records'}. Is this correct?" If not, or if they correct you, ask for their email.
5.  Ask for their contact phone number for the order.
6.  Ask for the physical address for delivery or installation, if applicable to the service.
7.  Ask if they have any special notes or instructions for this order.
8.  VERY IMPORTANT: After collecting ALL the above information, clearly summarize it back to the user in a bulleted list for their confirmation. For example:
    *   Service Category: [Service Category Name from SERVICE_CATALOG]
    *   Package/Product: [Package Name from SERVICE_CATALOG including price if mentioned in summary]
    *   Name: [Client Name]
    *   Email: [Client Email]
    *   Contact Number: [Contact Number]
    *   Address: [Address]
    *   Notes: [Notes, or 'None']
    Then ask "Is all this information correct? If so, I can create the order for you."
9.  If the user confirms (e.g., says "yes", "correct", "proceed"), your *next response* should ONLY be the following JSON object containing the confirmed details, and nothing else. This is critical for me (the system) to process the order.
    \`\`\`json
    {
      "action": "createOrder",
      "data": {
        "serviceType": "THE_SERVICE_CATEGORY_NAME_HERE",
        "packageName": "THE_PACKAGE_PRODUCT_NAME_HERE_INCLUDING_PRICE_IF_MENTIONED_IN_SUMMARY",
        "clientNameFromChat": "THE_CLIENT_NAME_GATHERED_OR_CONFIRMED_HERE",
        "clientEmailFromChat": "THE_CLIENT_EMAIL_GATHERED_OR_CONFIRMED_HERE",
        "clientContactNumber": "THE_CONTACT_NUMBER_HERE",
        "clientAddress": "THE_ADDRESS_HERE",
        "notes": "THE_NOTES_HERE_OR_EMPTY_STRING"
      }
    }
    \`\`\`
    (Do not add any conversational text around this JSON in this specific response if the user has confirmed. Just the JSON object as shown above, including the \`\`\`json markdown fences.)
10. After you (NexusHelper) send this JSON, I (the system) will attempt to create the order. I will then notify the user directly about the success or failure. You do not need to say anything after sending the JSON; I will handle the user notification. You can then continue the conversation if the user asks another question.

**Checking on Existing Orders (Agentic Task):**
- If a user asks about an existing order, ask for the Order ID (e.g., "ORD123").
- Once they provide it, respond with a simulated lookup: "Let me check on Order [Order ID] for you... (pause briefly using ellipses) Okay, Order [Order ID] for [Service Type like 'Fibre 50Mbps'] is currently in [Status like 'Under Review'] status. It was created on [Date like 'July 25, 2024']. You can see more details on the 'My Orders' page." (You will make up the service type, status, and date for the simulation).

**Updating Existing Orders (Guidance):**
- "If you need to update details for an existing order, like adding notes or changing contact information for that specific order, please visit the 'My Orders' section of the portal. Find your order, click 'View', and you should find options to manage it there. I can help you find an order if you give me the Order ID."
- *Do not attempt to directly update order fields or status via chat.*

**Cancelling Orders (Guidance):**
- "If you're considering cancelling an order, this is typically managed from the 'My Orders' page for that specific order. Some orders may have cancellation policies or fees depending on their status. If you can't find a cancellation option there, or if the order is already in an advanced stage, you might need to submit a 'Support Request' through the portal. Would you like help finding your order or navigating to the support request page?"
- *Do not attempt to directly cancel orders via chat.*

**General Guidelines:**
- Keep your responses concise and clear.
- Ask for information one piece at a time if multiple pieces are needed.
- Be polite, professional, and empathetic.
- Do not ask for API keys, passwords, or full credit card numbers.
- If you don't know an answer or can't perform a task, politely say so (e.g., "I'm sorry, I can't directly [perform action X], but I can guide you on how to do it in the portal.").
- Format important information like lists or confirmations clearly. Use bullet points for summarizing order details.
- SERVICE_CATALOG snippet for reference (you have access to full catalog details internally): Fibre Internet Services (Basic Fibre, Standard Fibre, etc.), Web Services (Starter Hosting, .co.za Domains), Microsoft 365 Packages, Cloud Migration, Cybersecurity, Managed ICT Support, AI Chatbots, Hybrid Work, Helpdesk System, GPU Rental, Data Backup. Each category has multiple products/packages.
`;

        const newChatSession = ai.chats.create({
          model: 'gemini-2.5-flash-preview-04-17',
          config: {
            systemInstruction: systemInstructionText,
          },
        });
        setChatSession(newChatSession);
      } catch (error: any) {
        console.error("Error initializing GoogleGenAI or Chat Session:", error);
        setChatError(`Chatbot initialization failed: ${error.message}`);
      } finally {
        setIsLoadingResponse(false);
      }
    };

    if (isOpen && !chatSession) { 
      initializeChat();
    } else if (isOpen && !API_KEY && !chatError) {
        setChatError("Chatbot is unavailable: API Key is missing or not configured correctly in the environment.");
    }
  }, [isOpen, chatSession, API_KEY, user, setChatError, setIsLoadingResponse, setChatSession]); 

  useEffect(() => {
    if (isOpen) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        inputRef.current?.focus();
    }
  }, [messages, isOpen]);

  const addMessageToUI = (text: string, sender: 'user' | 'bot', id?: string): string => {
    const messageId = id || generateUniqueId();
    const newMessage: ChatMessage = {
      id: messageId,
      text,
      sender,
      timestamp: new Date(),
    };
    setMessages(prevMessages => [...prevMessages, newMessage]);
    return messageId;
  };

  const updateMessageInUI = (id: string, newText: string) => {
    setMessages(prevMessages =>
      prevMessages.map(msg =>
        msg.id === id ? { ...msg, text: newText, timestamp: new Date() } : msg
      )
    );
  };


  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !chatSession || isLoadingResponse) return;

    addMessageToUI(inputValue, 'user');
    const currentInput = inputValue;
    setInputValue('');
    setIsLoadingResponse(true);
    setChatError(null);

    try {
      const stream = await chatSession.sendMessageStream({ message: currentInput });
      let botResponseText = "";
      const botMessageId = addMessageToUI("NexusHelper is typing...", 'bot'); 

      for await (const chunk of stream) {
        botResponseText += chunk.text;
        updateMessageInUI(botMessageId, botResponseText);
      }
      
      let parsedBotResponse;
      try {
        let cleanedText = botResponseText.trim();
        const fenceRegex = /^```json\s*\n?(.*?)\n?\s*```$/s;
        const match = cleanedText.match(fenceRegex);
        if (match && match[1]) {
            cleanedText = match[1].trim();
        }
        parsedBotResponse = JSON.parse(cleanedText);
      } catch (parseError) {
        parsedBotResponse = null; 
      }

      if (parsedBotResponse && parsedBotResponse.action === "createOrder" && parsedBotResponse.data) {
        setIsLoadingResponse(true); 
        updateMessageInUI(botMessageId, "Okay, processing your order request...");
        
        const orderDetails = parsedBotResponse.data;

        if (!user || !user.name || !user.username) {
            throw new Error("Authenticated user details are missing. Cannot place order.");
        }
        
        const orderPayload: NewOrderFormData = {
            clientName: user.name, 
            clientEmail: user.username, 
            clientContactNumber: orderDetails.clientContactNumber,
            clientAddress: orderDetails.clientAddress,
            serviceType: orderDetails.serviceType,
            packageName: orderDetails.packageName,
            notes: orderDetails.notes,
        };

        try {
            const newOrder = await createOrder(orderPayload);
            addMessageToUI(`Great! Your order ${newOrder.id} for "${orderDetails.packageName}" has been placed successfully. You can track its progress in the 'My Orders' section. You might need to refresh the page if it's already open. Is there anything else I can help you with?`, 'bot');
        } catch (apiError: any) {
            console.error("Error creating order via service:", apiError);
            addMessageToUI(`I'm sorry, I encountered an issue while trying to create your order: ${apiError.message}. Please try again, or you can place the order manually through the 'New Service Order' page.`, 'bot');
            setChatError(`Order creation failed: ${apiError.message}`);
        }
      }
      
    } catch (error: any) {
      console.error("Error sending message to Gemini or processing response:", error);
      const errText = `NexusHelper Error: ${error.message || "Sorry, I couldn't process that."}`;
      setChatError(errText); 
      addMessageToUI(errText, 'bot');
    } finally {
      setIsLoadingResponse(false);
    }
  };

  const toggleChatOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen && !API_KEY && !chatError) { 
        setChatError("Chatbot is unavailable: API Key is missing or not configured correctly in the environment.");
    } else if (isOpen && chatError && API_KEY) { 
        // If chat is being closed and there was a transient error but API key is fine, clear it.
        // If error is due to API_KEY, it will be re-set when opening.
         // setChatError(null); // Optional: only clear if not an API key issue
    }
  };
  
  if (!API_KEY && !isOpen) { 
    return (
        <button
            onClick={toggleChatOpen}
            className="fixed bottom-6 right-6 bg-red-600 text-white p-4 rounded-full shadow-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-brand-bg-dark transition-colors z-50"
            aria-label="Chatbot Unavailable"
        >
            <AlertTriangle size={28} />
        </button>
    );
  }

  return (
    <>
      <button
        onClick={toggleChatOpen}
        className="fixed bottom-6 right-6 bg-brand-accent text-white p-4 rounded-full shadow-lg hover:bg-brand-accent-hover focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 focus:ring-offset-brand-bg-dark transition-transform hover:scale-110 z-50"
        aria-label={isOpen ? "Close Chat" : "Open Chat"}
      >
        {isOpen ? <CloseIcon size={28} /> : <MessageCircle size={28} />}
      </button>

      {isOpen && (
        <div className="fixed bottom-20 right-6 w-[360px] h-[500px] bg-brand-interactive-dark-hover shadow-2xl rounded-lg flex flex-col z-50 border border-slate-600">
          <div className="flex items-center justify-between p-3 border-b border-slate-600 bg-slate-700 rounded-t-lg">
            <h3 className="text-lg font-semibold text-brand-text-light flex items-center">
              <Bot size={20} className="mr-2 text-brand-accent" /> Nexus Helper
            </h3>
            <button onClick={() => setIsOpen(false)} className="text-brand-text-light-secondary hover:text-brand-text-light">
              <CloseIcon size={20} />
            </button>
          </div>

          <div className="flex-1 p-4 space-y-3 overflow-y-auto">
            {chatError && (!chatSession || !API_KEY) && ( 
                 <div className="p-3 my-2 text-center">
                    <AlertTriangle size={32} className="mx-auto text-red-400 mb-2" />
                    <p className="text-sm text-red-400">{chatError}</p>
                    <p className="text-xs text-brand-text-light-secondary mt-1">
                      { !API_KEY ? "Please ensure the API key is correctly configured by the administrator." : "There was an issue initializing the chat."}
                    </p>
                </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-2.5 rounded-lg shadow ${
                    msg.sender === 'user' 
                      ? 'bg-brand-accent text-white rounded-br-none' 
                      : (msg.text.toLowerCase().includes('error:') || msg.text.toLowerCase().startsWith('nexushelper error:')) 
                          ? 'bg-red-700 text-red-100 rounded-bl-none'
                          : 'bg-slate-600 text-brand-text-light rounded-bl-none'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-gray-200' : 'text-brand-text-light-secondary'} text-right`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
             {isLoadingResponse && API_KEY && chatSession && 
                (!messages.length || messages[messages.length-1].sender === 'user') && (
                 <div className="flex justify-start">
                    <div className="max-w-[80%] p-2.5 rounded-lg shadow bg-slate-600 text-brand-text-light rounded-bl-none">
                        <p className="text-sm italic">NexusHelper is typing...</p>
                    </div>
                </div>
            )}
          </div>
          
          {chatError && chatSession && API_KEY && ( 
            <div className="p-2 border-t border-slate-600">
              <p className="text-xs text-red-400 text-center bg-red-900_bg-opacity-30 p-1.5 rounded">{chatError}</p>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-600 flex items-center gap-2 bg-slate-700 rounded-b-lg">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={!API_KEY ? "Chat unavailable" : (!chatSession ? "Initializing chat..." : "Type your message...")}
              className="flex-1 px-3 py-2 text-sm bg-slate-600 text-brand-text-light border border-slate-500 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-accent focus:border-brand-accent"
              disabled={isLoadingResponse || !chatSession || !API_KEY }
            />
            <Button type="submit" variant="primary" size="md" disabled={isLoadingResponse || !chatSession || !inputValue.trim() || !API_KEY} isLoading={isLoadingResponse && (!messages.length || messages[messages.length-1]?.sender === 'user')}>
              <Send size={18} />
            </Button>
          </form>
        </div>
      )}
    </>
  );
};

export default Chatbot;
