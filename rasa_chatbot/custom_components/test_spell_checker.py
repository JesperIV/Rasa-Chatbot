import sys
import os

sys.path.append(os.path.abspath("/app"))

from custom_components.spell_checker import SpellChecker
from rasa.shared.nlu.training_data.message import Message

spell_checker = SpellChecker.create({}, None, None, None)

test_messages = [
    "hallo, ik heb een rekenign nodig.",
    "ik hou van choclade.",
    "ik wil me aanmeden",
]

for text in test_messages:
    message = Message({"text": text})
    print("\nTest example #" + str(test_messages.index(text) + 1) + ":")
    spell_checker.process([message])
    print(f"Original: {text} -> Corrected: {message.get('text')}")
    print("-" * 50)

print("Spell checker test complete!\n")