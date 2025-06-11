import { ref } from 'vue';
import yaml from 'js-yaml'; //  for nlu.yml file
import { normalize } from './utils';

export function useNluPanel() {
    const nluExamples = ref(new Set());
    const knownIntents = ref(new Set());    //  to store intents already present in nlu.yml
    const minConfidence = ref(0.7);         //  setting for updating nlu file
    const onlyPositive = ref(false);        //  setting for updating nlu file
    const includeNegative = ref(false);     //  setting for updating nlu file
    const fileLoaded = ref(false);          //  to check if nlu file is uploaded
    const newEntriesByIntent = ref({});     //  when updating nlu file, not recognized entries are stored here
    const nluFile = ref(null);

    const logGroupByIntent = (exchanges) => {
        const rowsToUse = exchanges.filter(row => {
            if (row.intent === "nlu_fallback") return false;    //  ignore fallback, its not trainable

            const conf = parseFloat(row.confidence);    //  get confidence value

            if (isNaN(conf) || conf < minConfidence.value) return false;

            if (onlyPositive.value) return row.feedback === "Positive";
            if (!includeNegative.value && row.feedback === "Negative") return false;

            return true;    //  keep this row
        });

        const groups = rowsToUse.reduce((acc, row) => {
            const key = row.intent || "Unknown";    //  get intent name, "Unknown" for fallback, but that shouldnt really happen
            (acc[key] ||= []).push(row);
            return acc;
        }, {});

        const updated = {};   //  reset

        Object.entries(groups).forEach(([intent, rows]) => {
            const newEntries = rows.filter(r => !nluExamples.value.has(normalize(r.user_input)));
            if (newEntries.length === 0) return;    //  skip if no new entries

            updated[intent] = newEntries.map(example => ({text: normalize(example.user_input), selected: knownIntents.value.has(intent)}));    //  store new entries
        })

        newEntriesByIntent.value = updated; //  store new entries in correct variable
    };

    const onNluFile = (e) => {

        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target.result;
                const doc = yaml.load(text);
                nluExamples.value.clear();
                fileLoaded.value = false;    //  reset

                if (!doc || !Array.isArray(doc.nlu)) {
                    console.warn("No intents detected in selected file.");
                    return;
                }

                doc.nlu.forEach(intObj => {
                    const block = intObj.examples || '';
                    block.split('\n').forEach(l => {
                      l = l.trim();
                      if (l.startsWith('-')) {
                        const cleaned = normalize(l.slice(1));
                        if (cleaned) nluExamples.value.add(cleaned);
                      }
                    })
                })

                nluFile.value = doc;
                knownIntents.value = new Set(Array.isArray(doc.nlu) ? doc.nlu.map(i => i.intent) : []);
                fileLoaded.value = true;
            } catch (error) {
                console.error("Failed to parse YAML file", error);
            }
        };
        reader.readAsText(file, "UTF-8");
    };

    const downloadUpdatedNluFile = () => {
        if (!fileLoaded.value) return;

        const updated = JSON.parse(JSON.stringify(nluFile.value || {}));    //  copy nlu file, empty object is here so ther is no error
        const intents = Array.isArray(updated.nlu) ? updated.nlu : [];      //  make sure nlu is an array
        const map = Object.fromEntries(intents.map(i => [i.intent, i]));    //  map intents by name in the file

        for (const [intent, examples] of Object.entries(newEntriesByIntent.value)) {  //  get every example for every intent
            const selectedExamples = examples.filter(e => e.selected);
            if (selectedExamples.length === 0) continue;
            
            let obj = map[intent];

            if (!obj) {
                obj = { intent, examples: "" };
                intents.push(obj);
                map[intent] = obj;
            }

            let exampleLines = [];

            if (typeof obj.examples === "string") {
                exampleLines = obj.examples.split("\n").map(line => line.trim());
            }

            const existingSet = new Set(exampleLines.filter(line => line.startsWith("-")).map(line => normalize(line.slice(2))))

            examples.forEach(({ text, selected }) => {
                if (!selected) return;

                const normalizedText = normalize(text);
                if (!existingSet.has(normalizedText)) {
                    exampleLines.push(`- ${text}`);
                    existingSet.add(normalizedText);
                }
            });

            obj.examples = exampleLines.join("\n").replace(/\n{2,}/g, "\n").replace(/\n*$/, "") + "\n";
        }

        updated.nlu = Object.values(map);

        try {
            let yamlText= yaml.dump(updated, { lineWidth: -1});

            //  correct whitelines, probably not important but use it anyway
            yamlText = yamlText.replace(/^(version[^\n]*\n)(nlu:)/m, '$1\n$2');
            yamlText = yamlText.replace(/\n(\s*- intent:)/g, '\n\n$1');
            yamlText = yamlText.replace(/nlu:\n\n(\s*- intent:)/, 'nlu:\n$1');

            const blob = new Blob([yamlText], { type: "text/yaml" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");  //  make it downloadable
            a.href = url;
            a.download = "nlu.yml";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to download updated NLU file", error);
        }
    };

    return {
        nluExamples,
        knownIntents,
        minConfidence,
        onlyPositive,
        includeNegative,
        fileLoaded,
        newEntriesByIntent,
        nluFile,
        logGroupByIntent,
        onNluFile,
        downloadUpdatedNluFile
    };
}