import { ChatOpenAI } from 'langchain/chat_models/openai'
import { BaseChatMemory, BaseChatMemoryInput, InputValues, MemoryVariables, getBufferString } from 'langchain/memory'

export interface OpenAITokenBufferMemoryInput extends BaseChatMemoryInput {
    llm: ChatOpenAI
    humanPrefix?: string
    aiPrefix?: string
    memoryKey?: string
    maxTokenLimit?: number
}

export class OpenAITokenBufferMemory extends BaseChatMemory implements OpenAITokenBufferMemoryInput {
    llm: ChatOpenAI

    humanPrefix = 'Human'

    aiPrefix = 'AI'

    memoryKey = 'history'

    maxTokenLimit = 12000

    constructor(fields: OpenAITokenBufferMemoryInput) {
        super({
            returnMessages: fields.returnMessages ?? false,
            chatHistory: fields.chatHistory,
            inputKey: fields.inputKey,
            outputKey: fields.outputKey
        })
        this.llm = fields.llm
        this.humanPrefix = fields.humanPrefix ?? this.humanPrefix
        this.aiPrefix = fields.aiPrefix ?? this.aiPrefix
        this.memoryKey = fields.memoryKey ?? this.memoryKey
        this.maxTokenLimit = fields.maxTokenLimit ?? this.maxTokenLimit
    }

    get memoryKeys() {
        return [this.memoryKey]
    }

    async loadMemoryVariables(_values: InputValues): Promise<MemoryVariables> {
        const messages = [...(await this.chatHistory.getMessages())]
        while ((await this.llm.getNumTokensFromMessages(messages)).totalCount > this.maxTokenLimit) {
            messages.shift()
        }

        if (this.returnMessages) {
            const result = {
                [this.memoryKey]: messages
            }
            return result
        } else {
            const result = {
                [this.memoryKey]: getBufferString(messages, this.humanPrefix, this.aiPrefix)
            }
            return result
        }
    }
}
