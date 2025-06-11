<script setup>
    import { ref, onMounted} from 'vue';
    import { useAdminCommunication } from '@/scripts/admin_panel/communication';
    import { useAdminPanelUI } from '@/scripts/admin_panel/admin_panel';
    import { useNluPanel } from '@/scripts/admin_panel/nlu';
    import { getConfidenceFlag, formatTimestamp as formatTimestampImport } from '@/scripts/admin_panel/utils';

    const {
        enterEditMode,
        cancelEditMode,
        validateExchangeFields,
        clearCreateFields
    } = useAdminPanelUI();

    const {
        exchanges,
        newExchange,
        filters,
        loadExchanges,
        createExchange,
        updateExchange,
        deleteExchange,
    } = useAdminCommunication(validateExchangeFields, clearCreateFields);

    const {
        nluExamples,
        knownIntents,
        minConfidence,
        onlyPositive,
        includeNegative,
        fileLoaded,
        newEntriesByIntent,
        nluFile,
        logGroupByIntent: logGroupByIntentImport,
        onNluFile,
        downloadUpdatedNluFile
    } = useNluPanel();
    
    const selectedTimezone = ref("Europe/Amsterdam");                                                   //  the selected timezone, standard is Europe/Amsterdam
    const timezones = ref(["UTC", "Europe/Amsterdam", "America/New_York", "Asia/Tokyo", "Etc/GMT"]);    //  list of timezones, more can be added as long as they are supported by Intl.DateTimeFormat

    onMounted(() => {
        loadExchanges();   //  get stored data on startup
    });

    const logGroupByIntent = () => {
        logGroupByIntentImport(exchanges.value);
    }

    const formatTimestamp = (timestamp) => {
        return formatTimestampImport(timestamp, selectedTimezone.value);
    }
</script>

