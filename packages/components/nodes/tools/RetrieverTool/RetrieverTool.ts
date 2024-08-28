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
            },
            {
                label: 'Return Titles',
                name: 'returnTitles',
                type: 'boolean',
                optional: true,
                default: false,
                additionalParams: true
            },
            {
                label: 'Return Image Links',
                name: 'returnImageLinks',
                type: 'boolean',
                optional: true,
                default: false,
                additionalParams: true
            },
            {
                label: 'Return as JSON',
                name: 'returnAsJson',
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
        const returnImageLinks = nodeData.inputs?.returnImageLinks as boolean
        const returnTitles = nodeData.inputs?.returnTitles as boolean
        const returnAsJson = nodeData.inputs?.returnAsJson as boolean

        const input = {
            name,
            description
        }

        const func = async ({ input }: { input: string }, runManager?: CallbackManagerForToolRun) => {
            const docs = await retriever.getRelevantDocuments(input, runManager?.getChild('retriever'))
            if (returnAsJson) {
                const content = JSON.stringify(
                    docs.map((doc) => processDocToObject(doc, returnSourceLinks, returnTitles, returnImageLinks))
                )
                const sourceDocuments = JSON.stringify(docs)
                return returnSourceDocuments ? content + SOURCE_DOCUMENTS_PREFIX + sourceDocuments : content
            } else {
                const content = docs.map((doc) => processDocToContent(doc, returnSourceLinks, returnTitles, returnImageLinks)).join('\n\n')
                const sourceDocuments = JSON.stringify(docs)
                return returnSourceDocuments ? content + SOURCE_DOCUMENTS_PREFIX + sourceDocuments : content
            }
        }

        const schema = z.object({
            input: z.string().describe(toolInputDescription || 'input to look up in retriever')
        }) as any

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

const processDocToContent = (doc: any, returnSourceLinks: boolean, returnTitles: boolean, returnImageLinks: boolean) => {
    const sections = []
    if (returnSourceLinks) {
        const sourceUrl = isValidURL(doc.metadata.source)
        if (sourceUrl) {
            const title = doc.metadata.title
            if (title) {
                sections.push(`[${title}](${sourceUrl})`)
            } else {
                sections.push(`[](${sourceUrl})`)
            }
        }
    }
    if (returnTitles && doc.metadata.title) {
        sections.push(doc.metadata.title)
    }
    sections.push(doc.pageContent)
    if (returnImageLinks && doc.metadata.image) {
        const imageUrl = isValidURL(doc.metadata.image)
        if (imageUrl) {
            sections.push(`![](${imageUrl})`)
        }
    }
    return sections.join('\n')
}

const processDocToObject = (doc: any, returnSourceLinks: boolean, returnTitles: boolean, returnImageLinks: boolean) => {
    const object: {
        source: string
        title?: string
        text: string
        image?: string
    } = {
        source: doc.metadata.source,
        text: doc.pageContent
    }

    if (returnTitles && doc.metadata.title) {
        object['title'] = doc.metadata.title
    }
    if (returnImageLinks && doc.metadata.image) {
        const imageUrl = isValidURL(doc.metadata.image)
        if (imageUrl) {
            object['image'] = `![](${imageUrl})`
        }
    }
    if (returnSourceLinks) {
        const sourceUrl = isValidURL(doc.metadata.source)
        if (sourceUrl) {
            const title = doc.metadata.title
            if (title) {
                object['source'] = `[${title}](${sourceUrl})`
            } else {
                object['source'] = `[](${sourceUrl})`
            }
        }
    }
    return object
}

module.exports = { nodeClass: Retriever_Tools }
