import { z } from 'zod'
import { DynamicStructuredTool } from '@langchain/core/tools'
import { CallbackManagerForToolRun } from '@langchain/core/callbacks/manager'
import { DynamicTool } from '@langchain/core/tools'
import { BaseRetriever } from '@langchain/core/retrievers'
import { INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses } from '../../../src/utils'
import { SOURCE_DOCUMENTS_PREFIX } from '../../../src/agents'

class Retriever_Tools implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    baseClasses: string[]
    credential: INodeParams
    inputs: INodeParams[]

    constructor() {
        this.label = 'Retriever Tool'
        this.name = 'retrieverTool'
        this.version = 2.0
        this.type = 'RetrieverTool'
        this.icon = 'retrievertool.svg'
        this.category = 'Tools'
        this.description = 'Use a retriever as allowed tool for agent'
        this.baseClasses = [this.type, 'DynamicTool', ...getBaseClasses(DynamicTool)]
        this.inputs = [
            {
                label: 'Retriever Name',
                name: 'name',
                type: 'string',
                placeholder: 'search_state_of_union'
            },
            {
                label: 'Retriever Description',
                name: 'description',
                type: 'string',
                description: 'When should agent uses to retrieve documents',
                rows: 3,
                placeholder: 'Searches and returns documents regarding the state-of-the-union.'
            },
            {
                label: 'Retriever',
                name: 'retriever',
                type: 'BaseRetriever'
            },
            {
                label: 'Return Source Documents',
                name: 'returnSourceDocuments',
                type: 'boolean',
                optional: true
            },
            {
                label: 'Tool Input Description',
                name: 'toolInputDescription',
                type: 'string',
                description: 'Description for the tool input',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Return Source Links',
                name: 'returnSourceLinks',
                type: 'boolean',
                optional: true,
                default: false,
                additionalParams: true
            }
        ]
    }

    async init(nodeData: INodeData): Promise<any> {
        const name = nodeData.inputs?.name as string
        const description = nodeData.inputs?.description as string
        const retriever = nodeData.inputs?.retriever as BaseRetriever
        const returnSourceDocuments = nodeData.inputs?.returnSourceDocuments as boolean
        const toolInputDescription = nodeData.inputs?.toolInputDescription as string
        const returnSourceLinks = nodeData.inputs?.returnSourceLinks as boolean

        const input = {
            name,
            description
        }

        const func = async ({ input }: { input: string }, runManager?: CallbackManagerForToolRun) => {
            const docs = await retriever.getRelevantDocuments(input, runManager?.getChild('retriever'))
            const content = docs.map((doc) => processDocToContent(doc, returnSourceLinks)).join('\n\n')
            const sourceDocuments = JSON.stringify(docs)
            return returnSourceDocuments ? content + SOURCE_DOCUMENTS_PREFIX + sourceDocuments : content
        }

        const schema = z.object({
            input: z.string().describe(toolInputDescription || 'query to look up in retriever')
        })

        const tool = new DynamicStructuredTool({ ...input, func, schema })
        return tool
    }
}

export const isValidURL = (url: string) => {
    try {
        return new URL(url)
    } catch (err) {
        return undefined
    }
}

const processDocToContent = (doc: any, returnSourceLinks: boolean) => {
    const content = doc.pageContent
    if (returnSourceLinks) {
        const url = isValidURL(doc.metadata.source)
        if (url) {
            const title = doc.metadata.title
            if (title) {
                return `[${title}](${url})\n${content}`
            } else {
                return `[](${url})\n${content}`
            }
        }
    }
    return content
}

module.exports = { nodeClass: Retriever_Tools }
