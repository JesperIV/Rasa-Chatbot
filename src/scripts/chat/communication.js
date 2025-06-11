import { ref, nextTick } from 'vue';
import axios from 'axios';                  //  to make requests better
import { v4 as uuidv4 } from 'uuid';        //  for generating UUIDs
import { cleanMessage } from './utils.js';  //  for cleaning messages

const rasaURL = import.meta.env.VITE_RASA_URL;
const userURL = import.meta.env.VITE_USER_URL;

export function useChatCommunication(bottomMarker) {
    const messages = ref([]);                                                   //  to store messages
    const userInput = ref('');                                                  //  store user input
    const cleanedUserInput = ref('');                                           //  store cleaned user input
    const isLoading = ref(false);                                               //  loading state
    const userId = ref("user_" + Math.random().toString(36).substr(2, 9));      //  generate an id to identify each instance of the chatbot
    const minLength = 2;                                                        //  minimum input length

    const getIntentAndConfidence = async (message) => {
        try {
            const response = await axios.post(rasaURL + '/model/parse', {
                text: message,
                sender: userId.value
            });

            const result = response.data;

            return {
                intent: result.intent?.name || null,
                confidence: result.intent?.confidence || null
            };
        } catch (error) {
            console.error("Error fetching intent:", error);
            return {
                intent: null,
                confidence: null
            };
        }
    };

    const sendMessage = async () => {
        if (userInput.value.length < minLength || !userInput.value.trim()) return; //  check if message is long enough

        const messageId = uuidv4();
        cleanedUserInput.value = cleanMessage(userInput.value);

        const { intent, confidence } = await getIntentAndConfidence(cleanedUserInput.value);    //  used to build the payload since rasa does not atuomatically return this

        messages.value.push({   //  add the message to the actual chat
            text: userInput.value,
            sender: 'user',
            time: new Date().toLocaleTimeString()
        });

        isLoading.value = true;
        if (bottomMarker.value) {
            bottomMarker.value.scrollIntoView({ behavior: 'smooth' });
        }

        const source = axios.CancelToken.source();  //  to handle timeouts 

        const timeoutId = setTimeout(() => controller.abort(), 10000)   //  set timeout to 10 seconds
        
        try {
            const response = await axios.post(rasaURL + '/webhooks/rest/webhook', {
                sender: userId.value,
                message: cleanedUserInput.value,
                metadata: { message_id: messageId }
            }, {
                cancelToken: source.token
            });

            clearTimeout(timeoutId);    //  Clear timeout if response is received

            const data = response.data;

            data.forEach((msg) => {
                messages.value.push({
                    id: messageId, // Assign the ID to the bot response
                    text: msg.text,
                    sender: 'bot',
                    time: new Date().toLocaleTimeString(),
                    error: false,
                    feedback: null
                });
            });

            //  Build payload following ERD
            const messageData = {
                sender_id: userId.value,
                message_id: messageId,
                user_input: userInput.value,
                timestamp: new Date().toISOString()
            };

            const responseData = {
                message_id: messageId,
                bot_output: data.map(msg => msg.text)
            };

            const intentData = {
                message_id: messageId,
                intent: intent,
                confidence: confidence
            };

            const payload = {
                message_data: messageData,
                response_data: responseData,
                intent_data: intentData,
                feedback_data: null //  added later if feedback is given
            };
            
            try {
                await axios.post(userURL + '/api/exchanges', payload);
            } catch (error) {
                console.error('Failed to store exchange summary:', error);
            }

        } catch (error) {
            if (axios.isCancel(error)) {
                messages.value.push({
                    text: 'De chat is op het moment niet beschikbaar, probeer het later opnieuw.',
                    sender: 'bot',
                    time: new Date().toLocaleTimeString(),
                    error: true,
                    feedback: null
                });
            } else {
                messages.value.push({
                    text: 'Er is iets mis gegaan bij het ophalen van de chat, probeer het later opnieuw.',
                    sender: 'bot',
                    time: new Date().toLocaleTimeString(),
                    error: true,
                    feedback: null
                });
            }
        } finally {
            isLoading.value = false;
            userInput.value = '';
            await nextTick();
            
            if (bottomMarker.value) {
                bottomMarker.value.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

    const sendFeedback = async (index, isPositive) => {
        const message = messages.value[index];
        if (!message.id) {
            console.error("No message ID available for feedback.");
            return;
        }

        //  allow feedback to be changed
        let newFeedback = messages.value[index].feedback === (isPositive ? true : false) ? null : isPositive ? true : false;

        try {
            await axios.post(userURL + '/api/exchanges/feedback', {
                message_id: message.id,
                feedback: newFeedback
            });

            messages.value[index].feedback = newFeedback;   //    update feedback in messages array
        } catch (error) {
            console.error('Failed to send feedback:', error);
            alert('Feedback kon niet worden opgeslagen, probeer het later opnieuw.');
            return;
        }
    };

    return {
        messages,
        userInput,
        cleanedUserInput,
        isLoading,
        minLength,
        getIntentAndConfidence,
        sendMessage,
        sendFeedback
    };
}