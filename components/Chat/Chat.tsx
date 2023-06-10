import { IconClearAll, IconSettings } from '@tabler/icons-react';
import {
  MutableRefObject,
  memo,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import toast from 'react-hot-toast';

import { useTranslation } from 'next-i18next';

import { getEndpoint } from '@/utils/app/api';
import {
  displayedLinkedMessages,
  saveConversation,
  saveConversations,
  updateConversation,
} from '@/utils/app/conversation';
import { throttle } from '@/utils/data/throttle';

import { ChatBody, Conversation, Message, Message_v2, Role } from '@/types/chat';
import { Plugin } from '@/types/plugin';

import HomeContext from '@/pages/api/home/home.context';

import Spinner from '../Spinner';
import { ChatInput } from './ChatInput';
import { ChatLoader } from './ChatLoader';
import { ErrorMessageDiv } from './ErrorMessageDiv';
import { MemoizedChatMessage } from './MemoizedChatMessage';
import { ModelSelect } from './ModelSelect';
import { SystemPrompt } from './SystemPrompt';
import { TemperatureSlider } from './Temperature';

import { v4 } from 'uuid';

interface Props {
  stopConversationRef: MutableRefObject<boolean>;
}

export const Chat = memo(({ stopConversationRef }: Props) => {
  const { t } = useTranslation('chat');

  const {
    state: {
      selectedConversation,
      conversations,
      models,
      apiKey,
      pluginKeys,
      serverSideApiKeyIsSet,
      messageIsStreaming,
      modelError,
      loading,
      prompts,
    },
    handleUpdateConversation,
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const [currentMessage, setCurrentMessage] = useState<Message>();
  const [autoScrollEnabled, setAutoScrollEnabled] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showScrollDownButton, setShowScrollDownButton] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const getLastChildId = () => {
    let lastChildChildId: string | undefined = selectedConversation?.messageHeadId;
    let currChildId: string | undefined = undefined;
    const allMessages = selectedConversation?.allMessages!;
    while (lastChildChildId) {
      let nextChild = allMessages[lastChildChildId!]!;
      while (!nextChild.active) {
        lastChildChildId = allMessages[lastChildChildId!].nextSiblingId;
        nextChild = allMessages[lastChildChildId!]!;
      }
      currChildId = lastChildChildId;
      lastChildChildId = allMessages![lastChildChildId!].childId;
    }
    return currChildId;
  };

  const addMessageToConversation = (params: {
    conversation: Conversation;
    message: Message;
    lastChildId?: string;
  }) => {
    const { conversation, message, lastChildId } = params;
    const newChildId = v4();
    const startFromHead = !lastChildId;
    const lastChild = lastChildId ? conversation.allMessages[lastChildId] : undefined;
    const messageHeadId = conversation.messageHeadId;
    let lastChildChildId = startFromHead ? messageHeadId : lastChild?.childId;
    const allMessages = conversation.allMessages;
    let lastChildChild = lastChildChildId ? conversation.allMessages[lastChildChildId] : undefined;
    let firstLastChildChildId = lastChildChildId;
    let pos = 1;
    let newSiblingCount = 1;
    let nextLastChildChild = lastChildChild;
    let nextLastChildChildId = lastChildChildId;
    while (nextLastChildChild) {
      lastChildChildId = nextLastChildChildId;
      lastChildChild = nextLastChildChild;
      lastChildChild.active = false;
      nextLastChildChildId = allMessages[lastChildChildId!].nextSiblingId;
      nextLastChildChild = allMessages[nextLastChildChildId!]!;
      pos++;
    }
    let prevSiblingId = undefined;
    if (lastChildChildId) {
      let firstLastChildChild = allMessages[firstLastChildChildId!];
      newSiblingCount = firstLastChildChild.siblingCount + 1;
      while (firstLastChildChild) {
        firstLastChildChild.siblingCount = newSiblingCount;
        firstLastChildChildId = allMessages[firstLastChildChildId!].nextSiblingId;
        firstLastChildChild = allMessages[firstLastChildChildId!]!;
      }
      const lastChildChild = conversation!.allMessages[lastChildChildId];
      lastChildChild.nextSiblingId = newChildId;
      prevSiblingId = lastChildChild.id;
    } else {
      if (startFromHead) {
        conversation!.messageHeadId = newChildId;
      } else {
        conversation!.allMessages[lastChildId!].childId = newChildId;
      }
    }
    return (conversation!.allMessages[newChildId] = {
      active: true,
      content: message.content,
      role: message.role,
      siblingCount: newSiblingCount,
      id: newChildId,
      parentId: lastChildId!,
      prevSiblingId,
    });
  };

  const handleSend = useCallback(
    async (
      message: Message,
      deleteCount = 0,
      plugin: Plugin | null = null,
      lastMessageId?: string,
    ) => {
      if (selectedConversation) {
        let updatedConversation: Conversation;
        let lastChildId: string | undefined;
        if (selectedConversation.messages?.length) {
          if (deleteCount) {
            const updatedMessages = [...selectedConversation.messages];
            for (let i = 0; i < deleteCount; i++) {
              updatedMessages.pop();
            }
            const lastMessage =
              updatedMessages.length > 0 ? updatedMessages[updatedMessages.length - 1] : undefined;
            updatedConversation = { ...selectedConversation };
            if (lastMessage?.role !== 'user') {
              updatedConversation = {
                ...selectedConversation,
                messages: [...updatedMessages, message, { content: '', role: 'assistant' }],
              };
            } else {
              updatedConversation = {
                ...updatedConversation,
                messages: [...updatedMessages, { content: '', role: 'assistant' }],
              };
            }
          } else {
            updatedConversation = {
              ...selectedConversation,
              messages: [
                ...selectedConversation.messages,
                message,
                { content: '', role: 'assistant' },
              ],
            };
          }
        } else {
          if (lastMessageId) {
            lastChildId = selectedConversation.allMessages[lastMessageId].parentId;
          } else {
            lastChildId = getLastChildId();
            if (deleteCount) {
              for (let i = 0; i < deleteCount; i++) {
                const allMessages = selectedConversation.allMessages!;
                const parentId = allMessages[lastChildId!].parentId!;
                const parent = allMessages[parentId];
                lastChildId = parent?.id;
              }
            }
          }
          const lastChild = selectedConversation.allMessages[lastChildId!];
          if (lastChild?.role !== 'user') {
            lastChildId = addMessageToConversation({
              conversation: selectedConversation,
              message,
              lastChildId,
            }).id;
          }
          lastChildId = addMessageToConversation({
            conversation: selectedConversation,
            message: { role: 'assistant', content: '' },
            lastChildId,
          }).id;

          updatedConversation = selectedConversation;
        }
        homeDispatch({
          field: 'selectedConversation',
          value: updatedConversation,
        });
        homeDispatch({ field: 'loading', value: true });
        homeDispatch({ field: 'messageIsStreaming', value: true });
        homeDispatch({ field: 'messageStreamingId', value: lastChildId });
        const chatBody: ChatBody = {
          model: updatedConversation.model,
          messages: updatedConversation!.messages.length
            ? updatedConversation!.messages
            : displayedLinkedMessages(updatedConversation!).map((message) => ({
                content: message.content,
                role: message.role,
              })),
          key: apiKey,
          prompt: updatedConversation.prompt,
          temperature: updatedConversation.temperature,
        };
        const endpoint = getEndpoint(plugin);
        let body;
        if (!plugin) {
          body = JSON.stringify(chatBody);
        } else {
          body = JSON.stringify({
            ...chatBody,
            googleAPIKey: pluginKeys
              .find((key) => key.pluginId === 'google-search')
              ?.requiredKeys.find((key) => key.key === 'GOOGLE_API_KEY')?.value,
            googleCSEId: pluginKeys
              .find((key) => key.pluginId === 'google-search')
              ?.requiredKeys.find((key) => key.key === 'GOOGLE_CSE_ID')?.value,
          });
        }
        const controller = new AbortController();
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          body,
        });
        if (!response.ok) {
          homeDispatch({ field: 'loading', value: false });
          homeDispatch({ field: 'messageIsStreaming', value: false });
          toast.error(response.statusText);
          return;
        }
        const data = response.body;
        if (!data) {
          homeDispatch({ field: 'loading', value: false });
          homeDispatch({ field: 'messageIsStreaming', value: false });
          return;
        }
        if (!plugin) {
          if (updatedConversation.messages.length === 1) {
            const { content } = message;
            const customName = content.length > 30 ? content.substring(0, 30) + '...' : content;
            updatedConversation = {
              ...updatedConversation,
              name: customName,
            };
          }
          homeDispatch({ field: 'loading', value: false });
          const reader = data.getReader();
          const decoder = new TextDecoder();
          let done = false;
          let isFirst = false;
          let text = '';
          while (!done) {
            if (stopConversationRef.current === true) {
              controller.abort();
              done = true;
              break;
            }
            const { value, done: doneReading } = await reader.read();
            done = doneReading;
            const chunkValue = decoder.decode(value);
            text += chunkValue;
            const isUsingPrevMessageSchema = Boolean(updatedConversation.messages?.length);

            if (isUsingPrevMessageSchema) {
              const updatedMessages: Message[] = updatedConversation.messages.map(
                (message, index) => {
                  if (index === updatedConversation.messages.length - 1) {
                    return {
                      ...message,
                      content: text,
                    };
                  }
                  return message;
                },
              );
              updatedConversation = {
                ...updatedConversation,
                messages: updatedMessages,
              };
            } else {
              const message = updatedConversation.allMessages[lastChildId!];
              message.content = text;
            }
            homeDispatch({
              field: 'selectedConversation',
              value: updatedConversation,
            });
          }
          saveConversation(updatedConversation);
          const updatedConversations: Conversation[] = conversations.map((conversation) => {
            if (conversation.id === selectedConversation.id) {
              return updatedConversation;
            }
            return conversation;
          });
          if (updatedConversations.length === 0) {
            updatedConversations.push(updatedConversation);
          }
          homeDispatch({ field: 'conversations', value: updatedConversations });
          saveConversations(updatedConversations);
          homeDispatch({ field: 'messageIsStreaming', value: false });
        } else {
          // do stuff here
          const { answer } = await response.json();
          const updatedMessages: Message[] = [
            ...updatedConversation.messages,
            { role: 'assistant', content: answer },
          ];
          updatedConversation = {
            ...updatedConversation,
            messages: updatedMessages,
          };
          homeDispatch({
            field: 'selectedConversation',
            value: updateConversation,
          });
          saveConversation(updatedConversation);
          const updatedConversations: Conversation[] = conversations.map((conversation) => {
            if (conversation.id === selectedConversation.id) {
              return updatedConversation;
            }
            return conversation;
          });
          if (updatedConversations.length === 0) {
            updatedConversations.push(updatedConversation);
          }
          homeDispatch({ field: 'conversations', value: updatedConversations });
          saveConversations(updatedConversations);
          homeDispatch({ field: 'loading', value: false });
          homeDispatch({ field: 'messageIsStreaming', value: false });
        }
      }
    },
    [apiKey, conversations, pluginKeys, selectedConversation, stopConversationRef],
  );

  const scrollToBottom = useCallback(() => {
    if (autoScrollEnabled) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      textareaRef.current?.focus();
    }
  }, [autoScrollEnabled]);

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const bottomTolerance = 30;

      if (scrollTop + clientHeight < scrollHeight - bottomTolerance) {
        setAutoScrollEnabled(false);
        setShowScrollDownButton(true);
      } else {
        setAutoScrollEnabled(true);
        setShowScrollDownButton(false);
      }
    }
  };

  const handleScrollDown = () => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  };

  const handleSettings = () => {
    setShowSettings(!showSettings);
  };

  const onClearAll = () => {
    if (
      confirm(t<string>('Are you sure you want to clear all messages?')) &&
      selectedConversation
    ) {
      handleUpdateConversation(selectedConversation, {
        key: 'messages',
        value: [],
      });
    }
  };

  const scrollDown = () => {
    if (autoScrollEnabled) {
      messagesEndRef.current?.scrollIntoView(true);
    }
  };
  const throttledScrollDown = throttle(scrollDown, 250);

  useEffect(() => {
    throttledScrollDown();
    const isUsingPrevMessageSchema = Boolean(selectedConversation?.messages.length);
    if (!selectedConversation) return;
    const messages = isUsingPrevMessageSchema
      ? selectedConversation.messages
      : displayedLinkedMessages(selectedConversation);
    setCurrentMessage(messages[messages.length - 2]);
  }, [selectedConversation]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setAutoScrollEnabled(entry.isIntersecting);
        if (entry.isIntersecting) {
          textareaRef.current?.focus();
        }
      },
      {
        root: null,
        threshold: 0.5,
      },
    );
    const messagesEndElement = messagesEndRef.current;
    if (messagesEndElement) {
      observer.observe(messagesEndElement);
    }
    return () => {
      if (messagesEndElement) {
        observer.unobserve(messagesEndElement);
      }
    };
  }, [messagesEndRef]);

  const messages = selectedConversation?.messages.length
    ? selectedConversation?.messages
    : displayedLinkedMessages(selectedConversation!);

  return (
    <div className="relative flex-1 overflow-hidden bg-white dark:bg-[#343541]">
      {!(apiKey || serverSideApiKeyIsSet) ? (
        <div className="mx-auto flex h-full w-[300px] flex-col justify-center space-y-6 sm:w-[600px]">
          <div className="text-center text-4xl font-bold text-black dark:text-white">
            Welcome to OpenConvo
          </div>
          <div className="text-center text-lg text-black dark:text-white">
            <div className="mb-8">{`OpenConvo is an open source clone of OpenAI's ChatGPT UI.`}</div>
            <div className="mb-2 font-bold">
              Important: OpenConvo is 100% unaffiliated with OpenAI.
            </div>
          </div>
          <div className="text-center text-gray-500 dark:text-gray-400">
            <div className="mb-2">
              OpenConvo allows you to plug in your API key to use this UI with their API.
            </div>
            <div className="mb-2">
              It is <span className="italic">only</span> used to communicate with their API.
            </div>
            <div className="mb-2">
              {t('Please set your OpenAI API key in the bottom left of the sidebar.')}
            </div>
            <div>
              {t("If you don't have an OpenAI API key, you can get one here: ")}
              <a
                href="https://platform.openai.com/account/api-keys"
                target="_blank"
                rel="noreferrer"
                className="text-blue-500 hover:underline"
              >
                openai.com
              </a>
            </div>
          </div>
        </div>
      ) : modelError ? (
        <ErrorMessageDiv error={modelError} />
      ) : (
        <>
          <div
            className="max-h-full overflow-x-hidden"
            ref={chatContainerRef}
            onScroll={handleScroll}
          >
            {messages.length === 0 ? (
              <>
                <div className="mx-auto flex flex-col space-y-5 md:space-y-10 px-3 pt-5 md:pt-12 sm:max-w-[600px]">
                  <div className="text-center text-3xl font-semibold text-gray-800 dark:text-gray-100">
                    {models.length === 0 ? (
                      <div>
                        <Spinner size="16px" className="mx-auto" />
                      </div>
                    ) : (
                      'OpenConvo'
                    )}
                  </div>

                  {models.length > 0 && (
                    <div className="flex h-full flex-col space-y-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-600">
                      <ModelSelect />

                      <SystemPrompt
                        conversation={selectedConversation!}
                        prompts={prompts}
                        onChangePrompt={(prompt) =>
                          handleUpdateConversation(selectedConversation!, {
                            key: 'prompt',
                            value: prompt,
                          })
                        }
                      />

                      <TemperatureSlider
                        label={t('Temperature')}
                        onChangeTemperature={(temperature) =>
                          handleUpdateConversation(selectedConversation!, {
                            key: 'temperature',
                            value: temperature,
                          })
                        }
                      />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="sticky top-0 z-10 flex justify-center border border-b-neutral-300 bg-neutral-100 py-2 text-sm text-neutral-500 dark:border-none dark:bg-[#444654] dark:text-neutral-200">
                  {t('Model')}: {selectedConversation?.model.name} | {t('Temp')}:{' '}
                  {selectedConversation?.temperature} |
                  <button className="ml-2 cursor-pointer hover:opacity-50" onClick={handleSettings}>
                    <IconSettings size={18} />
                  </button>
                  <button className="ml-2 cursor-pointer hover:opacity-50" onClick={onClearAll}>
                    <IconClearAll size={18} />
                  </button>
                </div>
                {showSettings && (
                  <div className="flex flex-col space-y-10 md:mx-auto md:max-w-xl md:gap-6 md:py-3 md:pt-6 lg:max-w-2xl lg:px-0 xl:max-w-3xl">
                    <div className="flex h-full flex-col space-y-4 border-b border-neutral-200 p-4 dark:border-neutral-600 md:rounded-lg md:border">
                      <ModelSelect />
                    </div>
                  </div>
                )}

                {messages.map((message, index) => (
                  <MemoizedChatMessage
                    key={(message as any).id ?? index}
                    message={message}
                    loading={
                      message.role === 'assistant' && loading && index === messages.length - 1
                    }
                    messageIndex={index}
                    onEdit={(editedMessage) => {
                      setCurrentMessage(editedMessage);
                      const latestMessages =
                        selectedConversation!.messages.length > 0
                          ? selectedConversation!.messages
                          : displayedLinkedMessages(selectedConversation!);
                      // discard edited message and the ones that come after then resend
                      handleSend(
                        editedMessage,
                        latestMessages.length - index,
                        undefined,
                        (message as any).id,
                      );
                    }}
                  />
                ))}

                <div className="h-[162px] bg-white dark:bg-[#343541]" ref={messagesEndRef} />
              </>
            )}
          </div>

          <ChatInput
            stopConversationRef={stopConversationRef}
            textareaRef={textareaRef}
            onSend={(message, plugin) => {
              setCurrentMessage(message);
              handleSend(message, 0, plugin);
            }}
            onScrollDownClick={handleScrollDown}
            onRegenerate={() => {
              if (currentMessage) {
                handleSend(currentMessage, 1, null);
              }
            }}
            showScrollDownButton={showScrollDownButton}
          />
        </>
      )}
    </div>
  );
});
Chat.displayName = 'Chat';
