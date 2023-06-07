import { Conversation, Role } from '@/types/chat';

export const updateConversation = (
  updatedConversation: Conversation,
  allConversations: Conversation[],
) => {
  const updatedConversations = allConversations.map((c) => {
    if (c.id === updatedConversation.id) {
      return updatedConversation;
    }

    return c;
  });

  saveConversation(updatedConversation);
  saveConversations(updatedConversations);

  return {
    single: updatedConversation,
    all: updatedConversations,
  };
};

export const saveConversation = (conversation: Conversation) => {
  localStorage.setItem('selectedConversation', JSON.stringify(conversation));
};

export const saveConversations = (conversations: Conversation[]) => {
  localStorage.setItem('conversationHistory', JSON.stringify(conversations));
};

export const displayedLinkedMessages = (conversation: Conversation) => {
  let nextChildId: string | undefined = conversation?.messageHeadId;
  const message = conversation?.allMessages[nextChildId!];
  let currChildId: string | undefined = undefined;
  const dispayedMessages: {
    id: string;
    role: Role;
    pos: number;
    content: string;
    siblingCount: number;
  }[] = [];
  const allMessages = conversation?.allMessages!;
  while (nextChildId) {
    let nextChild = allMessages[nextChildId!]!;
    let pos = 1;
    while (!nextChild.active) {
      nextChildId = allMessages[nextChildId!].nextSiblingId;
      nextChild = allMessages[nextChildId!]!;
      pos++;
    }
    currChildId = nextChildId;
    const currChild = allMessages[currChildId!];
    dispayedMessages.push({
      id: currChild.id,
      role: currChild.role,
      content: currChild.content,
      pos,
      siblingCount: currChild.siblingCount,
    });
    nextChildId = allMessages![nextChildId!].childId;
  }
  return dispayedMessages;
};
