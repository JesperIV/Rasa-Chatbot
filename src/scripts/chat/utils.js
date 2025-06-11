import * as marked from 'marked';       //  for markdown
import emojiRegex from 'emoji-regex';   //  for cleaning text

export function cleanMessage(inputText) {
    //  trim whitespace
    inputText = inputText.trim();

    //  lowercase text
    inputText = inputText.toLowerCase();
        
    //  remove emojis
    inputText = inputText.replace(emojiRegex(), '');
        
    //  remove trailing characters
    inputText = inputText.replace(/[^a-zA-Z0-9\s]+$/g, '');
        
    //  remove leading characters
    inputText = inputText.replace(/^[^a-zA-Z0-9\s]+/g, '');

    //  replace '-' with space
    inputText = inputText.replace(/-/g, ' ');

    //  remove punctuation
    inputText = inputText.replace(/[.,\/#!$%\^&\*;:{}=\_`~()]/g, '');

    //  replace "mijn solo" with "mijnsolo"
    inputText = inputText.replace(/mijn solo/g, 'mijnsolo');

    return inputText;
};

export function parseMarkdown(inputText) {
    //  turn markdown into html
    //  gmf = github flavored markdown
    return marked.parse(inputText, { gfm: true });
};