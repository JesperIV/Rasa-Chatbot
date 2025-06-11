<script setup> 
    import Chatbot from './components/Chatbot.vue';         //  import Chatbot component
    import AdminPanel from './components/AdminPanel.vue';   //  import AdminPanel component
</script>

<template>
    <AdminPanel class="desktop-only" />
    <Chatbot />

    <!-- Chatbot has default styling but can be overwritten like this: -->
    <!-- <Chatbot 
        chatTitle="Dark Chatbot"
        primaryColor="#1DB954"
        secondaryColor="#243524"
        backgroundColor="#181818"
        secondaryBackgroundColor="#242424"
        titleTextColor="white"
        userMessageBubbleColor="#3A3A3A"
        botMessageBubbleColor="#292929"
        primaryTextColor="#E0E0E0"
        secondaryTextColor="#B3B3B3"
    /> -->
</template>

<style>
    .desktop-only {
        display: none;
    }

    @media (min-width: 1024px) {
        .desktop-only {
            display: block;
        }
    }
</style>