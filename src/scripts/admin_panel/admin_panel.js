export function useAdminPanelUI() {
    const enterEditMode = (exchange) => {
        exchange.original = { ...exchange };

        if (Array.isArray(exchange.bot_outputs)) {
            exchange.bot_outputs = exchange.bot_outputs.join("|");
        } else if (typeof exchange.bot_outputs !== 'string') {
            exchange.bot_outputs = "";
        }
    
        if (exchange.feedback === true) {
            exchange.feedback = "Positive";
        } else if (exchange.feedback === false) {
            exchange.feedback = "Negative";
        } else if (exchange.feedback !== "Positive" && exchange.feedback !== "Negative") {
            exchange.feedback = "";
        }
    
        exchange.editing = true;
    };

    const cancelEditMode = (exchange) => {
        Object.assign(exchange, exchange.original); //  reset
        exchange.bot_outputs = Array.isArray(exchange.bot_outputs) ? exchange.bot_outputs : exchange.bot_outputs.split("|");
        exchange.editing = false;
        exchange.editing = false;   //  stop editing mode
    };

    const validateExchangeFields = (exchange) => {  //  to make sure fields are filled in (correctly)
        const requiredFields = ["user_input", "bot_outputs", "intent", "confidence", "sender_id"];

        for (let field of requiredFields) {
            if (field === "bot_outputs") {  //  seperate bot_outputs since it can be an array and that doesnt work with trim()
                if (Array.isArray(exchange[field])) {
                    if (exchange[field].length === 0 || exchange[field].some(output => output.toString().trim() === "")) {
                        alert("Please fill in the bot outputs field.");
                        return false;
                    }
                } else {
                    if (!exchange[field] || exchange[field].toString().trim() === "") {
                        alert("Please fill in the bot outputs field.");
                        return false;
                    }
                }
            } else {
                if (!exchange[field] || exchange[field].toString().trim() === "") {
                    alert(`Please fill in the ${field} field.`);
                    return false;
                }
            }
        }

        if (isNaN(parseFloat(exchange.confidence))) {
            alert("Confidence must be a number.");
            return false;
        }

        return true;
    };

    const clearCreateFields = (exchange) => {
        Object.assign(exchange, {
            sender_id: "",
            message_id: "",
            user_input: "",
            bot_outputs: "",
            intent: "",
            confidence: "",
            timestamp: new Date().toISOString(),
            feedback: ""
        });
    };

    return {
        enterEditMode,
        cancelEditMode,
        validateExchangeFields,
        clearCreateFields
    }
};