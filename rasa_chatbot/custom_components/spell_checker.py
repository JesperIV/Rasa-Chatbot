import yaml
from symspellpy import SymSpell, Verbosity
from rasa.engine.graph import GraphComponent, ExecutionContext
from rasa.engine.recipes.default_recipe import DefaultV1Recipe
from rasa.shared.nlu.training_data.training_data import TrainingData
from rasa.shared.nlu.training_data.message import Message
from rasa.engine.storage.storage import ModelStorage, Resource
from typing import Any, Optional, Dict, List
from collections import Counter
from dutch_words import get_ranked

@DefaultV1Recipe.register(DefaultV1Recipe.ComponentType.MESSAGE_FEATURIZER, is_trainable=False) #   Needed for Rasa to recognise this as a component
class SpellChecker(GraphComponent):
    """Custom component for spell checking Dutch input using SymSpell."""

    @classmethod
    def create(
        cls, 
        config: Dict[str, Any], 
        model_storage: ModelStorage,
        resource: Resource,
        execution_context: ExecutionContext,
        **kwargs: Any
    ) -> "SpellChecker":
        return cls(config, model_storage, resource, execution_context, **kwargs)

    def __init__(
        self, 
        config: Optional[Dict[str, Any]] = None,
        model_storage: Optional[ModelStorage] = None,
        resource: Optional[Resource] = None,
        execution_context: Optional[ExecutionContext] = None,
        **kwargs: Any
    ):
        super().__init__()
        self.sym_spell = SymSpell(max_dictionary_edit_distance=2, prefix_length=7)

        # Attribution: This word list is based on leukeleu/dutch-words (https://github.com/leukeleu/dutch-words),
        # which is based on University of Leipzig data. It may have been modified for use in this project.
        # Original dataset is licensed under CC BY 4.0.
        # License details: https://creativecommons.org/licenses/by/4.0/
        word_list = [word.lower() for word in get_ranked()]
        word_count = len(word_list)

        #   For every word in the list add a frequency to let SymSpell know which words are more common
        for index, word in enumerate(word_list, start=1):
            frequency = word_count - index
            self.sym_spell.create_dictionary_entry(word, frequency)

        print(f"Loaded {len(self.sym_spell.words)} words into SymSpell.")
        
        print("Loading NLU training data words...")
        self.load_nlu_words()   #   Run load_nlu_words

    #   Since the Leipzig University's word list does not contain all words we use for examples in nlu.yml
    #   this part goes trough that file and adds any wordt to the list that are not in there already.
    def load_nlu_words(self):
        """Loads words from the NLU training data in nlu.yml."""
        nlu_words_count = 0

        try:
            with open("data/nlu.yml", "r", encoding="utf-8") as nlu_file:
                nlu_data = yaml.safe_load(nlu_file) #   Use safe_load despite the file being trusted, just in case.
            
            if "nlu" in nlu_data:
                all_nlu_words = []

                for intent in nlu_data["nlu"]:  #   For every intent listed in nlu.yml it takes the words in examples.
                    if "examples" in intent:
                        examples = intent["examples"].split("\n")
                        for example in examples:
                            words = example.strip().split()
                            all_nlu_words.extend([word.lower() for word in words if word.isalpha()])

                word_counts = Counter(all_nlu_words)
                max_sympspell_frequency = max(self.sym_spell.words.values(), default=10000)
                base_freq = max_sympspell_frequency // 2.5

                for word, count in word_counts.items():
                    multiplier = min(count, 10)
                    frequency = base_freq * multiplier
                    existing_freq = self.sym_spell.words.get(word, 0)
                    if frequency > existing_freq:
                        self.sym_spell.create_dictionary_entry(word, frequency)
                        nlu_words_count += 1

            print(f"Loaded {nlu_words_count} words from NLU training data.")
        except Exception as e:
            print(f"Failed to load NLU training data: {e}")
        
        print(f"Continuing {self.__class__.__name__} initialization... This could take a while...") #   Not really necassary to use that dynamic class name, but its easier if another custom component is needed so we cna copy.

    def process(self, messages: List[Message]) -> List[Message]:
        """Corrects spelling mistakes word for word."""

        for message in messages:
            print("Inspecting message:", message.as_dict())

            if message and message.get("text"):
                user_input = message.get("text")
                print(f"Checking input: {user_input}")

                words = user_input.split()
                corrected_words = []

                for word in words:
                    suggestions = self.sym_spell.lookup(
                        word,
                        Verbosity.CLOSEST,
                        max_edit_distance=self.sym_spell._max_dictionary_edit_distance
                    )

                    print(f"Suggestions for '{word}': {[s.term for s in suggestions]}")

                    if suggestions:
                        corrected_words.append(suggestions[0].term)
                    else:
                        corrected_words.append(word)

                corrected_text = " ".join(corrected_words)
                print(f"Corrected text: {corrected_text}")
                message.set("text", corrected_text)

        return messages

    def process_training_data(self, training_data: TrainingData, **kwargs: Any) -> TrainingData:
        """Dummy method required for Rasa GraphComponents"""
        return training_data
