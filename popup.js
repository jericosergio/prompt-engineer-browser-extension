// popup.js

document.addEventListener("DOMContentLoaded", () => {
    const providerSelect = document.getElementById("provider");
    const apiKeyLabel = document.getElementById("apiKeyLabel");
    const apiKeyInput = document.getElementById("apiKey");
    const modelSelect = document.getElementById("model");
    const titleInput = document.getElementById("title");
    const scenarioInput = document.getElementById("scenario");
    const goalInput = document.getElementById("goal");
    const outputTextarea = document.getElementById("output");
    const statusEl = document.getElementById("status");
    const generateBtn = document.getElementById("generateBtn");
    const clearBtn = document.getElementById("clearBtn");
    const themeToggle = document.getElementById("themeToggle");
    const providerPill = document.getElementById("providerPill");
    const keyHeader = document.getElementById("keyHeader");
    const keyBody = document.getElementById("keyBody");
    const keyToggleText = document.getElementById("keyToggleText");
    const toggleKeyVisibility = document.getElementById("toggleKeyVisibility");
    const copyKeyBtn = document.getElementById("copyKey");
    const copyPromptBtn = document.getElementById("copyPromptBtn");
    const zoomInBtn = document.getElementById("zoomIn");
    const zoomOutBtn = document.getElementById("zoomOut");
    const zoomLevelEl = document.getElementById("zoomLevel");
    const container = document.querySelector(".container");
    const manualModeBtn = document.getElementById("manualModeBtn");
    const autoModeBtn = document.getElementById("autoModeBtn");
    const manualSection = document.getElementById("manualSection");
    const autoSection = document.getElementById("autoSection");
    const autoDetailInput = document.getElementById("autoDetail");
    const apiKeyHelpEl = document.getElementById("apiKeyHelp");

    let currentZoom = 1.0;
    const baseWidth = 420;
    const baseHeight = 600;
    let currentMode = "manual"; // "manual" or "auto"

    const modelOptions = {
        gemini: [
            "gemini-2.0-flash-exp",
            "gemini-2.5-flash-lite",
            "gemini-1.5-flash",
            "gemini-1.5-flash-8b",
            "gemini-1.5-pro"
        ],
        openai: [
            "gpt-4o",
            "gpt-4o-mini",
            "gpt-4-turbo",
            "gpt-3.5-turbo"
        ],
        anthropic: [
            "claude-3-5-sonnet-latest",
            "claude-3-5-haiku-latest",
            "claude-3-opus-latest",
            "claude-3-haiku-20240307"
        ]
    };

    const defaults = {
        provider: "gemini",
        model_gemini: "gemini-2.5-flash-lite",
        model_openai: "gpt-4o-mini",
        model_anthropic: "claude-3-5-haiku-latest"
    };

    function providerKeyKey(provider) {
        return `apiKey_${provider}`;
    }
    function providerModelKey(provider) {
        return `model_${provider}`;
    }

    function setApiKeyLabel(provider) {
        if (provider === "gemini") apiKeyLabel.textContent = "Gemini API Key";
        else if (provider === "openai") apiKeyLabel.textContent = "OpenAI API Key";
        else if (provider === "anthropic") apiKeyLabel.textContent = "Anthropic API Key";
        else apiKeyLabel.textContent = "API Key";
    }

    function populateModels(provider) {
        const models = modelOptions[provider] || [];
        modelSelect.innerHTML = "";
        models.forEach(m => {
            const opt = document.createElement("option");
            opt.value = m;
            opt.textContent = m;
            modelSelect.appendChild(opt);
        });
    }

    function setPlaceholders(provider) {
        if (provider === "gemini") {
            apiKeyInput.placeholder = "Paste your Gemini API key";
        } else if (provider === "openai") {
            apiKeyInput.placeholder = "Paste your OpenAI API key";
        } else if (provider === "anthropic") {
            apiKeyInput.placeholder = "Paste your Anthropic API key";
        } else {
            apiKeyInput.placeholder = "Paste your API key";
        }
    }

    function updateApiKeyHelp(provider) {
        if (!apiKeyHelpEl) return;
        if (provider === "gemini") {
            apiKeyHelpEl.innerHTML = `<strong>Need a Gemini key?</strong><br>Get one at <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer">Google AI Studio</a>. Create a project → Generate API key.<br><em>Keep it secret; usage may incur costs.</em>`;
        } else if (provider === "openai") {
            apiKeyHelpEl.innerHTML = `<strong>Need an OpenAI key?</strong><br>Visit <a href="https://platform.openai.com/" target="_blank" rel="noopener noreferrer">platform.openai.com</a> → API Keys tab to create one.<br><em>Do not share; monitor token usage.</em>`;
        } else if (provider === "anthropic") {
            apiKeyHelpEl.innerHTML = `<strong>Need an Anthropic key?</strong><br>Go to <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer">console.anthropic.com</a> to generate a Claude API key.<br><em>Treat keys as credentials; costs vary by model.</em>`;
        } else {
            apiKeyHelpEl.innerHTML = `<strong>Need an API key?</strong><br>Select a provider above to see instructions.`;
        }
    }

    function loadForProvider(provider, store) {
        setApiKeyLabel(provider);
        populateModels(provider);
        setPlaceholders(provider);
        const keyKey = providerKeyKey(provider);
        const modelKey = providerModelKey(provider);
        apiKeyInput.value = store[keyKey] || "";
        const savedModel = store[modelKey] || defaults[modelKey] || "";
        modelSelect.value = savedModel;
        // If saved model not in dropdown, add it as custom option
        if (savedModel && !Array.from(modelSelect.options).find(o => o.value === savedModel)) {
            const opt = document.createElement("option");
            opt.value = savedModel;
            opt.textContent = savedModel + " (custom)";
            modelSelect.appendChild(opt);
            modelSelect.value = savedModel;
        }
    }

    chrome.storage.sync.get(null, (store) => {
        const provider = store.llmProvider || defaults.provider;
        providerSelect.value = provider;
        loadForProvider(provider, store);
        updateApiKeyHelp(provider);
        // Restore draft fields
        titleInput.value = store.draft_title || "";
        scenarioInput.value = store.draft_scenario || "";
        goalInput.value = store.draft_goal || "";
        autoDetailInput.value = store.draft_auto_detail || "";
        outputTextarea.value = store.draft_output || "";
        applyTheme(store.theme || "dark");
        updateProviderPill(provider);
        // Key section collapsed by default
        keyBody.classList.remove("open");
        keyToggleText.textContent = "▼ Show";
        // Restore zoom
        currentZoom = store.zoom || 1.0;
        applyZoom(currentZoom);
        // Restore mode
        currentMode = store.promptMode || "manual";
        applyMode(currentMode);
    });

    providerSelect.addEventListener("change", () => {
        const provider = providerSelect.value;
        chrome.storage.sync.set({ llmProvider: provider });
        chrome.storage.sync.get(null, (store) => loadForProvider(provider, store));
        updateProviderPill(provider);
        updateApiKeyHelp(provider);
    });

    apiKeyInput.addEventListener("change", () => {
        const provider = providerSelect.value;
        const keyKey = providerKeyKey(provider);
        const toSet = {};
        toSet[keyKey] = apiKeyInput.value || "";
        chrome.storage.sync.set(toSet);
    });

    modelSelect.addEventListener("change", () => {
        const provider = providerSelect.value;
        const modelKey = providerModelKey(provider);
        const toSet = {};
        toSet[modelKey] = modelSelect.value || "";
        chrome.storage.sync.set(toSet);
    });

    generateBtn.addEventListener("click", async () => {
        const provider = providerSelect.value;
        const apiKey = apiKeyInput.value.trim();
        const model = modelSelect.value.trim() || defaults[providerModelKey(provider)] || "";

        outputTextarea.value = "";
        statusEl.textContent = "";

        if (!apiKey) {
            statusEl.textContent = `Please enter your ${provider === "gemini" ? "Gemini" : provider === "openai" ? "OpenAI" : provider === "anthropic" ? "Anthropic" : ""} API key.`;
            return;
        }
        if (!model) {
            statusEl.textContent = "Please enter a model name.";
            return;
        }

        let metaPrompt;
        if (currentMode === "manual") {
            const title = titleInput.value.trim();
            const scenario = scenarioInput.value.trim();
            const goal = goalInput.value.trim();

            if (!title || !scenario || !goal) {
                statusEl.textContent = "Please fill in Title, Scenario, and Goal.";
                return;
            }
            metaPrompt = buildPromptEngineerInstruction(title, scenario, goal);
        } else {
            const autoDetail = autoDetailInput.value.trim();
            if (!autoDetail) {
                statusEl.textContent = "Please provide detailed description.";
                return;
            }
            metaPrompt = buildAutoPromptInstruction(autoDetail);
        }

        generateBtn.disabled = true;
        generateBtn.textContent = "Generating...";
        statusEl.textContent = `Calling ${providerSelect.options[providerSelect.selectedIndex].text}...`;

        try {
            const responseText = await callLLM(provider, apiKey, model, metaPrompt);
            outputTextarea.value = responseText || "[No text returned]";
            statusEl.textContent = "Done. You can copy the prompt above.";
            saveDraft();
        } catch (err) {
            console.error(err);
            statusEl.textContent = "Error: " + (err.message || "See console for details.");
        } finally {
            generateBtn.disabled = false;
            generateBtn.textContent = "Generate Prompt";
        }
    });

    clearBtn.addEventListener("click", () => {
        titleInput.value = "";
        scenarioInput.value = "";
        goalInput.value = "";
        autoDetailInput.value = "";
        outputTextarea.value = "";
        statusEl.textContent = "Draft cleared.";
        chrome.storage.sync.remove(["draft_title", "draft_scenario", "draft_goal", "draft_auto_detail", "draft_output"], () => {});
    });

    themeToggle.addEventListener("click", () => {
        const current = document.body.classList.contains("light") ? "light" : "dark";
        const next = current === "light" ? "dark" : "light";
        applyTheme(next);
        chrome.storage.sync.set({ theme: next });
    });

    keyHeader.addEventListener("click", () => {
        keyBody.classList.toggle("open");
        keyToggleText.textContent = keyBody.classList.contains("open") ? "▲ Hide" : "▼ Show";
    });

    toggleKeyVisibility.addEventListener("click", () => {
        if (apiKeyInput.type === "password") {
            apiKeyInput.type = "text";
            toggleKeyVisibility.textContent = "🙈 Hide";
        } else {
            apiKeyInput.type = "password";
            toggleKeyVisibility.textContent = "👁 Show";
        }
    });

    copyKeyBtn.addEventListener("click", () => {
        const key = apiKeyInput.value;
        if (!key) {
            statusEl.textContent = "No key to copy.";
            return;
        }
        navigator.clipboard.writeText(key).then(() => {
            statusEl.textContent = "API key copied to clipboard.";
        }).catch(err => {
            console.error(err);
            statusEl.textContent = "Copy failed.";
        });
    });

    copyPromptBtn.addEventListener("click", () => {
        const text = outputTextarea.value.trim();
        if (!text) {
            statusEl.textContent = "No prompt to copy.";
            return;
        }
        navigator.clipboard.writeText(text).then(() => {
            statusEl.textContent = "Prompt copied to clipboard.";
        }).catch(err => {
            console.error(err);
            statusEl.textContent = "Copy failed.";
        });
    });

    zoomInBtn.addEventListener("click", () => {
        currentZoom = Math.min(currentZoom + 0.1, 1.5);
        applyZoom(currentZoom);
        chrome.storage.sync.set({ zoom: currentZoom });
    });

    zoomOutBtn.addEventListener("click", () => {
        currentZoom = Math.max(currentZoom - 0.1, 0.7);
        applyZoom(currentZoom);
        chrome.storage.sync.set({ zoom: currentZoom });
    });

    manualModeBtn.addEventListener("click", () => {
        currentMode = "manual";
        applyMode(currentMode);
        chrome.storage.sync.set({ promptMode: currentMode });
    });

    autoModeBtn.addEventListener("click", () => {
        currentMode = "auto";
        applyMode(currentMode);
        chrome.storage.sync.set({ promptMode: currentMode });
    });

    function updateProviderPill(provider) {
        providerPill.textContent = provider;
    }

    function applyTheme(mode) {
        if (mode === "light") {
            document.body.classList.add("light");
            themeToggle.textContent = "☀️";
            themeToggle.title = "Switch to dark mode";
        } else {
            document.body.classList.remove("light");
            themeToggle.textContent = "🌙";
            themeToggle.title = "Switch to light mode";
        }
    }

    function applyZoom(zoom) {
        document.body.style.zoom = zoom;
        // Adjust body dimensions to accommodate zoom
        const adjustedWidth = Math.round(baseWidth / zoom);
        const adjustedHeight = Math.round(baseHeight / zoom);
        document.body.style.width = `${adjustedWidth}px`;
        document.body.style.height = `${adjustedHeight}px`;
        document.body.style.minWidth = `${adjustedWidth}px`;
        document.body.style.minHeight = `${adjustedHeight}px`;
        zoomLevelEl.textContent = `${Math.round(zoom * 100)}%`;
    }

    function applyMode(mode) {
        if (mode === "auto") {
            manualSection.classList.remove("active");
            autoSection.classList.add("active");
            manualModeBtn.classList.remove("active");
            autoModeBtn.classList.add("active");
        } else {
            manualSection.classList.add("active");
            autoSection.classList.remove("active");
            manualModeBtn.classList.add("active");
            autoModeBtn.classList.remove("active");
        }
    }

    // Draft autosave (debounced)
    let draftTimer = null;
    function queueDraftSave() {
        if (draftTimer) clearTimeout(draftTimer);
        draftTimer = setTimeout(saveDraft, 400); // 400ms debounce
    }
    function saveDraft() {
        chrome.storage.sync.set({
            draft_title: titleInput.value,
            draft_scenario: scenarioInput.value,
            draft_goal: goalInput.value,
            draft_auto_detail: autoDetailInput.value,
            draft_output: outputTextarea.value
        });
    }

    [titleInput, scenarioInput, goalInput, autoDetailInput].forEach(el => {
        el.addEventListener("input", queueDraftSave);
        el.addEventListener("blur", saveDraft);
    });
    // Output not editable, but if we ever change: listen as well
    outputTextarea.addEventListener("input", queueDraftSave);
});

