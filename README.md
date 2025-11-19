# Prompt Engineer Helper (Browser Extension)

Generate high-quality, structured prompts for any Large Language Model (LLM) based on a task description. This extension helps you craft precise meta-prompts without solving the task itself. It supports multiple providers (Gemini, OpenAI, Anthropic) and lets you switch models on the fly while preserving your draft.

## Features
- Multi-provider LLM support: Gemini, OpenAI (ChatGPT), Anthropic (Claude)
- Custom model input (e.g. `gemini-2.5-flash-lite`, `gpt-4o-mini`, `claude-3-5-haiku-latest`)
- Automatic draft persistence (Title, Scenario, Goal, Generated Prompt)
- Dark/Light theme toggle (persisted)
- Per-provider API key & model storage (keys kept local via `chrome.storage.sync`)
- Clean, modern UI with status feedback and clear/reset button
- Single meta-prompt generation that instructs another AI rather than solving the task

## How It Works
You provide:
1. Title – High-level task name
2. Scenario – Context or background
3. Goal / Requirements – What the AI must produce, constraints, style, format

The extension sends a meta-instruction to the selected LLM telling it to act as a prompt engineer. The returned text is a reusable prompt you can paste elsewhere.

## Supported Providers
| Provider   | Endpoint | Example Model | Notes |
|-----------|----------|---------------|-------|
| Gemini    | `generateContent` | `gemini-2.5-flash-lite` | Uses Google Generative Language API |
| OpenAI    | `chat/completions` | `gpt-4o-mini` | Standard Chat Completions format |
| Anthropic | `messages` | `claude-3-5-haiku-latest` | Requires `anthropic-version` header |

You can add more later (e.g. Mistral, Cohere) by extending the `callLLM` dispatch and adding a provider option.

## Installation (Chrome)
1. Clone or download this repository.
2. Open Chrome: `chrome://extensions/`
3. Enable Developer Mode (toggle in top-right).
4. Click "Load unpacked" and select the folder `prompt-engineer-extension`.
5. The extension icon will appear; open the popup to start.

## Usage
1. Select a provider (Gemini / OpenAI / Anthropic).
2. Paste your API key (stored locally – never hard-code keys into code before publishing).
3. Optionally adjust the model name.
4. Fill Title, Scenario, and Goal / Requirements.
5. Click "Generate Prompt".
6. Copy the generated prompt and paste it into any AI chat.
7. Use "Clear" to reset the draft if needed.

## Draft Persistence
All editable fields (except provider-specific key/model which have their own entries) are saved automatically after a short debounce:
- `draft_title`
- `draft_scenario`
- `draft_goal`
- `draft_output`

This prevents losing progress when the popup closes or re-opens.

## Storage Keys
| Key | Purpose |
|-----|---------|
| `llmProvider` | Current selected provider |
| `apiKey_gemini` / `apiKey_openai` / `apiKey_anthropic` | Provider-specific API keys |
| `model_gemini` / `model_openai` / `model_anthropic` | Last used model names |
| `draft_title`, `draft_scenario`, `draft_goal`, `draft_output` | Current work-in-progress fields |
| `theme` | UI theme (`dark` or `light`) |

## Security & Privacy
- API keys are stored via `chrome.storage.sync`. They are not transmitted anywhere except directly to the provider's API endpoint you invoke.
- Do not publish the extension with embedded API keys.
- Consider adding an optional "Lock Field" or encryption layer if you need increased local protection (not implemented by default).

## Extending Provider Support
1. Add an `<option>` in `popup.html` inside the provider `<select>`.
2. Update `popup.js`:
   - Add default model key in `defaults` if desired.
   - Extend `callLLM` dispatch with a new handler function (e.g. `callMistral`).
   - Match provider-specific request/response schema.
3. Add host permission in `manifest.json` under `host_permissions`.
4. (Optional) Add custom headers or parsing logic for the new provider.

## Development
- Files:
  - `manifest.json` – Chrome extension manifest (MV3)
  - `popup.html` – UI markup + embedded styling
  - `popup.js` – Logic for provider routing, autosave, theming, API calls
- No build step required (pure HTML/JS).
- Reload in `chrome://extensions` after changes (click the refresh icon on the extension card).

## Potential Enhancements
- Response streaming (for providers supporting it) with incremental display.
- Prompt template library (dropdown of reusable patterns).
- Toast notifications for errors/success.
- Export/share prompt history panel.
- Add optional max tokens / temperature controls per provider.

## Contributing
1. Fork the repo.
2. Create a feature branch: `git checkout -b feature/xyz`.
3. Commit changes: `git commit -m "Add xyz"`.
4. Push: `git push origin feature/xyz`.
5. Open a Pull Request describing the change.

Please keep UI consistent and avoid storing sensitive information beyond API keys.

## License
This project is licensed under the MIT License – see `LICENSE` file for details.

## Disclaimer
Use at your own risk. API usage may incur costs depending on the provider. Ensure you monitor usage and follow each provider's terms of service.

## Acknowledgments
Thanks to the open ecosystems of Gemini, OpenAI, and Anthropic for enabling flexible prompt engineering workflows.
