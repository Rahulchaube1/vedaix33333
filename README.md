# Vedaix 🔍

[![GitHub](https://img.shields.io/badge/GitHub-Rahulchaube1%2Fvedaix33333-111827)](https://github.com/Rahulchaube1/vedaix33333)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Discord](https://dcbadge.limes.pink/api/server/26aArMy8tT?style=flat)](https://discord.gg/26aArMy8tT)

Vedaix is a **privacy-focused AI research workspace** that can run on your own infrastructure. It combines web search, file analysis, citations, chat history, and local or hosted language models in one focused interface.

![preview](.assets/vane-screenshot.png)

Vedaix keeps your provider credentials in its local configuration and supports web research, citations, files, chat history, Discover, and Library from one workspace.

## ✨ Features

🤖 **Support for all major AI providers** - Use local LLMs through Ollama or connect to OpenAI, Anthropic Claude, Google Gemini, Groq, and more. Mix and match models based on your needs.

⚡ **Smart search modes** - Choose Speed Mode when you need quick answers, Balanced Mode for everyday searches, or Quality Mode for deep research.

🧭 **Pick your sources** - Search the web, discussions, or academic papers. More sources and integrations are in progress.

🧩 **Widgets** - Helpful UI cards that show up when relevant, like weather, calculations, stock prices, and other quick lookups.

🔍 **Web search powered by SearxNG** - Access multiple search engines while keeping your identity private. Support for Tavily and Exa coming soon for even better results.

📷 **Image and video search** - Find visual content alongside text results. Search isn't limited to just articles anymore.

📄 **File uploads** - Upload documents and ask questions about them. PDFs, text files, and images are supported.

🌐 **Search specific domains** - Limit your search to specific websites when you know where to look. Perfect for technical documentation or research papers.

💡 **Smart suggestions** - Get intelligent search suggestions as you type, helping you formulate better queries.

📚 **Discover** - Browse interesting articles and trending content throughout the day. Stay informed without even searching.

🕒 **Search history** - Every search is saved locally so you can revisit your discoveries anytime. Your research is never lost.

✨ **Extensible providers** - Connect local and hosted models from Settings > Models.

## Sponsors

Vedaix is an open-source research workspace. Contributions and issue reports are welcome.

We'd like to thank the following partners for their generous support:

<table>
  <tr>
    <td width="100" align="center">
      <a href="https://dashboard.exa.ai" target="_blank">
        <img src=".assets/sponsers/exa.png" alt="Exa" width="80" height="80" style="border-radius: .75rem;" />
      </a>
    </td>
    <td>
      <a href="https://dashboard.exa.ai">Exa</a> • The Perfect Web Search API for LLMs - web search, crawling, deep research, and answer APIs
    </td>
  </tr>
</table>

## Installation

### Render and Google sign-in

The repository includes `render.yaml` for a Docker deployment with the bundled SearXNG service. Set `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` as Render environment variables, and add this Google OAuth redirect URI in Google Cloud:

```text
https://vedaix.com/api/auth/callback/google
```

Set `NEXT_PUBLIC_APP_URL` to the final public URL if the custom domain is different. Add `vedaix.com` as a custom domain in Render and point its DNS records to the values Render provides.

There are mainly 2 ways of installing Vedaix - with Docker or from source. Docker is recommended for a bundled SearxNG instance.

## Deploy on Render

This repository includes a `render.yaml` Blueprint. In Render, choose **New > Blueprint**, connect your GitHub repository, and deploy the blueprint. Set `SEARXNG_API_URL` to a reachable SearxNG instance with JSON output enabled. Render's persistent disk is mounted at `/opt/render/project/src/data` for SQLite data and uploads.

AI providers are configured after the first launch from **Settings > Models**. Add only the providers you have credentials for: OpenAI-compatible endpoints, Anthropic, Gemini, Groq, Ollama, LM Studio, Lemonade, or local Transformers models. Vedaix cannot activate paid providers without their own API keys.

### Getting Started with Docker (Recommended)

Vedaix can be run with Docker. Build the image from this repository:

```bash
docker build -t vedaix .
docker run -d -p 3000:3000 -v vedaix-data:/home/vane/data --name vedaix vedaix
```

This starts Vedaix with the bundled SearxNG search engine. Open http://localhost:3000 and configure your providers in the setup screen.

**Note**: The image includes both Vedaix and SearxNG. The volume keeps your SQLite data and uploads persistent.

#### Using Vedaix with Your Own SearxNG Instance

If you already have SearxNG running, set its URL when starting Vedaix:

```bash
docker run -d -p 3000:3000 -e SEARXNG_API_URL=http://your-searxng-url:8080 -v vedaix-data:/home/vane/data --name vedaix vedaix
```

**Important**: Make sure your SearxNG instance has:

- JSON format enabled in the settings
- Wolfram Alpha search engine enabled

Replace `http://your-searxng-url:8080` with your actual SearxNG URL. Then configure your AI provider settings in the setup screen at http://localhost:3000.

#### Advanced Setup (Building from Source)

If you prefer to build from source or need more control:

1. Ensure Docker is installed and running on your system.
2. Clone the Vedaix repository:

   ```bash
   git clone https://github.com/Rahulchaube1/vedaix33333.git
   ```

3. After cloning, navigate to the directory containing the project files.

4. Build and run using Docker:

   ```bash
   docker build -t vedaix .
   docker run -d -p 3000:3000 -v vedaix-data:/home/vane/data --name vedaix vedaix
   ```

5. Access Vedaix at http://localhost:3000 and configure your settings in the setup screen.

**Note**: After the container is built, you can start Vedaix directly from Docker.

### Non-Docker Installation

1. Install SearXNG and allow `JSON` format in the SearXNG settings. Make sure Wolfram Alpha search engine is also enabled.
2. Clone the repository:

   ```bash
   git clone https://github.com/Rahulchaube1/vedaix33333.git
   cd vedaix33333
   ```

3. Install dependencies:

   ```bash
   npm i
   ```

4. Build the application:

   ```bash
   npm run build
   ```

5. Start the application:

   ```bash
   npm run start
   ```

6. Open your browser and navigate to http://localhost:3000 to complete the setup and configure your settings (API keys, models, SearxNG URL, etc.) in the setup screen.

**Note**: Using Docker is recommended as it simplifies the setup process, especially for managing environment variables and dependencies.

See the installation section above for source, Docker, and Render deployment details.

### Troubleshooting

#### Local OpenAI-API-Compliant Servers

If Vedaix tells you that you haven't configured any chat model providers, ensure that:

1. Your server is running on `0.0.0.0` (not `127.0.0.1`) and on the same port you put in the API URL.
2. You have specified the correct model name loaded by your local LLM server.
3. You have specified the correct API key, or if one is not defined, you have put _something_ in the API key field and not left it empty.

#### Ollama Connection Errors

If you're encountering an Ollama connection error, it is likely due to the backend being unable to connect to Ollama's API. To fix this issue you can:

1. **Check your Ollama API URL:** Ensure that the API URL is correctly set in the settings menu.
2. **Update API URL Based on OS:**

   - **Windows:** Use `http://host.docker.internal:11434`
   - **Mac:** Use `http://host.docker.internal:11434`
   - **Linux:** Use `http://<private_ip_of_host>:11434`

   Adjust the port number if you're using a different one.

3. **Linux Users - Expose Ollama to Network:**

   - Inside `/etc/systemd/system/ollama.service`, you need to add `Environment="OLLAMA_HOST=0.0.0.0:11434"`. (Change the port number if you are using a different one.) Then reload the systemd manager configuration with `systemctl daemon-reload`, and restart Ollama by `systemctl restart ollama`. For more information see [Ollama docs](https://github.com/ollama/ollama/blob/main/docs/faq.md#setting-environment-variables-on-linux)

   - Ensure that the port (default is 11434) is not blocked by your firewall.

#### Lemonade Connection Errors

If you're encountering a Lemonade connection error, it is likely due to the backend being unable to connect to Lemonade's API. To fix this issue you can:

1. **Check your Lemonade API URL:** Ensure that the API URL is correctly set in the settings menu.
2. **Update API URL Based on OS:**

   - **Windows:** Use `http://host.docker.internal:8000`
   - **Mac:** Use `http://host.docker.internal:8000`
   - **Linux:** Use `http://<private_ip_of_host>:8000`

   Adjust the port number if you're using a different one.

3. **Ensure Lemonade Server is Running:**

   - Make sure your Lemonade server is running and accessible on the configured port (default is 8000).
   - Verify that Lemonade is configured to accept connections from all interfaces (`0.0.0.0`), not just localhost (`127.0.0.1`).
   - Ensure that the port (default is 8000) is not blocked by your firewall.

## Using as a Search Engine

If you wish to use Vedaix as an alternative to traditional search engines like Google or Bing, or if you want to add a shortcut for quick access from your browser's search bar, follow these steps:

1. Open your browser's settings.
2. Navigate to the 'Search Engines' section.
3. Add a new site search with the following URL: `http://localhost:3000/?q=%s`. Replace `localhost` with your IP address or domain name, and `3000` with the port number if Vedaix is not hosted locally.
4. Click the add button. Now, you can use Vedaix directly from your browser's search bar.

## Using Vedaix's API

Vedaix provides an API for developers looking to integrate its search engine into their own applications. You can run searches, use multiple models, and get answers to your queries.

See the API route implementations under `src/app/api` for the available endpoints.

## Expose Vedaix to network

Vedaix runs on Next.js and handles all API requests. Put it behind HTTPS and configure a reachable SearxNG instance before exposing it publicly.

## One-Click Deployment

[![Deploy to Sealos](https://raw.githubusercontent.com/labring-actions/templates/main/Deploy-on-Sealos.svg)](https://usw.sealos.io/?openapp=system-template%3FtemplateName%3Dperplexica)
[![Deploy to RepoCloud](https://d16t0pc4846x52.cloudfront.net/deploylobe.svg)](https://repocloud.io/details/?app_id=267)
[![Run on ClawCloud](https://raw.githubusercontent.com/ClawCloud/Run-Template/refs/heads/main/Run-on-ClawCloud.svg)](https://template.run.claw.cloud/?referralCode=U11MRQ8U9RM4&openapp=system-fastdeploy%3FtemplateName%3Dperplexica)

## Upcoming Features

- [ ] Adding more widgets, integrations, search sources
- [ ] Adding ability to create custom agents (name T.B.D.)
- [ ] Adding authentication

## Support Us

If you find Vedaix useful, consider contributing through the [GitHub repository](https://github.com/Rahulchaube1/vedaix33333).

### Donations

We also accept donations to help sustain our project. If you would like to contribute, you can use the following options to donate. Thank you for your support!

| Ethereum                                              |
| ----------------------------------------------------- |
| Address: `0xB025a84b2F269570Eb8D4b05DEdaA41D8525B6DD` |

## Contribution

Vedaix is built to make AI research tools easy to run and extend. If you find bugs or have ideas, open an issue or read [CONTRIBUTING.md](CONTRIBUTING.md).

## Help and Support

If you have any questions or feedback, please feel free to reach out to us. You can create an issue on GitHub or join our Discord server. There, you can connect with other users, share your experiences and reviews, and receive more personalized help. [Click here](https://discord.gg/EFwsmQDgAu) to join the Discord server. To discuss matters outside of regular support, feel free to contact me on Discord at `itzcrazykns`.

Thank you for exploring Vedaix, the AI-powered research workspace designed to make search more useful and transparent.