/**
 * Build the meta-prompt that tells Gemini:
 * - You are a PROMPT ENGINEER
 * - Do NOT answer the task, only write instructions
 */
function buildPromptEngineerInstruction(title, scenario, goal) {
    return `
INSTRUCTION: You are the PROMPT ENGINEER. Your task is to write instructions for another AI model.

You must:
- NOT answer the assignment yourself.
- Only write the prompt that will be given to the AI.
- Clearly describe the task, constraints, style, and formatting.

TASK DESCRIPTION
Title: ${title}

Scenario:
${scenario}

Goal / Requirements:
${goal}

Now, write a single, self-contained prompt that a user can paste into an AI chat.
The prompt should:
- Explain the role of the AI.
- Restate the important details from the scenario and goal.
- Specify output format and word limits (if any).
- Emphasize that the AI must follow all constraints.

Do NOT include examples of the final answer. Do NOT solve the task yourself.
`.trim();
}

function buildAutoPromptInstruction(detailedDescription) {
    return `
INSTRUCTION: You are an expert PROMPT ENGINEER. Your task is to analyze the user's detailed description and create a high-quality, structured prompt for another AI model.

USER'S DETAILED DESCRIPTION:
${detailedDescription}

YOUR TASK:
1. Carefully analyze the description to identify:
   - The main objective/task
   - Target audience or context
   - Specific requirements, constraints, or format needs
   - Any style preferences or examples mentioned

2. Create a clear, professional prompt that:
   - Defines the AI's role (e.g., "You are an expert copywriter...")
   - Clearly states the task with all relevant details
   - Lists specific requirements, constraints, and format specifications
   - Includes output format, length, style guidelines
   - Emphasizes any must-follow constraints

3. Structure the prompt with:
   - Clear sections (Role, Task, Requirements, Format, Constraints)
   - Bullet points or numbered lists for clarity
   - Professional but direct language
   - No ambiguity or vague instructions

IMPORTANT:
- Do NOT solve the task yourself
- Do NOT include example outputs
- ONLY write the prompt that will be given to another AI
- Make it self-contained and ready to paste into any AI chat

Generate the optimized prompt now:
`.trim();
}

