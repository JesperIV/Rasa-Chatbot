import { ref, reactive } from 'vue';
import axios from 'axios';              //  to make the requests easier
import { v4 as uuidv4 } from 'uuid';    //  for generating UUIDs

const adminURL = import.meta.env.VITE_ADMIN_URL;    //  get the admin URL from the .env file

export function useAdminCommunication(validateExchangeFields, clearCreateFields) {
    const exchanges = ref([]);  //  store exchange data
    const newExchange = reactive({
        sender_id: "",
        message_id: "",
        user_input: "",
        bot_outputs: "",
        intent: "",
        confidence: "",
        timestamp: new Date().toISOString(),
        feedback: ""
    });
    const filters = reactive({  //  filters for requesting exchanges
        intent: "",
        confidence_flag: "",
        feedback: "",
        sender_id: "",
        sort_by: "timestamp",
        sort_order: "desc"
    });

    const loadExchanges = async () => {
        try {
            const params = new URLSearchParams();
            for (const key in filters) {
                if (filters[key]) {
                    params.append(key, filters[key] ?? '');
                }
            };

            const response = await axios.get(adminURL + "/admin/exchanges?" + params.toString());
            exchanges.value = response.data.map(exchange => ({
                ...exchange,    //  Expand already existing data since the following is only needed in Vue
                bot_outputs: Array.isArray(exchange.bot_output) ? exchange.bot_output : (typeof exchange.bot_output === "string" ? exchange.bot_output.split("|") : []),
                feedback: exchange.feedback === true ? "Positive" : exchange.feedback === false ? "Negative" : null,
                editing: false,
                collapsed: true
            }))
        } catch (error) {
            console.error("Failed to load exchanges", error);
        };
    };

    const deleteExchange = async (message_id) => {
        if (!confirm("Are you sure you want to delete this exchange?")) return;

        try {
            const response = await axios.delete(adminURL + "/admin/exchanges/" + message_id);
            exchanges.value = exchanges.value.filter(ex => ex.message_id !== message_id);
        } catch (error) {
            console.error("Failed to delete exchange", error);
        }
    };

    const createExchange = async () => {
        if (!validateExchangeFields(newExchange)) return;   //  make sure fields are filled in (correctly) before creating

        try {
            const message_id = "ADMIN_" + uuidv4();

            const messageData = {
                sender_id: newExchange.sender_id,
                message_id: message_id,
                user_input: newExchange.user_input,
                timestamp: newExchange.timestamp
            };
        
            const responseData = {
                message_id: message_id,
                bot_output: newExchange.bot_outputs.split("|").map(text => text.trim())
            };
                
            const intentData = {
                message_id: message_id,
                intent: newExchange.intent,
                confidence: parseFloat(newExchange.confidence)
            };
                
            const feedbackData = {
                message_id: message_id,
                feedback: newExchange.feedback === "Positive" ? true : newExchange.feedback === "Negative" ? false : null
            };

            const payload = {
                message_data: messageData,
                response_data: responseData,
                intent_data: intentData,
                feedback_data: feedbackData
            }
                
            await axios.post(adminURL + "/admin/exchanges", payload);
            
            clearCreateFields(newExchange);
            loadExchanges();
        } catch (error) {
            console.error("Failed to create exchange", error);
        }
    };

    const updateExchange = async (exchange) => {
        if (!validateExchangeFields(exchange)) return; //  make sure fields are filled in (correctly) before creating

        try {
            const messageData = {
                sender_id: exchange.sender_id,
                message_id: exchange.message_id,
                user_input: exchange.user_input,
                timestamp: exchange.timestamp
            };
                
            const responseData = {
                message_id: exchange.message_id,
                bot_output: exchange.bot_outputs.split("|").map(text => text.trim())
            };
        
            const intentData = {
                message_id: exchange.message_id,
                intent: exchange.intent,
                confidence: parseFloat(exchange.confidence)
            };
        
            const feedbackData = {
                message_id: exchange.message_id,
                feedback: exchange.feedback === "Positive" ? true :
                          exchange.feedback === "Negative" ? false : null
            };
                
            await axios.put(adminURL + "/admin/exchanges/" + exchange.message_id, {
                message_data: messageData,
                response_data: responseData,
                intent_data: intentData,
                feedback_data: feedbackData
            });
        
            exchange.editing = false;
            delete exchange.original;
            loadExchanges();
        } catch (error) {
            console.error("Failed to update exchange", error);
        }
    };

    return {
        exchanges,
        newExchange,
        filters,
        loadExchanges,
        deleteExchange,
        createExchange,
        updateExchange
    }
}