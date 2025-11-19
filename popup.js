// popup.js

document.addEventListener("DOMContentLoaded", () => {
    const providerSelect = document.getElementById("provider");
    const apiKeyLabel = document.getElementById("apiKeyLabel");
    const apiKeyInput = document.getElementById("apiKey");
    const modelInput = document.getElementById("model");
    const titleInput = document.getElementById("title");
    const scenarioInput = document.getElementById("scenario");
    const goalInput = document.getElementById("goal");
    const outputTextarea = document.getElementById("output");
    const statusEl = document.getElementById("status");
    const generateBtn = document.getElementById("generateBtn");
    const clearBtn = document.getElementById("clearBtn");
    const themeToggle = document.getElementById("themeToggle");
    const providerPill = document.getElementById("providerPill");

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

    function setPlaceholders(provider) {
        if (provider === "gemini") {
            apiKeyInput.placeholder = "Paste your Gemini API key";
            modelInput.placeholder = "e.g. gemini-2.5-flash-lite";
        } else if (provider === "openai") {
            apiKeyInput.placeholder = "Paste your OpenAI API key";
            modelInput.placeholder = "e.g. gpt-4o-mini";
        } else if (provider === "anthropic") {
            apiKeyInput.placeholder = "Paste your Anthropic API key";
            modelInput.placeholder = "e.g. claude-3-5-haiku-latest";
        } else {
            apiKeyInput.placeholder = "Paste your API key";
            modelInput.placeholder = "Model name";
        }
    }

    function loadForProvider(provider, store) {
        setApiKeyLabel(provider);
        setPlaceholders(provider);
        const keyKey = providerKeyKey(provider);
        const modelKey = providerModelKey(provider);
        apiKeyInput.value = store[keyKey] || "";
        modelInput.value = store[modelKey] || defaults[modelKey] || "";
    }

    chrome.storage.sync.get(null, (store) => {
        const provider = store.llmProvider || defaults.provider;
        providerSelect.value = provider;
        loadForProvider(provider, store);
        // Restore draft fields
        titleInput.value = store.draft_title || "";
        scenarioInput.value = store.draft_scenario || "";
        goalInput.value = store.draft_goal || "";
        outputTextarea.value = store.draft_output || "";
        applyTheme(store.theme || "dark");
        updateProviderPill(provider);
    });

    providerSelect.addEventListener("change", () => {
        const provider = providerSelect.value;
        chrome.storage.sync.set({ llmProvider: provider });
        chrome.storage.sync.get(null, (store) => loadForProvider(provider, store));
        updateProviderPill(provider);
    });

    apiKeyInput.addEventListener("change", () => {
        const provider = providerSelect.value;
        const keyKey = providerKeyKey(provider);
        const toSet = {};
        toSet[keyKey] = apiKeyInput.value || "";
        chrome.storage.sync.set(toSet);
    });

    modelInput.addEventListener("change", () => {
        const provider = providerSelect.value;
        const modelKey = providerModelKey(provider);
        const toSet = {};
        toSet[modelKey] = modelInput.value || "";
        chrome.storage.sync.set(toSet);
    });

    generateBtn.addEventListener("click", async () => {
        const provider = providerSelect.value;
        const apiKey = apiKeyInput.value.trim();
        const model = modelInput.value.trim() || defaults[providerModelKey(provider)] || "";
        const title = titleInput.value.trim();
        const scenario = scenarioInput.value.trim();
        const goal = goalInput.value.trim();

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
        if (!title || !scenario || !goal) {
            statusEl.textContent = "Please fill in Title, Scenario, and Goal.";
            return;
        }

        const metaPrompt = buildPromptEngineerInstruction(title, scenario, goal);

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
        outputTextarea.value = "";
        statusEl.textContent = "Draft cleared.";
        chrome.storage.sync.remove(["draft_title", "draft_scenario", "draft_goal", "draft_output"], () => {});
    });

    themeToggle.addEventListener("click", () => {
        const current = document.body.classList.contains("light") ? "light" : "dark";
        const next = current === "light" ? "dark" : "light";
        applyTheme(next);
        chrome.storage.sync.set({ theme: next });
    });

    function updateProviderPill(provider) {
        providerPill.textContent = provider;
    }

    function applyTheme(mode) {
        if (mode === "light") {
            document.body.classList.add("light");
        } else {
            document.body.classList.remove("light");
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
            draft_output: outputTextarea.value
        });
    }

    [titleInput, scenarioInput, goalInput].forEach(el => {
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