async function callLLM(provider, apiKey, model, userText) {
    if (provider === "gemini") return callGemini(apiKey, model, userText);
    if (provider === "openai") return callOpenAI(apiKey, model, userText);
    if (provider === "anthropic") return callAnthropic(apiKey, model, userText);
    throw new Error("Unsupported provider");
}

async function callGemini(apiKey, model, userText) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const body = {
        contents: [
            {
                role: "user",
                parts: [{ text: userText }]
            }
        ]
    };
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Gemini HTTP ${res.status}: ${errorText}`);
    }
    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];
    return parts.map((p) => p.text || "").join("");
}

async function callOpenAI(apiKey, model, userText) {
    const url = "https://api.openai.com/v1/chat/completions";
    const body = {
        model,
        messages: [{ role: "user", content: userText }],
        temperature: 0.2
    };
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`OpenAI HTTP ${res.status}: ${errorText}`);
    }
    const data = await res.json();
    return data?.choices?.[0]?.message?.content || "";
}

async function callAnthropic(apiKey, model, userText) {
    const url = "https://api.anthropic.com/v1/messages";
    const body = {
        model,
        max_tokens: 1024,
        messages: [{ role: "user", content: userText }]
    };
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Anthropic HTTP ${res.status}: ${errorText}`);
    }
    const data = await res.json();
    const contentArr = data?.content || [];
    const first = contentArr[0];
    if (!first) return "";
    return first.text || "";
}
