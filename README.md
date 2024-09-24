# one-documentation

## Overview

One Documentation is a Retrieval-Augmented Generation (RAG) chatbot designed to enhance developers' access to project documentation. By enabling natural language queries, the chatbot provides instant, relevant information from multiple documents in the project wiki, making it easier for developers to find the answers they need, improve productivity, and streamline onboarding.

## Key Features

- Instant retrieval of documentation through natural language queries.
- Combines information from multiple sources to provide accurate and contextually relevant answers.
- Reduces time spent searching through traditional documentation.
- Enhances onboarding by giving new developers easy access to key resources.
- Scalable to support growing development teams.

## Installation

1. Clone the repository:

```sh
git clone https://github.com/eddylau328/one-documentation.git
```

2. Navigate to the project directory:

```sh
cd one-documentation
```

3. Install the required dependencies:

```
yarn
```

4. Configure your environment (e.g., add API keys, database connections) by editing the .env file:

```
cp .env.example .env
```

5. Start the project:

```
yarn local:bot-service
```

## Usage

```bash
Enter your repo url: https://github.com/eddylau328/smart-garden-mini.git
Enter your repo data source url (github wiki url): https://github.com/eddylau328/smart-garden-mini.wiki.git

Type your question: (If no other question, type "end")
What is the project about in short?

The project is called Smart Garden Mini, and it is an automated plant care system designed to maintain home plants with minimal effort. The primary focus is on developing a smart, self-watering system that utilizes real-time soil moisture data to ensure plants receive the appropriate amount of water.
```

## Requirements

- Node.js (version 20.17.0 or higher)
- npm (version 10.8.2 or higher)

## License

This project is licensed under the MIT License - see the LICENSE file for details.
