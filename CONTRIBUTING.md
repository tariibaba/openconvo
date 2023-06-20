# Contributing Guidelines

**Welcome to OpenConvo!**

We appreciate your interest in contributing to our project.

Before you get started, please read our guidelines for contributing.

## Types of Contributions

We welcome the following types of contributions:

- Bug fixes
- New features
- Documentation improvements
- Code optimizations
- Translations
- Tests

## Getting Started

To get started, fork the project on GitHub and clone it locally on your machine. Then, create a new branch to work on your changes.

```
git clone https://github.com/tariibaba/openconvo.git
cd chatbot-ui
git checkout -b my-branch-name

```

## Running Locally

**1. Clone Repo**

```bash
git clone https://github.com/tariibaba/openconvo.git
```

**2. Install Dependencies**

```bash
npm i
```

**3. Provide OpenAI API Key**

Create a .env.local file in the root of the repo with your OpenAI API Key:

```bash
OPENAI_API_KEY=YOUR_KEY
```

> You can set `OPENAI_API_HOST` where access to the official OpenAI host is restricted or unavailable, allowing users to configure an alternative host for their specific needs.

> Additionally, if you have multiple OpenAI Organizations, you can set `OPENAI_ORGANIZATION` to specify one.

**4. Run App**

```bash
npm run dev
```

**5. Use It**

You should be able to start chatting.

Before submitting your pull request, please make sure your changes pass our automated tests and adhere to our code style guidelines.

## Configuration

When deploying the application, the following environment variables can be set:

| Environment Variable              | Default value                  | Description                                                                                                                               |
| --------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| OPENAI_API_KEY                    |                                | The default API key used for authentication with OpenAI                                                                                   |
| OPENAI_API_HOST                   | `https://api.openai.com`       | The base url, for Azure use `https://<endpoint>.openai.azure.com`                                                                         |
| OPENAI_API_TYPE                   | `openai`                       | The API type, options are `openai` or `azure`                                                                                             |
| OPENAI_API_VERSION                | `2023-03-15-preview`           | Only applicable for Azure OpenAI                                                                                                          |
| AZURE_DEPLOYMENT_ID               |                                | Needed when Azure OpenAI, Ref [Azure OpenAI API](https://learn.microsoft.com/zh-cn/azure/cognitive-services/openai/reference#completions) |
| OPENAI_ORGANIZATION               |                                | Your OpenAI organization ID                                                                                                               |
| DEFAULT_MODEL                     | `gpt-3.5-turbo`                | The default model to use on new conversations, for Azure use `gpt-35-turbo`                                                               |
| NEXT_PUBLIC_DEFAULT_SYSTEM_PROMPT | [see here](utils/app/const.ts) | The default system prompt to use on new conversations                                                                                     |
| NEXT_PUBLIC_DEFAULT_TEMPERATURE   | 1                              | The default temperature to use on new conversations                                                                                       |
| GOOGLE_API_KEY                    |                                | See [Custom Search JSON API documentation][GCSE]                                                                                          |
| GOOGLE_CSE_ID                     |                                | See [Custom Search JSON API documentation][GCSE]                                                                                          |

If you do not provide an OpenAI API key with `OPENAI_API_KEY`, users will have to provide their own key.

If you don't have an OpenAI API key, you can get one [here](https://platform.openai.com/account/api-keys).

## Pull Request Process

1. Fork the project on GitHub.
2. Clone your forked repository locally on your machine.
3. Create a new branch from the main branch.
4. Make your changes on the new branch.
5. Ensure that your changes adhere to our code style guidelines and pass our automated tests.
6. Commit your changes and push them to your forked repository.
7. Submit a pull request to the main branch of the main repository.

## Contact

If you have any questions or need help getting started, feel free to reach out to me on [Twitter](https://twitter.com/Tari_Ibaba).
