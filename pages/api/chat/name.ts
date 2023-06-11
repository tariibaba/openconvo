import { NextApiRequest, NextApiResponse } from 'next';

import { OpenAIError } from '@/utils/server';
import { capMessagesToTokenLimit } from '@/utils/server/cap-messages-to-token-limit';

import { LLMChain, OpenAI, PromptTemplate } from 'langchain';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { messages, key } = req.body;
    const model = new OpenAI({
      temperature: 0,
      modelName: 'gpt-3.5-turbo',
      openAIApiKey: key,
    });

    const messagesToSend = await capMessagesToTokenLimit({
      messages,
      responseTokenLimit: 50,
      startOffset: 0,
      totalTokenLimit: model.maxTokens,
    });

    const prompt = new PromptTemplate({
      template:
        "Provide a suitable conversation topic less than 5 words for this conversation between a human user and an AI assistant, focus more on the user's message:\nConversation: {conversation}\n\nTopic:",
      inputVariables: ['conversation'],
    });
    const chain = new LLMChain({ llm: model, prompt });
    const conversationText = messagesToSend
      .filter((message) => message.role === 'user')
      .map((message) => `${message.role === 'user' ? 'User:' : 'Assistant:'}: ${message.content}`)
      .join('\n');
    const result = await chain.call({ conversation: conversationText });
    const topic = result.text.replace(/\.*$/g, '');
    res.status(200).json({ name: topic });
  } catch (error) {
    console.error(error);
    if (error instanceof OpenAIError) {
      res.status(500).send(`Error: ${error.message}`);
    } else {
      res.status(500).send(`Error: ${(error as Error).message})`);
    }
  }
}
