import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'
import { AgentExecutor } from 'langchain/agents'
import { createConversationalRetrievalAgent } from 'langchain/agents/toolkits'
import { getBaseClasses } from '../../../src/utils'
import { flatten } from 'lodash'
import { ConsoleCallbackHandler, CustomChainHandler } from '../../../src/handler'

class ConversationalRetrievalAgentToolkit_Agents implements INode {
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
        this.label = 'Conversational Retrieval Agent Toolkit'
        this.name = 'conversationalRetrievalAgentToolkit'
        this.version = 1.0
        this.type = 'AgentExecutor'
        this.category = 'Agents'
        this.icon = 'agent.svg'
        this.description = `An agent optimized for retrieval during conversation, answering questions based on past dialogue, all using OpenAI's Function Calling`
        this.baseClasses = [this.type, ...getBaseClasses(AgentExecutor)]
        this.inputs = [
            {
                label: 'Allowed Tools',
                name: 'tools',
                type: 'Tool',
                list: true
            },
            {
                label: 'OpenAI Chat Model',
                name: 'model',
                type: 'ChatOpenAI'
            },
            {
                label: 'Remember Intermediate Steps',
                name: 'rememberIntermediateSteps',
                type: 'boolean',
                optional: true,
                default: true
            },
            {
                label: 'System Message',
                name: 'systemMessage',
                type: 'string',
                rows: 4,
                optional: true,
                additionalParams: true
            }
        ]
    }

    async init(nodeData: INodeData): Promise<any> {
        const model = nodeData.inputs?.model
        const systemMessage = nodeData.inputs?.systemMessage as string
        const rememberIntermediateSteps = nodeData.inputs?.rememberIntermediateSteps as boolean

        let tools = nodeData.inputs?.tools
        tools = flatten(tools)

        const executor = await createConversationalRetrievalAgent(model, tools, {
            verbose: process.env.DEBUG === 'true' ? true : false,
            prefix:
                systemMessage ??
                'Do your best to answer the questions. Feel free to use any tools available to look up relevant information, only if necessary. Always list markdown links contained in the corresponding answer of the tool.',
            rememberIntermediateSteps
        })
        return executor
    }

    async run(nodeData: INodeData, input: string, options: ICommonObject): Promise<string> {
        const executor = nodeData.instance as AgentExecutor

        const loggerHandler = new ConsoleCallbackHandler(options.logger)

        if (options.socketIO && options.socketIOClientId) {
            const handler = new CustomChainHandler(options.socketIO, options.socketIOClientId)
            const result = await executor.call({ input }, [loggerHandler, handler])
            return result?.output
        } else {
            const result = await executor.call({ input }, [loggerHandler])
            return result?.output
        }
    }
}

module.exports = { nodeClass: ConversationalRetrievalAgentToolkit_Agents }
