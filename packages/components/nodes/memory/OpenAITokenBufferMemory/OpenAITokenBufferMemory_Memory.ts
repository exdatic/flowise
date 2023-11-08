import { ChatOpenAI } from 'langchain/chat_models/openai'
import { INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses } from '../../../src/utils'
import { OpenAITokenBufferMemory } from './OpenAITokenBufferMemory'

class OpenAITokenBufferMemory_Memory implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    baseClasses: string[]
    inputs: INodeParams[]

    constructor() {
        this.label = 'OpenAI Token Buffer Memory'
        this.name = 'openAITokenBufferMemory'
        this.version = 1.0
        this.type = 'OpenAITokenBufferMemory'
        this.icon = 'openai.png'
        this.category = 'Memory'
        this.description = 'Message pruning memory for OpenAI models'
        this.baseClasses = [this.type, ...getBaseClasses(OpenAITokenBufferMemory)]
        this.inputs = [
            {
                label: 'Chat Model',
                name: 'model',
                type: 'ChatOpenAI'
            },
            {
                label: 'Memory Key',
                name: 'memoryKey',
                type: 'string',
                default: 'chat_history'
            },
            {
                label: 'Input Key',
                name: 'inputKey',
                type: 'string',
                default: 'input'
            },
            {
                label: 'Max Token Limit',
                name: 'maxTokenLimit',
                type: 'number',
                default: '12000'
            }
        ]
    }

    async init(nodeData: INodeData): Promise<any> {
        const model = nodeData.inputs?.model as ChatOpenAI
        const memoryKey = nodeData.inputs?.memoryKey as string
        const inputKey = nodeData.inputs?.inputKey as string
        const maxTokenLimit = nodeData.inputs?.maxTokenLimit as number

        return new OpenAITokenBufferMemory({
            llm: model,
            returnMessages: true,
            memoryKey,
            inputKey,
            maxTokenLimit
        })
    }
}

module.exports = { nodeClass: OpenAITokenBufferMemory_Memory }
