# Rasa Open Source Chatbot

## Overview
This project contains a chatbot component for Vue.js using Rasa Open Source to understand and respond to messages, and a PostgreSQL database to store exchange summaries for review and feedback. The project uses a **multi-container setup in Docker Desktop** with separate containers for:
- Rasa server
- Custom action server
- Vue frontend
- Admin API
- User API
- PostgreSQL database

## Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js](https://nodejs.org/en)
- [Python](https://www.python.org/downloads/release/python-3100/) (Python 3.10 is used, but 3.7–3.10 are supported)

---

## Improving the model
To improve the current model open the admin panel and select the latest `nlu.yml` file. Select your settings and confidence threshold then press the `Scan & compare NLU file` button, this will generate a list of unknown intent examples that have been used in previous conversations.

In this list there may be intent names in red, this means the intent is not yet in the nlu.yml file meaning there is most likely not yet a story or rule for this intent, any example belonging to this intent will be disabled by default. If you wish to add them anyway, you can enable them by clicking the checkboxes next to them, however you should then alter either the `rules.yml` or `stories.yml` file to allow the bot to use it. You should also write an answer for the new intent in the `domain.yml` file.

Once you have selected all the intent examples that you want to add you can press the `Download updated NLU file` button. Replace the old `nlu.yml` file with the newly downloaded one and retrain the model.

## Writing Bot Answers

To add more answers to the chatbot, follow these steps:

### 1. Add an intent and training examples

File: `rasa_chatbot/data/nlu.yml`

```yaml
- intent: no_confirmation_email
  examples: |
    - ik heb mij aangemeld maar ontvang geen bevestigingsmail
    - ik krijg geen bevestigingsmail na aanmelding
    - ik ontvang geen bevestigingsmail na mijn aanmelding
    ...
```

Note that when writing NLU examples, 'Mijn Solo' should be written as 'mijnsolo', this is because otherwise the spellchecker component might consider it seperate unrelated words.

### 2. Add the intent to the domain

File: `rasa_chatbot/domain.yml`

```yaml
intents:
  - no_confirmation_email
```

### 3. Add a response

In the same `domain.yml`:

```yaml
responses:
  utter_no_confirmation_email:
    - text: "Controleer je spamfolder. Als je nog steeds geen bevestigingsmail ontvangt, neem dan contact op met onze klantenservice via info@solopartners.nl of bel 085 20 10 140."
```

### 4. Link the intent to the response

After a response has been written it needs to be added to either `rules.yml` or `stories.yml`. When the response is simple and should always happen the same way, regardless of context it should be added to `rules.yml`. If a response is more complex or you are not sure which it should be added to, add it to `stories.yml`.


Example for `rules.yml`:

```yaml
rules:
- rule: respond to no_confirmation_email
  steps:
    - intent: no_confirmation_email
    - action: utter_no_confirmation_email
```

### 5. Train a new model
Last a new model needs to be trained, if you are using Desktop Docker, you can rebuild the container and a new model should be trained and used automatically using
`docker-compose down -v` and after that `docker-compose up --build`. The proces should be finished once you see `root  - Rasa server is up and running.`. 
*This may take a few minutes.*

```
docker-compose down -v
docker-compose up --build
```

Once you see `Rasa server is up and running`, training is complete.

---

### Formatting and styling responses
The example above shows a response which will send a single message bubble. However it is a good idea to make longer responses easier to read by formatting them properly.

- **Line breaks (New line in the same bubble):** To start a sentence on the next line, instead of directly after the previous text, an empty line should seperate the sentences, like this:
```yaml
utter_seperate_lines:
    - text: "This is the first line.

            This is the second line.
```

- **Multiple message bubbles in one response:** To send more than one message bubble without having to use more than one reponse, two empty lines should be used, like this:
```yaml
utter_seperate_bubbles:
    - text: "This is the first text bubble.


            This is the second text bubble.
```

#### Markdown
Unlike regular Rasa respones, this project has (partial) Markdown support. Here is a list of supported features and syntax:
| Feature          | Syntax               | Support  | Notes  |
|-----------------|---------------------|----------|--------|
| **Bold**        | `**text**`          | Full     |        |
| *Italic*        | `*text*`            | Full     |        |
| [Hyperlinks]()  | `[text](linkadres)`  | Full     |        |
| `Inline Code` | `` `text` ``        | Full     |        |
| ```Code Block```  | `` ```text``` ``    | Partial  | No language support. |
| Blockquote   | `> text`            | Partial  | Anything sent after gets added as part of the blockquote. If a Blockquote, List, or Ordered List is used after this, everything after joins the last element. |
| Unordered List | `- text`         | Partial  | Anything sent after gets added as part of the list. If a Blockquote, List, or Ordered List is used after this, everything after joins the last element. |
| 1. Ordered List | `1. text`          | Partial  | Anything sent after gets added as part of the list. If a Blockquote, List, or Ordered List is used after this, everything after joins the last element. |
| Image       | `![text](adres)`      | Full     |        |
| Heading     | `# text`             | Full     | More `#` = Smaller text. |
| Divider     | `---`                | Full     |        |
| ~~Strikethrough~~ | `~~text~~`        | Full     |        |
| Tasks       | `- [x] text`         | Partial     | Only Inside `Lists` like the syntax shows. |
| Tables      | `\| Name \| Age \| City \|\n\|---\|---\|---\|\n\| John \| 25 \| New York \|` | Partial | Anything sent after gets added to the table unless a divider (`---`) is used at the end. Keep in mind the table needs to fit inside of the chat bubble, so it isn't recommended to use large tables.|

---

## Data

This project uses a PostgreSQL for its databases. There are two tables:
1. events:
The `events` table is used as Rasa's trackerstore, it's used as a sort of event log. It stores every event and action taken by Rasa.

2. message:
The `message` table is used to save the base information for a message: A `message_id` UUID to identify the message, a `sender_id` to identify the user, `user_input` to save the text sent by the user & finally `timestamp` to save when the message was sent.

3. response:
The `response` table is used to save response data it contains a `message_id` as a foreign key to refer to the corresponding input and `bot_output` to save the text response sent by the chatbot, this is in JSON to support multi-line responses.

4. intent:
The `intent` table is used to store the detected intent and its confidence. This too contains a `message_id` as a foreign key to refer to the corresponding input, it also contains `intent` which stores the name of the detected intent, finally it stores `confidence` which is a number between 1 & 0 to show how certain Rasa was that its the correct intent.

5. feedback:
The `feedback` table is not used for every message, but only for messages that have received feedback. It too stores the `message_id` of the message for which the response is receiving feedback, it also stores a boolean named `feedback` where true is positive feedback and false is negative feedback.

---

## `events`

This is the internal Rasa tracker event log. It stores every interaction and action Rasa takes.

| Column        | Contents      | Purpose |
| :------------ |---------------|---------|
| `id`          | Auto-incrementing ID | Unique identifier per event |
| `sender_id`   | User or session ID   | Tracks multi-user conversations |
| `type_name`   | Event type (`user`, `bot`, `action`, etc.) | Defines what happened |
| `timestamp`   | UNIX timestamp       | When the event occurred |
| `intent_name` | Rasa-classified intent (for user events) | What Rasa understood |
| `action_name` | Name of executed action (for bot/action events) | What Rasa did |
| `data`        | JSON payload with all event details | Full input/output/metadata |


---

## Troubleshooting

**UserWarning: constrain_similarities is set to 'False':** This is a known Rasa issue, currently there is no known solution, however this does not seem to have a (noticable) effect on results. 

**A new model is not being trained:** If a new model is not being trained on startup make sure that any `.sh` file in the `rasa_chatbot` folder has `LF` line endings, not `CRLF`. This may happen when fetching using GitHub Desktop on Windows.

**'rasa-server' container shuts down on startup:** This too could be caused by line endings, make sure that any `.sh` file in the `rasa_chatbot` folder has `LF` line endings, not `CRLF`. This may happen when fetching using GitHub Desktop on Windows.

---

## Attribution

This project incorporates a Dutch word list from the [leukeleu/dutch-words](https://github.com/leukeleu/dutch-words) GitHub repository, which is based on data from the University of Leipzig. 

The original work is licensed under the [Creative Commons Attribution 4.0 International (CC BY 4.0) License](https://creativecommons.org/licenses/by/4.0/). 

Modifications were made to format the data for integration with SymSpell.

---

This project uses [spaCy](https://spacy.io/), an open-source natural language processing library in the Rasa NLU pipeline, licensed under MIT.
