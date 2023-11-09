import { ChatOpenAI } from 'langchain/chat_models/openai'
import { BaseChatMemory, BaseChatMemoryInput, InputValues, MemoryVariables, getBufferString, getInputValue } from 'langchain/memory'
import { HumanMessage } from 'langchain/schema'

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

    async loadMemoryVariables(inputValues: InputValues): Promise<MemoryVariables> {
        const messages = [...(await this.chatHistory.getMessages())]
        const messagesWithInput = [...messages, new HumanMessage(getInputValue(inputValues))]
        const counts = (await this.llm.getNumTokensFromMessages(messagesWithInput)).countPerMessage
        for (let i = 0; i < messages.length; i++) {
            const totalCount = counts.slice(i, counts.length).reduce((a, b) => a + b, 0)
            if (totalCount > this.maxTokenLimit) {
                messages.shift()
            } else {
                break
            }
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