<template>
    <div class="admin-panel">
        <h1>Admin Panel</h1>

        <button class="btn tab read" @click="loadExchanges">Press to Read Using:</button>

        <div class="filters">
            <input v-model="filters.intent" placeholder="Any Intent" />
            <input v-model="filters.sender_id" placeholder="Any Sender ID" />

            <select v-model="filters.confidence_flag">
                <option value="">Any Confidence Flag</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
            </select>

            <select v-model="filters.feedback">
                <option value="">Any Feedback</option>
                <option value="Positive">Positive</option>
                <option value="Negative">Negative</option>
            </select>

            <select v-model="filters.sort_by">
                <option value="timestamp">Sort by Timestamp</option>
                <option value="confidence">Sort by Confidence</option>
            </select>

            <select v-model="filters.sort_order">
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
            </select>

            <select v-model="selectedTimezone">
                <option v-for="timezone in timezones" :key="timezone" :value="timezone">{{ timezone }}</option>     <!-- list every timezone in timezones list -->
            </select>
        </div>

        <div class="table-container">
            <table class="exchange-table">
                <thead>
                    <tr>
                        <!-- Column titles -->
                        <th>User Input</th>
                        <th>Bot Outputs</th>
                        <th>Detected Intent</th>
                        <th>Confidence</th>
                        <th>Confidence Flag</th>
                        <th>Feedback</th>
                        <th>Sender ID</th>
                        <th>Timestamp</th>
                        <th>Exchange ID</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- form to create a new exchange -->
                    <tr>
                        <td><input v-model="newExchange.user_input" placeholder="User Input" /></td>
                        <td><input v-model="newExchange.bot_outputs" placeholder="Output1 | Output2 | Output3" /></td>
                        <td><input v-model="newExchange.intent" placeholder="Intent" class="small-field" /></td>
                        <td><input class="small-field" v-model="newExchange.confidence" placeholder="Confidence" type="number" max="1" min="0" step="0.01" /></td>
                        <td>
                            <span class="badge" :class="getConfidenceFlag(newExchange.confidence)">
                                {{ getConfidenceFlag(newExchange.confidence) }}
    
                            </span>
                        </td>
                        <td>
                            <select v-model="newExchange.feedback">
                                <option value="">None</option>
                                <option value="Positive">Positive</option>
                                <option value="Negative">Negative</option>
                            </select>
                        </td>
                        <td><input v-model="newExchange.sender_id" placeholder="Sender ID" class="small-field" /></td>
                        <td><i>A timestamp will be generated automatically.</i></td>
                        <td><i>An exchange ID will be generated automatically.</i></td>
                        <td><button class="btn read" @click="createExchange">Create</button></td>   <!-- reuses the read style -->
                    </tr>
    
                    <!-- for every stored exchange add a row -->
                    <!-- v-if and else for editing -->
                    <tr v-for="exchange in exchanges" :key="exchange.message_id">
                        <td v-if="exchange.editing"><input v-model="exchange.user_input" placeholder="{{ exchange.user_input }}" /></td>
                        <td v-else class="user_input-row">"{{ exchange.user_input }}"</td>
                        <td v-if="exchange.editing"><input v-model="exchange.bot_outputs" /></td>
                        <td v-else>
                            <div>
                                <!-- allow the user to hide the output text since its way to big sometimes -->
                                <button @click="exchange.collapsed = !exchange.collapsed">
                                    {{ exchange.collapsed ? '▶ Expand' : '▼ Collapse' }}
                                </button>
                                <div v-show="!exchange.collapsed">
                                    <p v-for="bot in exchange.bot_outputs" :key="bot">
                                        "{{ bot }}"
                                    </p>
                                </div>
                            </div>
                        </td>
                        <td v-if="exchange.editing"><input v-model="exchange.intent" class="small-field" /></td>
                        <td v-else>{{ exchange.intent }}</td>
                        <td v-if="exchange.editing"><input class="small-field" v-model="exchange.confidence" type="number" max="1" min="0" step="0.01" /></td>
                        <td v-else>{{ exchange.confidence }}</td>
                        <td>
                            <span :class="['badge', getConfidenceFlag(exchange.confidence)]">{{ getConfidenceFlag(exchange.confidence) }}</span>
                        </td>
                        <td v-if="exchange.editing">
                            <select v-model="exchange.feedback">
                                <option value="">None</option>
                                <option value="Positive">Positive</option>
                                <option value="Negative">Negative</option>
                            </select>
                        </td>
                        <td v-else>
                            <span :class="['feedback', exchange.feedback]">
                                {{ exchange.feedback ? exchange.feedback : "None" }}
                            </span>
                        </td>
                        <td v-if="exchange.editing"><input v-model="exchange.sender_id" class="small-field" /></td>
                        <td v-else>{{ exchange.sender_id }}</td>
                        <td>{{ formatTimestamp(exchange.timestamp) }}</td>
                        <td>{{ exchange.message_id }}</td>
                        <td>
                            <div v-if="exchange.editing">
                              <button class="btn save" @click="updateExchange(exchange)">Save</button>
                              <button class="btn delete" @click="cancelEditMode(exchange)">Cancel</button>  <!-- reuses the delete style -->
                            </div>
                            <div v-else>
                              <button class="btn edit" @click="enterEditMode(exchange)">Update</button>
                              <button class="btn delete" @click="deleteExchange(exchange.message_id)">Delete</button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>

            <div class="nlu-panel">
                <h2>Select nlu.yml file</h2>
                <input type="file" accept=".yml,.yaml" @change="onNluFile" />
                <br>
                <h3>NLU update options:</h3>
                <label class="slider-label">
                    Minimum confidence: {{ minConfidence }}
                    <input type="range" min="0" max="1" step="0.01" v-model="minConfidence" />
                </label>
                <label>
                    <input type="checkbox" v-model="onlyPositive" />
                    Only positive feedback
                </label>
                <label>
                    <input type="checkbox" v-model="includeNegative" :disabled="onlyPositive" />
                    Include negative feedback
                </label>

                <button class="btn scan" @click="logGroupByIntent" :disabled="!fileLoaded">Scan & compare NLU file</button>
                <hr>

                <div v-if="Object.keys(newEntriesByIntent).length" class="new-entries-list">
                    <button class="btn scan" @click="downloadUpdatedNluFile">Download updated NLU file</button>
                    <h3>New intent examples:</h3>
                    <div v-for="(examples, intent) in newEntriesByIntent" :key="intent" class="new-entry">
                        <b 
                            :class="['intent-name', { 'unknown-intent' : !knownIntents.has(intent) }]" 
                            :title="!knownIntents.has(intent) ? 'Intent is not present in NLU file, if added make sure to write new response in domain.yml & add a story or rule in stories.yml or rules.yml' : ''">
                            {{ intent }} ({{ examples.length }}):
                        </b>
                        <ul>
                            <li v-for="example in examples" :key="example.text" class="example-item">
                                <input type="checkbox" v-model="example.selected">
                                {{ example.text }}
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
    @import '../assets/admin_panel/admin_panel_buttons.css';
    @import '../assets/admin_panel/nlu_panel.css';
    @import '../assets/admin_panel/admin_panel.css';
</style>