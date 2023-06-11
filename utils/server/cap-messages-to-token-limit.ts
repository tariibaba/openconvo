import { Message } from '@/types/chat';

import tiktokenModel from '@dqbd/tiktoken/encoders/cl100k_base.json';
import { Tiktoken } from '@dqbd/tiktoken/lite';

export async function capMessagesToTokenLimit(options: {
  messages: Message[];
  totalTokenLimit: number;
  startOffset: number;
  responseTokenLimit: number;
}) {
  const { messages, totalTokenLimit: tokenLimit, responseTokenLimit, startOffset } = options;
  const encoding = new Tiktoken(
    tiktokenModel.bpe_ranks,
    tiktokenModel.special_tokens,
    tiktokenModel.pat_str,
  );
  const messagesToSend: Message[] = [];
  let tokenCount = startOffset;
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    const tokens = encoding.encode(message.content);

    if (tokenCount + tokens.length + responseTokenLimit > tokenLimit) {
      break;
    }
    tokenCount += tokens.length;
    messagesToSend.unshift(message);
  }
  encoding.free();
  return messagesToSend;
}
