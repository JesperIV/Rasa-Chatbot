import { ref, nextTick } from 'vue';

export function useChatboxUI() {
    const showChat = ref(false);            //  value to show or hide chat
    const chatbox = ref(null);              //  ref for chatbox
    const inputField = ref(null);           //  ref for input field
    const bottomMarker = ref(null);         //  a marker so auto scrolling is easier
    const isResizing = ref(false);          //  resizing state so the user can change chatbox height
    const startY = ref(0);
    const startHeight = ref(0);
    const minHeight = 200;                  //  minimum height for chatbox in pixels
    const maxHeight = window.innerHeight * 0.95;

    const isMobile = () => window.innerWidth <= 600;    //  if screen width is less than 600px consider it mobile

    const startResizing = (event) => {
        if (isMobile()) return; //  prevents resizing on mobile

        isResizing.value = true;
        startY.value = event.clientY;
        startHeight.value = chatbox.value.offsetHeight;

        document.addEventListener('mousemove', resizeChatbox);
        document.addEventListener('mouseup', stopResizing);
    };

    const resizeChatbox = (event) => {
        //  actual resize logic stuff
        if (!isResizing.value) return;

        const newHeight = startHeight.value + (startY.value - event.clientY);
        if (newHeight >= minHeight && newHeight <= maxHeight) {
            chatbox.value.style.height = `${newHeight}px`;
        };
    };

    const stopResizing = () => {
        //  remove listeners so resizing stops
        isResizing.value = false;
        document.removeEventListener('mousemove', resizeChatbox);
        document.removeEventListener('mouseup', stopResizing);
    };

    const toggleChat = async () => {
        showChat.value = !showChat.value;   //  toggle showChat
        
        if(showChat) {
            await nextTick();   //  wait for next tick
            if (!isMobile()) {
                inputField.value?.focus();  //  focus on input field, '?' to prevent error if inputField is null
            };
            document.querySelector('.chatbox').classList.add('show');    //  add show class to chatbox
        } else {
            document.querySelector('.chatbox').classList.remove('show'); //  remove show class from chatbox
        };
    };

    const handleClickOut = (event) => {
        if (isMobile() && showChat.value) {
            const chatbox = document.querySelector('.chatbox');
            if (chatbox && !chatbox.contains(event.target) && !event.target.classList.contains('chat-toggle-btn')) {
                showChat.value = false; //  close chat if clicked outside
            };
        };
    };

    const handleKeydown = (event) => {
        if (event.key === 'Escape') {
            showChat.value = false; //  close chat on escape key
        };
    };

    const scrollToBottom = () => {
        nextTick();

        if (bottomMarker.value) {
            bottomMarker.value.scrollIntoView({ behavior: 'smooth' });
        };
    };

    return {
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
    };
}