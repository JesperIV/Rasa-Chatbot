<script setup>
    import { ref, onMounted, onBeforeUnmount } from 'vue';
    import { useChatboxUI } from '@/scripts/chat/chatbox';                  //  UI related js
    import { useChatCommunication } from '@/scripts/chat/communication';    //  communication related js
    import { parseMarkdown } from '@/scripts/chat/utils';                   //  for markdown support
    
    const messagesContainer = ref(null);    //  ref for message container
    const maxLength = 100;  //  maximum input length
    const charCount = () => userInput.value.length; //  for checking character count in input field

    const {
        showChat,
        chatbox,
        inputField,
        bottomMarker,
        isMobile,
        startResizing,
        resizeChatbox,
        stopResizing,
        toggleChat,
        handleClickOut,
        handleKeydown,
        scrollToBottom
    } = useChatboxUI();
    
    const {
        messages,
        userInput,
        cleanedUserInput,
        isLoading,
        minLength,
        sendMessage,
        sendFeedback
    } = useChatCommunication(bottomMarker);

    onMounted(() => {
        document.addEventListener('keydown', handleKeydown);    //  add event listener for keydown
        document.addEventListener('click', handleClickOut);
    });

    onBeforeUnmount(() => {
        document.removeEventListener('keydown', handleKeydown); //  remove event listener for keydown
        document.removeEventListener('click', handleClickOut);
    });

    const validateInput = () => {
        if (userInput.value.length > maxLength) {
            userInput.value = userInput.value.substring(0, maxLength);
        }
    }

    //  props for customizing style
    defineProps({
        chatTitle: { type: String, default: 'Chatbot' },
        primaryColor: { type: String, default: '#007bff' },
        secondaryColor: { type: String, default: '#0056b3' },
        backgroundColor: { type: String, default: '#FAF9F6' },
        secondaryBackgroundColor: { type: String, default: '#e7e7e7' },
        titleTextColor: { type: String, default: 'white' },
        userMessageBubbleColor: { type: String, default: 'lightblue' },
        botMessageBubbleColor: { type: String, default: 'lightgray' },
        primaryTextColor: { type: String, default: 'darkslategrey' },
        secondaryTextColor: { type: String, default: 'gray' }
    })
</script>

<template>
    <div class="container"
        :style="{   //  cant use props in :root so use this inline style
            '--primary-color': primaryColor,
            '--secondary-color': secondaryColor,
            '--background-color': backgroundColor,
            '--secondary-background-color': secondaryBackgroundColor,
            '--title-text-color': titleTextColor,
            '--user-message-color': userMessageBubbleColor,
            '--bot-message-color': botMessageBubbleColor,
            '--primary-text-color': primaryTextColor,
            '--secondary-text-color': secondaryTextColor
        }">

        <button @click="toggleChat" class="chat-toggle-btn">🗨️</button>

        <div class="chatbox" :class="{ 'show': showChat }" ref="chatbox">

            <div v-if="!isMobile()" class="chat-resize-handle" @mousedown="startResizing"></div>

            <div class="chat-title-bar">
                <span class="chat-title">{{ chatTitle }}</span>
                <button @click="showChat = false" class="close-chat-btn">X</button>
            </div>

            <div v-if="messages.length === 0" class="disclaimer">   <!-- div for disclaimer when no messages present -->
                <i class="disclaimer-text">Dit is een AI chatbot, dit is NIET een echt persoon.</i>
            </div>

            <div v-if="messages.length > 0" class="messages" ref="messagesContainer"> <!-- div for messages, ref for scrolling -->
                <div v-for="(msg, index) in messages" :key="index" :class="[msg.sender, { 'error': msg.error }]"> <!-- div for every message, class depending on the sender -->
                    
                    <p class="message-text">
                        <span v-html="parseMarkdown(msg.text)"></span>
                        <span class="message-time"> @{{ msg.time }}</span>
                    </p>

                    <div v-if="msg.sender === 'bot' && !msg.error && (index === messages.length - 1 || messages[index + 1]?.sender !== 'bot')" class="feedback-container"> <!-- Show feedback buttons if sender is bot and message is not an error -->
                        <i class="feedback-text">Deze reactie was: </i>
                        <button @click="sendFeedback(index, true)" class="feedback-btn" :class="{ 'selected-positive': msg.feedback === true }">👍</button>
                        <button @click="sendFeedback(index, false)" class="feedback-btn" :class="{ 'selected-negative': msg.feedback === false }">👎</button>
                    </div>
                </div>

                <div v-if="isLoading" class="loading-dots"> <!-- show loading message if loading -->
                     <span></span><span></span><span></span>    <!-- 3 spans for 3 loading dots -->
                </div>

                <div ref="bottomMarker"></div> <!-- ref for scrolling to bottom -->
            </div>

            <div class="input-container">
                <input ref="inputField" v-model="userInput" @input="validateInput" @keyup.enter="sendMessage" :maxlength="maxLength" placeholder="Stel een vraag..." class="chat-input-field" lang="nl">  <!-- Input field, match input to userInput and send when enter key is released -->
                <p v-if="charCount() < minLength && charCount() > 0" class="warning">Gebruik minimaal {{ minLength }} characters.</p>
                <p v-if="charCount() === maxLength" class="warning">U kunt maximaal {{ maxLength }} characters gebruiken.</p>
                <button :disabled="charCount() < minLength" @click="sendMessage" class="chat-input-send-btn">Verstuur</button> <!-- send button -->
            </div>
        </div>
    </div>
</template>

<style>
    @import '../assets/chat/chat_markdown.css';
    @import '../assets/chat/chat_messages.css';
    @import '../assets/chat/chat.css';
</style>